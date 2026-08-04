## Requirements

### Requirement: Project config data model
系统 SHALL 为每个Git项目源维护以下配置字段：唯一标识（自动生成）、项目名称（必填，纯英文/数字/连字符/下划线，最多100字符）、Git仓库地址（https://、ssh:// 或 git@ 格式）、项目描述（可选，最多100字符）、鉴权方式（固定为 password）、凭证数据（username + password JSON）、最后同步 commit hash（`lastCommitHash`，可选，用于增量同步判断）。IndexedDB 中 MUST 以项目名称（`projectName`）作为数据隔离 key，替代自动生成的 projectId。

#### Scenario: Create project config with username/password auth
- **WHEN** 用户添加项目并选择"密码/Token"鉴权方式
- **THEN** 系统存储包含 `username` 和 `password` 字段的凭证对象
- **AND** `authType` 存储为 `password`

#### Scenario: Create project config with description
- **WHEN** 用户添加项目并填写了描述
- **THEN** 系统存储包含 `description` 字段的项目配置

#### Scenario: Update lastCommitHash after sync
- **WHEN** 项目同步完成
- **THEN** 系统更新项目配置中的 `lastCommitHash` 字段为当前 HEAD commit hash

### Requirement: Persistent storage of project configs
系统 SHALL 将所有项目配置持久化到 `chrome.storage.local`，键名为 `ai_helper_git_projects`。添加、编辑、删除操作 MUST 立即同步到存储。

#### Scenario: Save new project to storage
- **WHEN** 用户提交一个新项目配置
- **THEN** 系统将项目配置追加到 `ai_helper_git_projects` 数组并写入 `chrome.storage.local`

#### Scenario: Load projects on panel open
- **WHEN** Side Panel 初始化
- **THEN** 系统从 `chrome.storage.local` 读取 `ai_helper_git_projects` 并渲染项目列表

### Requirement: Validation of project config
系统 SHALL 在保存项目配置前验证：项目名称非空且不超过100字符、Git地址非空且以 `https://`、`ssh://` 或 `git@` 开头、描述不超过100字符、鉴权方式必须为 password、凭证字段非空。

#### Scenario: Validate Git URL format
- **WHEN** 用户输入的Git地址不以 `https://`、`ssh://` 或 `git@` 开头
- **THEN** 系统拒绝保存并提示"请输入有效的Git仓库地址"

#### Scenario: Validate required credential
- **WHEN** 用户添加项目但未填写密码/PAT Token
- **THEN** 系统拒绝保存并提示"请输入密码/PAT Token"

#### Scenario: Validate description length
- **WHEN** 用户输入超过100个字符的描述
- **THEN** 系统拒绝保存并提示"项目描述不能超过100个字符"

### Requirement: Project name English-only validation
系统 SHALL 在保存项目配置前验证项目名称仅包含英文字母（a-z, A-Z）、数字（0-9）、连字符（-）、下划线（_）、点号（.）。MUST 拒绝包含中文、空格或其他非 ASCII 字符的名称，提示"项目名称仅支持英文、数字、连字符和下划线"。

#### Scenario: Valid English project name
- **WHEN** 用户输入项目名称 `my-frontend-app`
- **THEN** 系统通过验证，允许保存

#### Scenario: Invalid Chinese project name
- **WHEN** 用户输入项目名称 `我的前端项目`
- **THEN** 系统拒绝保存并提示"项目名称仅支持英文、数字、连字符和下划线"

#### Scenario: Invalid name with spaces
- **WHEN** 用户输入项目名称 `my project`
- **THEN** 系统拒绝保存并提示"项目名称仅支持英文、数字、连字符和下划线"

### Requirement: Credential masking in UI
系统 SHALL 在项目列表和编辑表单中对凭证信息进行脱敏显示。密码字段显示为 `****`。仅在用户主动进入编辑模式且点击"显示"按钮时才展示完整凭证。

#### Scenario: Display masked credential in project card
- **WHEN** 项目列表渲染
- **THEN** 凭证信息显示为脱敏格式（密码显示 `****`）

### Requirement: IndexedDB key by project name
系统 SHALL 使用项目名称（`projectName`）作为 IndexedDB 中 `files` 和 `trees` 对象存储的数据隔离 key，替代自动生成的 `projectId`。同一项目名称的多次同步 MUST 覆盖旧缓存数据。

#### Scenario: Store files by project name
- **WHEN** 项目名称为 `my-app` 的同步完成
- **THEN** 系统将文件写入 IndexedDB，`projectName` 字段值为 `my-app`
- **AND** `trees` 存储以 `my-app` 为 keyPath

#### Scenario: Re-sync overwrites old data
- **WHEN** 项目名称为 `my-app` 再次同步
- **THEN** 系统清除 `my-app` 的旧文件缓存，写入新数据

### Requirement: Multi-platform git URL support
系统 SHALL 支持解析多平台 git URL 格式（GitHub、GitLab、Bitbucket、Gitee 等），`parseGitUrl()` MUST 提取 git HTTP endpoint 用于 isomorphic-git 通信，不再仅解析 GitLab 项目路径。

#### Scenario: Parse GitHub URL
- **WHEN** Git 地址为 `https://github.com/user/repo.git`
- **THEN** `parseGitUrl()` 返回 `{ url: 'https://github.com/user/repo.git', platform: 'github' }`

#### Scenario: Parse GitLab URL
- **WHEN** Git 地址为 `https://gitlab.example.com/group/project.git`
- **THEN** `parseGitUrl()` 返回 `{ url: 'https://gitlab.example.com/group/project.git', platform: 'gitlab' }`

#### Scenario: Parse SSH-style URL
- **WHEN** Git 地址为 `git@github.com:user/repo.git`
- **THEN** `parseGitUrl()` 返回 `{ url: 'https://github.com/user/repo.git', platform: 'github' }`
