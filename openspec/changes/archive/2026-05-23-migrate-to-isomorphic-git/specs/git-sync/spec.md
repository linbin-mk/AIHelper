## MODIFIED Requirements

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

### Requirement: Authentication via git onAuth callback
系统 SHALL 使用 isomorphic-git 的 `onAuth` 回调处理认证。对于"账号密码"鉴权方式，MUST 注入 HTTP Basic Auth 头（`Authorization: Basic <base64(username:password)>`）。对于 Personal Access Token（以"账号密码"方式填入 token 作为密码），MUST 注入 `Authorization: Bearer <token>` 或平台特定头。对于"SSH Key"鉴权方式（后续增强），SHALL 在 `onAuth` 回调中提供 SSH 私钥。

#### Scenario: Authenticate with username/password
- **WHEN** 用户配置了账号密码鉴权
- **THEN** `onAuth` 回调返回 `{ username, password }`，isomorphic-git 自动生成 Basic Auth 头

#### Scenario: Authenticate with personal access token
- **WHEN** 用户配置了 Personal Access Token（以"账号密码"方式填入 token 作为密码，用户名为空或固定值）
- **THEN** `onAuth` 回调返回 `{ username: 'oauth2', password: token }` 或对应平台格式

## REMOVED Requirements

### Requirement: Project URL to API project ID resolution
**Reason**: 不再使用 GitLab API 获取项目元数据，isomorphic-git 直接使用 git URL 通信。
**Migration**: 移除 `GitLabAPI.findProjectId()` 方法，`parseGitUrl()` 改为提取 git HTTP endpoint 而非 GitLab 项目 ID。
