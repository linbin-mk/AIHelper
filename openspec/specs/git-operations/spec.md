## ADDED Requirements

### Requirement: Clone repository via isomorphic-git
系统 SHALL 使用 isomorphic-git 的 `clone` 方法对 Git 仓库执行浅克隆（depth=1, singleBranch=true），使用内存文件系统暂存 git 对象。克隆完成后 MUST 返回 HEAD commit hash 和文件路径列表。

#### Scenario: Successful shallow clone with HTTP Basic Auth
- **WHEN** 系统使用 HTTPS URL 和 username/password 凭证调用 cloneRepo
- **THEN** 系统通过 `onAuth` 回调注入 `Authorization: Basic <base64>` 请求头
- **AND** isomorphic-git 完成浅克隆，返回 commit hash 和文件清单

#### Scenario: Successful shallow clone with Bearer Token
- **WHEN** 系统使用 HTTPS URL 和 Personal Access Token 调用 cloneRepo
- **THEN** 系统通过 `onAuth` 回调注入 `Authorization: Bearer <token>` 或平台特定头（如 `PRIVATE-TOKEN`）
- **AND** isomorphic-git 完成浅克隆

#### Scenario: Clone with GitHub URL
- **WHEN** Git 地址为 `https://github.com/user/repo.git`
- **THEN** 系统使用 isomorphic-git 标准 HTTP 协议完成克隆
- **AND** 不再依赖 GitLab API 端点

#### Scenario: Clone failure with invalid credentials
- **WHEN** 认证凭证无效导致 git HTTP 请求返回 401
- **THEN** 系统抛出认证失败错误，UI 显示"认证失败，请检查鉴权信息"

#### Scenario: Clone failure with unreachable host
- **WHEN** git 服务器不可达或 URL 无效
- **THEN** 系统抛出网络错误，UI 显示"无法连接到仓库，请检查Git地址"

### Requirement: Extract source files from git objects
系统 SHALL 在浅克隆完成后，使用 isomorphic-git 的 `listFiles` 获取所有文件路径，对匹配 `SOURCE_EXTENSIONS` 的文件使用 `readBlob` 读取内容并转为 UTF-8 文本，跳过 `SKIP_DIRS` 和 `BINARY_EXTENSIONS` 中的文件。提取过程 MUST 支持并发控制（`MAX_SYNC_CONCURRENCY`）。

#### Scenario: Extract text source files
- **WHEN** 克隆完成后文件列表包含 `src/main.js`, `src/style.css`, `README.md`
- **THEN** 系统读取每个文件的 blob 内容，转为 UTF-8 字符串
- **AND** 返回 `[{path, content}]` 数组

#### Scenario: Skip binary files
- **WHEN** 文件列表包含 `logo.png`, `font.woff2`
- **THEN** 系统跳过这些文件，不读取 blob 内容

#### Scenario: Skip dependency directories
- **WHEN** 文件列表包含 `node_modules/react/index.js`
- **THEN** 系统跳过该路径，不提取内容

### Requirement: Memory filesystem management for git operations
系统 SHALL 为每次同步操作创建独立的内存文件系统实例，克隆完成后提取文件到 IndexedDB，然后释放文件系统实例。MUST 确保同步失败时也能清理内存。

#### Scenario: Create and dispose memory filesystem
- **WHEN** 系统开始同步操作
- **THEN** 创建新的内存文件系统实例（`Map`-based）
- **AND** 同步完成或失败后释放该实例

### Requirement: Commit-based incremental sync
系统 SHALL 在项目配置中存储 `lastCommitHash` 字段，每次同步完成后更新。下次同步时，MUST 先通过 `fetch` + `log` 检查远程 HEAD commit hash，若与本地一致则跳过拉取。

#### Scenario: No new commits - skip sync
- **WHEN** 项目已同步过且远程 HEAD commit hash 与本地 `lastCommitHash` 一致
- **THEN** 系统跳过克隆操作，UI 提示"已是最新代码"

#### Scenario: New commits detected - trigger clone
- **WHEN** 远程 HEAD commit hash 与本地 `lastCommitHash` 不同
- **THEN** 系统执行浅克隆并更新 IndexedDB 缓存
- **AND** 更新 `lastCommitHash` 到项目配置

### Requirement: Sync progress via isomorphic-git events
系统 SHALL 通过 isomorphic-git 的 `onProgress` 回调获取同步进度，转换为 `{ phase, loaded, total }` 格式，通知 UI 更新进度条。

#### Scenario: Report clone progress
- **WHEN** isomorphic-git 克隆过程中触发 `onProgress` 事件
- **THEN** 系统将事件数据映射为 UI 进度消息（阶段、已处理对象数、总对象数）
- **AND** UI 更新进度条和状态文本
