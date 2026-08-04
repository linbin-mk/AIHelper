## Context

AI Helper 是一个 Chrome 浏览器扩展（Manifest V3），当前 Side Panel 包含"请求监控"、"AI聊天"、"配置"三个Tab。AI聊天通过注入网络请求数据提供上下文，但缺少项目源代码信息。

Chrome MV3扩展环境限制：
- Service Worker 无法运行原生进程，无法调用 `git` 命令行
- `chrome.storage.local` 有约10MB限制，不适合存储大量代码文件
- 文件系统访问权限受限，无法直接写入用户磁盘任意路径
- 可以使用 `fetch` API 访问 GitLab REST API 获取仓库内容

本设计基于现有架构扩展，遵循原生 JavaScript + Chrome Extension API 的技术栈约定，不引入外部依赖。

## Goals / Non-Goals

**Goals:**
- 在 Side Panel 中新增"资源管理"Tab，提供项目配置和同步的完整UI
- 支持通过 GitLab API 获取 Git 仓库的文件结构和内容
- 项目配置持久化到 `chrome.storage.local`
- 代码内容缓存到 IndexedDB，支持增量更新
- AI聊天可通过工具调用搜索已管理项目的代码，注入相关上下文
- 提供"一键同步最新代码"按钮，批量更新所有项目的缓存

**Non-Goals:**
- 不支持本地 Git 命令行操作（clone/pull 通过 GitLab API 模拟）
- 不支持非 GitLab 平台的仓库（如 GitHub、纯 git:// 协议）
- 不提供代码编辑器功能
- 不修改现有"请求监控"和"AI聊天"的核心逻辑，仅做扩展

## Decisions

### 1. Git 仓库访问：GitLab API 替代原生 Git

**选择**: 通过 GitLab REST API (`/api/v4/projects/:id/repository/tree` 和 `/api/v4/projects/:id/repository/files/:path`) 获取仓库文件树和内容，而不是尝试在浏览器环境中运行原生 Git。

**理由**: Chrome MV3 扩展无法调用系统命令行，WASM-based Git 库体积大且对 SSH 支持有限。GitLab API 是标准接口，两个目标仓库都部署在 GitLab 上，兼容性好。

**替代方案**: 
- 原生消息主机（Native Messaging Host）: 需要用户额外安装本地程序，复杂度高，不适合轻量级插件。
- WASM Git (isomorphic-git): 支持有限，SSH key 认证实现复杂，文件存储需要特殊处理。

### 2. 鉴权方式：Personal Access Token + Basic Auth

**选择**: 
- "账号密码"方式使用 Basic Auth + GitLab API，或引导用户生成 Personal Access Token（PAT）后输入
- "SSH Key"方式暂存 SSH Key 文本，标注为"需配合原生 Git 使用"（当前版本不支持 SSH Key 进行 API 调用）

**理由**: GitLab API 主要认证方式为 PAT 和 Basic Auth。SSH Key 仅用于 git+ssh 协议，在纯浏览器环境中无法直接使用。UI 上保留 SSH Key 选项是为未来扩展预留，当前实际使用 PAT 或账号密码。

### 3. 代码存储：IndexedDB

**选择**: 文件内容和目录树缓存到 IndexedDB，项目配置存储到 `chrome.storage.local`。

**理由**: 
- IndexedDB 存储上限远大于 `chrome.storage.local`（通常为可用磁盘空间的60%），适合存储大量文件内容
- `chrome.storage.local` 仅存储配置元数据（projects 列表、auth 信息），保持轻量
- IndexedDB 支持索引查询，便于按文件路径、项目ID快速检索

**替代方案**: 
- `chrome.storage.local` 全部存储: 有10MB硬限制，不适合代码文件
- Cache API: 设计用于HTTP响应缓存，不适合结构化文件存储

### 4. AI 上下文集成：工具调用 + 动态注入

**选择**: 在 chat.js 中新增 `search_project_code` 工具函数，AI Agent 可主动调用该工具查询指定项目的文件内容。系统消息中注入项目摘要（项目名、文件树前3层、关键文件路径）。

**理由**: 将完整代码直接注入上下文会超出 token 限制，工具调用模式让 AI 按需检索，更高效。这与现有的 `get_captured_requests` 工具模式一致。

### 5. Tab UI 结构

**选择**: 在现有 Tab 栏中新增"资源管理"按钮，内容区域使用独立的 `#tab-resource` 容器，管理逻辑放在 `resource.js`。

**理由**: 与现有"请求监控"、"AI聊天"、"配置"的 Tab 模式保持一致，便于维护。

## Risks / Trade-offs

- **[网络依赖]** Git 仓库内容完全依赖 API 访问，离线状态下无法查看代码 → 已缓存的代码在 IndexedDB 中仍可访问，离线时降级为使用缓存数据
- **[认证安全]** Personal Access Token 或密码存储在 `chrome.storage.local` 中，虽然 Chrome 对扩展存储有隔离保护，但未加密存储存在泄露风险 → 方案文档中提示用户使用最小权限的 PAT（只读 repository），未来可添加 WebCrypto API 加密
- **[API 速率限制]** 大型仓库首次拉取可能触发 GitLab API 速率限制 → 初次同步时增加请求间延迟（500ms），分批拉取，优先拉取关键文件（src 目录），非源码文件（node_modules、dist、.git 等）通过 .gitignore 模式过滤
- **[存储空间]** 多个大型项目可能导致 IndexedDB 占用过多磁盘空间 → 提供项目级别的清除缓存功能，设置单个项目最大存储上限（100MB）
