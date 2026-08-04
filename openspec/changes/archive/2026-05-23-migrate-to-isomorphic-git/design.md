## Context

AI Helper 是 Chrome Manifest V3 扩展，当前资源管理模块（`resource.js`）通过 GitLab REST API 模拟 git 拉取操作。该方案存在以下问题：

- **平台绑定**：仅支持 GitLab，无法用于 GitHub、Bitbucket 等平台
- **稳定性差**：依赖 GitLab API 可用性，受速率限制影响，`findProjectId` 查询不稳定
- **功能受限**：不支持增量同步（依赖 API 返回的时间戳，不够精确）、无法获取提交历史
- **维护成本高**：自定义 URL 解析、认证处理、分页逻辑需要持续维护

`isomorphic-git@1.38.1` 已在项目中安装（`chrome-extension/node_modules/isomorphic-git/`）但未使用，最终通过标准 git 协议实现拉取。

Chrome MV3 扩展环境约束：
- Service Worker 生命周期有限，不支持长时间运行的原生进程
- 文件系统访问受限，但 IndexedDB 可用
- `fetch` API 可用，支持自定义请求头和认证

## Goals / Non-Goals

**Goals:**
- 使用 isomorphic-git 的 `clone()` 实现标准 git 浅克隆，替代 GitLab API 拉取
- 支持多平台（GitHub、GitLab、Bitbucket 及任何标准 git HTTP 服务）
- 支持多种认证方式：HTTP Basic Auth、Bearer Token、SSH Key
- 保持现有 IndexedDB 缓存结构和 AI 上下文工具接口不变
- 提供同步进度回调，适配现有 UI 进度展示
- 支持增量同步：通过对比 commit hash 判断是否需要更新

**Non-Goals:**
- 不实现完整的 git 工作流（commit、push、branch、merge）
- 不引入额外持久化依赖（如 LightningFS），使用轻量内存文件系统
- 不修改 `resource-manager-ui`、`ai-code-context` 规范的 UI 和工具接口
- 不改变项目配置的存储方式（仍使用 `chrome.storage.local`）
- 不提供离线 git 操作能力

## Decisions

### 1. 同步策略：浅克隆 (depth=1) + 内存文件系统

**选择**：每次同步使用 `isomorphic-git.clone({ depth: 1, singleBranch: true })` 进行浅克隆，使用轻量内存文件系统存储 git 对象，克隆完成后通过 `listFiles()` + `readBlob()` 提取文件内容写入 IndexedDB。

**理由**：
- `depth=1` 仅拉取最新提交，大幅减少 git 对象体积（通常 < 5MB）
- 内存文件系统避免引入额外 IndexedDB 依赖（如 LightningFS），简化实现
- 每次同步为干净克隆，无残留状态，稳定性最高
- 与现有"全量拉取"行为一致，对 AI 上下文工具无影响

**替代方案**：
- LightningFS 持久化：需额外安装 `@isomorphic-git/lightning-fs`，增加模块体积。当前项目无 npm 构建流程，降低引入复杂度。后续增量优化时可考虑。
- 深度克隆（无 depth 限制）：对象体积过大，不适合浏览器扩展环境。

### 2. 增量同步：commit hash 对比

**选择**：首次克隆时记录 `HEAD` commit hash 到项目配置的 `lastCommitHash` 字段。后续同步时通过 `fetch()` + `log()` 检查远程最新 commit hash，若与本地一致则跳过，否则重新浅克隆。

**理由**：
- commit hash 是 git 原生的变更判断方式，精确且跨平台
- 无需维护完整 git 对象历史即可判断是否有新提交
- 相比原方案依赖 GitLab API 时间戳更可靠

### 3. 模块拆分：独立 `git-ops.js` 模块

**选择**：从 `resource.js` 中抽离 git 操作逻辑到 `chrome-extension/src/panel/git-ops.js`，包含：
- `initGitFS()` - 初始化内存文件系统
- `cloneRepo(url, auth, onProgress)` - 克隆仓库，返回 commit hash + 文件列表
- `fetchRepo(fs, url, auth)` - 检查远程更新，获取最新 commit hash
- `extractFiles(fs, dir, commitHash)` - 从 git 对象提取源码文件
- `resolveBranch(fs, dir)` - 解析当前默认分支名

