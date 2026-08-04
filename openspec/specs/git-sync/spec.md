## Requirements

### Requirement: Fetch repository file tree via git clone
系统 SHALL 通过 isomorphic-git 的 `clone`（depth=1）操作获取指定仓库的完整文件树。对于 `https://`、`ssh://`、`git@` 格式的地址，MUST 解析出 git HTTP endpoint，使用标准 git 智能 HTTP 协议获取仓库内容。支持 GitHub、GitLab、Bitbucket 等标准 git 托管平台。

#### Scenario: Fetch complete file tree via git clone
- **WHEN** 用户触发项目同步
- **THEN** 系统通过 isomorphic-git 执行深度为 1 的浅克隆
- **AND** 使用 `listFiles()` 获取完整的文件路径列表
- **AND** 过滤后缓存到 IndexedDB 的 `trees` 对象存储

#### Scenario: Fetch recursive file tree
- **WHEN** 用户触发完整同步或文件夹展开
- **THEN** 系统获取 `listFiles()` 返回的所有文件路径，客户端跳过 `.git`、`node_modules`、`dist`、`build`、`vendor` 等非源码目录
- **AND** 构建嵌套树结构并缓存

#### Scenario: Handle authentication failure
- **WHEN** git HTTP 请求返回 401 Unauthorized
- **THEN** 系统停止同步并在项目中显示"认证失败，请检查鉴权信息"

### Requirement: Fetch file content via git readBlob
系统 SHALL 通过 isomorphic-git 的 `readBlob` 方法获取指定文件的原始内容。对于文本文件（.js, .ts, .vue, .java, .xml, .json, .yaml, .md, .css, .html 等），MUST 获取完整内容并缓存；对于二进制文件（图片、字体等），MUST 跳过获取。

#### Scenario: Fetch source file content
- **WHEN** 系统获取到文件路径列表后
- **THEN** 系统通过 isomorphic-git `readBlob` 获取每个源码文件的 blob 内容
- **AND** 将文件路径、内容写入 IndexedDB 的 `files` 对象存储，以 `projectName` 作为数据隔离 key

#### Scenario: Skip binary files
- **WHEN** 文件扩展名为 .png, .jpg, .gif, .woff2, .ttf 等二进制格式
- **THEN** 系统不获取该文件内容，仅记录文件路径

### Requirement: Incremental sync via commit hash comparison
系统 SHALL 支持增量同步，比较远程 HEAD commit hash 与本地存储的 `lastCommitHash`，仅在 hash 不同时才重新克隆。首次同步时 MUST 全量拉取。

#### Scenario: Incremental sync detects no changes
- **WHEN** 用户对已同步的项目再次点击同步
- **THEN** 系统通过 isomorphic-git 获取远程 HEAD commit hash
- **AND** 若与本地 `lastCommitHash` 一致，跳过拉取，提示"已是最新代码"

#### Scenario: Incremental sync detects changes
- **WHEN** 远程 HEAD commit hash 与本地 `lastCommitHash` 不同
- **THEN** 系统重新执行浅克隆并更新 IndexedDB 缓存

#### Scenario: First-time full sync
- **WHEN** 项目首次同步且 IndexedDB 中无缓存
- **THEN** 系统全量拉取所有符合条件的文件

### Requirement: Code content storage in IndexedDB
系统 SHALL 使用 IndexedDB 存储项目代码缓存，包含以下对象存储：`files`（文件路径、内容、projectName、最后更新时间）、`trees`（projectName、目录树JSON、最后更新时间）。每个项目数据 MUST 按 projectName 隔离。

#### Scenario: Store file in IndexedDB
- **WHEN** 系统成功获取文件内容
- **THEN** 系统将文件信息写入 IndexedDB 的 `files` 对象存储

#### Scenario: Query files by project
- **WHEN** AI 工具需要查询某个项目的文件
- **THEN** 系统通过 IndexedDB 索引按 projectName 快速检索文件

### Requirement: Sync progress reporting
系统 SHALL 在同步过程中实时报告进度：已获取文件数/总文件数、当前正在拉取的文件路径、预估剩余时间。进度信息 MUST 通过消息机制通知 resource.js 更新 UI。

#### Scenario: Report sync progress
- **WHEN** 同步过程中每拉取完一个文件
- **THEN** 系统向资源管理视图发送进度更新消息，UI 更新进度条和当前文件名

### Requirement: Authentication via git onAuth callback
系统 SHALL 使用 isomorphic-git 的 `onAuth` 回调处理认证。对于"账号密码"鉴权方式，MUST 注入 HTTP Basic Auth 头（`Authorization: Basic <base64(username:password)>`）。对于 Personal Access Token（以"账号密码"方式填入 token 作为密码），MUST 通过 `onAuth` 返回 `{ username, password }` 由 isomorphic-git 自动生成 Basic Auth 头。

#### Scenario: Authenticate with username/password
- **WHEN** 用户配置了账号密码鉴权
- **THEN** `onAuth` 回调返回 `{ username, password }`，isomorphic-git 自动生成 Basic Auth 头

#### Scenario: Authenticate with personal access token
- **WHEN** 用户配置了 Personal Access Token（以"账号密码"方式填入 token 作为密码，用户名为空或固定值）
- **THEN** `onAuth` 回调返回 `{ username: 'oauth2', password: token }` 或对应平台格式

### Requirement: File type filtering
系统 SHALL 仅同步源码类型的文件，过滤掉二进制文件、依赖包目录、构建产物目录。支持的文件扩展名 MUST 包括：.js, .ts, .tsx, .jsx, .vue, .java, .xml, .json, .yaml, .yml, .md, .css, .scss, .less, .html, .py, .go, .rs, .sql, .properties, .gradle, .proto。MUST 跳过目录：node_modules, dist, build, .git, target, vendor, __pycache__, .idea, .vscode。

#### Scenario: Filter out dependency directories
- **WHEN** 获取到文件树包含 `node_modules/` 路径
- **THEN** 系统跳过该路径及其所有子路径，不获取内容
