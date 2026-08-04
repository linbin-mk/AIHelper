## ADDED Requirements

### Requirement: Project config data model
系统 SHALL 为每个Git项目源维护以下配置字段：唯一标识（自动生成）、项目名称、Git仓库地址（https:// 或 ssh:// 格式）、鉴权方式（枚举：ssh_key / username_password）、凭证数据（SSH Key文本 或 账号密码JSON）。

#### Scenario: Create project config with username/password auth
- **WHEN** 用户添加项目并选择"账号密码"鉴权方式
- **THEN** 系统存储包含 username 和 password 字段的凭证对象

#### Scenario: Create project config with SSH key auth
- **WHEN** 用户添加项目并选择"SSH Key"鉴权方式
- **THEN** 系统存储包含 sshKey 字段的凭证对象

### Requirement: Persistent storage of project configs
系统 SHALL 将所有项目配置持久化到 `chrome.storage.local`，键名为 `ai_helper_git_projects`。添加、编辑、删除操作 MUST 立即同步到存储。

#### Scenario: Save new project to storage
- **WHEN** 用户提交一个新项目配置
- **THEN** 系统将项目配置追加到 `ai_helper_git_projects` 数组并写入 `chrome.storage.local`

#### Scenario: Load projects on panel open
- **WHEN** Side Panel 初始化
- **THEN** 系统从 `chrome.storage.local` 读取 `ai_helper_git_projects` 并渲染项目列表

### Requirement: Validation of project config
系统 SHALL 在保存项目配置前验证：项目名称非空且不超过100字符、Git地址非空且以 `https://`、`ssh://` 或 `git@` 开头、鉴权方式必须为有效枚举值、凭证字段非空。

#### Scenario: Validate Git URL format
- **WHEN** 用户输入的Git地址不以 `https://`、`ssh://` 或 `git@` 开头
- **THEN** 系统拒绝保存并提示"请输入有效的Git仓库地址"

#### Scenario: Validate required credential
- **WHEN** 用户选择"SSH Key"但未填写SSH Key内容
- **THEN** 系统拒绝保存并提示"请输入SSH Key"

### Requirement: Credential masking in UI
系统 SHALL 在项目列表和编辑表单中对凭证信息进行脱敏显示。密码字段显示为 `****`，SSH Key 显示前20个字符后跟 `...`。仅在用户主动进入编辑模式且点击"显示"按钮时才展示完整凭证。

#### Scenario: Display masked credential in project card
- **WHEN** 项目列表渲染
- **THEN** 凭证信息显示为脱敏格式（密码显示 `****`，SSH Key 显示截断文本）

### Requirement: Config import/export (stretch goal)
系统 MAY 支持项目配置的导入和导出，导出时 MUST 不包含凭证信息，仅包含名称和地址。导入时用户需重新填写凭证信息。