**理由**：
- `resource.js` 已达 1347 行，拆分提高可维护性
- git 操作逻辑独立测试和替换
- 其他模块可共享 git 操作能力

### 4. 认证：`onAuth` 回调统一处理

**选择**：使用 isomorphic-git 的 `onAuth` 回调处理所有认证场景，根据项目配置的 `authType`（`password` / `sshkey`）动态构造认证信息。

**理由**：
- isomorphic-git 原生支持 `onAuth`，可直接注入 HTTP headers 或 SSH credentials
- 统一认证入口，支持 Basic Auth (`username:password`) 和 Bearer Token
- SSH Key 认证可通过 `onAuth` 的 `ssh` 字段传入私钥

### 5. IndexedDB 数据隔离 key：项目名称

**选择**：使用项目名称（`projectName`）作为 IndexedDB 中 `files` 和 `trees` 存储的数据隔离 key，替代自动生成的 `projectId`。

**理由**：
- 项目名称为用户自定，稳定可读，不会因删除重建而改变
- 同一项目名称多次同步自然覆盖旧数据，无需额外迁移逻辑
- 配合英文-only 约束，避免中文编码导致的 key 不兼容问题

**约束**：项目名称 MUST 为纯英文（a-z, A-Z, 0-9, -, _, .），禁止中文和特殊字符，防止文件系统路径和编译工具链兼容性问题。

### 6. 文件过滤：复用现有逻辑 + gitattributes

**选择**：克隆后使用 `listFiles()` 获取完整文件列表，复用现有 `SOURCE_EXTENSIONS`、`SKIP_DIRS`、`BINARY_EXTENSIONS` 常量进行过滤。

**理由**：
- 保持与现有行为一致
- `listFiles()` 返回所有文件路径，客户端过滤性能可控
- 可逐步引入 `.gitattributes` 语言统计优化

## Risks / Trade-offs

- **[浅克隆限制]** 仅获取最新提交，无法按历史版本检索代码 → 当前场景下仅需最新代码，无需历史版本
- **[内存占用]** 浅克隆的文件系统和对象数据暂存内存（~50MB/中等项目）→ 同步完成后立即释放，仅保留 IndexedDB 中的源码文件（~5-10MB），内存峰值可接受
- **[SSH Key 复杂性]** isomorphic-git 的 SSH 认证需额外配置 `onAuth` 回调 → 优先支持 HTTP Basic Auth 和 Token，SSH Key 作为后续增强
- **[大仓库性能]** 超大型仓库（10,000+ 文件）首次浅克隆可能较慢 → 增加并发文件提取（`MAX_SYNC_CONCURRENCY`）复用现有并发机制，后续可引入 sparse checkout

## Migration Plan

1. 创建 `git-ops.js` 模块，实现 `cloneRepo` + `extractFiles` 核心功能
2. 修改 `resource.js` 的 `syncProject()` 函数，用 `git-ops.cloneRepo()` 替换 `GitLabAPI` 调用
3. 删除旧的 `GitLabAPI` 代码（`findProjectId`、`fetchTree`、`fetchFileContent`、`buildHeaders`），统一使用 isomorphic-git
4. 将 IndexedDB 数据隔离 key 从 `projectId` 切换为 `projectName`，修改 `FileCacheManager` / `TreeCacheManager` 接口签名
5. 新增项目名称英文-only 验证规则，更新 `validateProjectConfig()` 和表单 UI 提示
6. 更新项目配置数据模型，添加 `lastCommitHash` 字段
7. 更新 `parseGitUrl()` 以支持非 GitLab 平台的 URL 解析
8. 测试现有项目同步功能，验证 IndexedDB 缓存格式兼容性

## Open Questions

- 是否需要支持 `sparse checkout` 以优化大仓库同步性能？（当前过滤逻辑在克隆后执行，后续可移到克隆前）
- 是否需要缓存 git 对象以便下次增量 `fetch` 而非重新克隆？（当前浅克隆已足够快，后续按需优化）
