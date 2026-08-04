## ADDED Requirements

### Requirement: Fetch repository file tree via API
系统 SHALL 通过 GitLab API 获取指定仓库的目录树结构。对于 `https://gitlab.example.com/` 格式的地址，MUST 解析出 base URL 和项目路径，构造 `/api/v4/projects/:id/repository/tree` 请求。支持分页获取深层目录。

#### Scenario: Fetch top-level directory tree
- **WHEN** 用户触发项目同步
- **THEN** 系统调用 GitLab API 获取项目根目录的文件树（depth=1）
- **AND** 将文件列表缓存到 IndexedDB

#### Scenario: Fetch recursive file tree
- **WHEN** 用户触发完整同步或文件夹展开
- **THEN** 系统递归获取所有子目录的文件树，跳过 `.git`、`node_modules`、`dist`、`build`、`vendor` 等非源码目录

#### Scenario: Handle API authentication failure
- **WHEN** GitLab API 返回 401 Unauthorized
- **THEN** 系统停止同步并在项目中显示"认证失败，请检查鉴权信息"

### Requirement: Fetch file content via API
系统 SHALL 通过 GitLab API 获取指定文件的原始内容。对于文本文件（.js, .ts, .vue, .java, .xml, .json, .yaml, .md, .css, .html 等），MUST 获取完整内容并缓存；对于二进制文件（图片、字体等），MUST 跳过获取。

#### Scenario: Fetch source file content
- **WHEN** 系统获取到文件路径列表后
- **THEN** 系统通过 GitLab API 获取每个源码文件的原始内容
- **AND** 将文件路径、内容和最后更新时间写入 IndexedDB

#### Scenario: Skip binary files
- **WHEN** 文件扩展名为 .png, .jpg, .gif, .woff2, .ttf 等二进制格式
- **THEN** 系统不获取该文件内容，仅记录文件路径和大小

### Requirement: Incremental sync
系统 SHALL 支持增量同步，仅在文件的上次提交时间晚于本地缓存时间时才重新获取文件内容。首次同步时 MUST 全量拉取。

#### Scenario: Incremental sync detects changes
- **WHEN** 用户对已同步的项目再次点击同步
- **THEN** 系统对比 GitLab API 返回的文件最新提交时间与 IndexedDB 中的缓存时间
- **AND** 仅更新有变更的文件

#### Scenario: First-time full sync
- **WHEN** 项目首次同步且 IndexedDB 中无缓存
- **THEN** 系统全量拉取所有符合条件的文件

### Requirement: Code content storage in IndexedDB
系统 SHALL 使用 IndexedDB 存储项目代码缓存，包含以下对象存储：`files`（文件路径、内容、项目ID、最后更新时间）、`trees`（项目ID、目录树JSON、最后更新时间）。每个项目数据 MUST 按 projectId 隔离。

#### Scenario: Store file in IndexedDB
- **WHEN** 系统成功从 API 获取文件内容
- **THEN** 系统将文件信息写入 IndexedDB 的 `files` 对象存储

#### Scenario: Query files by project
- **WHEN** AI 工具需要查询某个项目的文件
- **THEN** 系统通过 IndexedDB 索引按 projectId 快速检索文件

### Requirement: Sync progress reporting
系统 SHALL 在同步过程中实时报告进度：已获取文件数/总文件数、当前正在拉取的文件路径、预估剩余时间。进度信息 MUST 通过消息机制通知 resource.js 更新 UI。

#### Scenario: Report sync progress
- **WHEN** 同步过程中每拉取完一个文件
- **THEN** 系统向资源管理视图发送进度更新消息，UI 更新进度条和当前文件名

### Requirement: Authentication via GitLab API
系统 SHALL 使用用户配置的凭证调用 GitLab API。对于"账号密码"鉴权方式，MUST 使用 HTTP Basic Auth（base64(username:password)）或 Personal Access Token（存储时预先转换）。对于"SSH Key"鉴权方式（当前版本限制），SHALL 提示用户改为提供 Personal Access Token。

#### Scenario: Authenticate with username/password
- **WHEN** 用户配置了账号密码鉴权
- **THEN** 系统在 API 请求头中加入 `Authorization: Basic <base64(username:password)>`

#### Scenario: Authenticate with personal access token
- **WHEN** 用户配置了 Personal Access Token（以"账号密码"方式填入 token 作为密码，用户名为空或固定值）
- **THEN** 系统在 API 请求头中加入 `PRIVATE-TOKEN: <token>`

### Requirement: Project URL to API project ID resolution
系统 SHALL 解析 Git 仓库地址，提取 GitLab base URL 和项目路径，通过编码后的项目路径（`encodeURIComponent` 处理 `/`）调用 API 获取项目元数据。

#### Scenario: Parse HTTPS GitLab URL
- **WHEN** Git 地址为 `https://gitlab.example.com/example-group/example-project`
- **THEN** 系统解析出 baseUrl=`https://gitlab.example.com`，projectPath=`example-group/example-project`
- **AND** 调用 `GET /api/v4/projects?search=<projectPath>` 查找项目ID

### Requirement: File type filtering
系统 SHALL 仅同步源码类型的文件，过滤掉二进制文件、依赖包目录、构建产物目录。支持的文件扩展名 MUST 包括：.js, .ts, .tsx, .jsx, .vue, .java, .xml, .json, .yaml, .yml, .md, .css, .scss, .less, .html, .py, .go, .rs, .sql, .properties, .gradle, .proto。MUST 跳过目录：node_modules, dist, build, .git, target, vendor, __pycache__, .idea, .vscode。

#### Scenario: Filter out dependency directories
- **WHEN** 获取到文件树包含 `node_modules/` 路径
- **THEN** 系统跳过该路径及其所有子路径，不获取内容
