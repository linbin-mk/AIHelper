## MODIFIED Requirements

### Requirement: Project config data model
系统 SHALL 为每个Git项目源维护以下配置字段：唯一标识（自动生成）、项目名称、Git仓库地址（https:// 或 ssh:// 格式）、项目描述（可选，最多100字符）、鉴权方式（枚举：ssh_key / username_password）、凭证数据（SSH Key文本 或 账号密码JSON）。

#### Scenario: Create project config with username/password auth
- **WHEN** 用户添加项目并选择"账号密码"鉴权方式
- **THEN** 系统存储包含 username 和 password 字段的凭证对象

#### Scenario: Create project config with SSH key auth
- **WHEN** 用户添加项目并选择"SSH Key"鉴权方式
- **THEN** 系统存储包含 sshKey 字段的凭证对象

#### Scenario: Create project config with description
- **WHEN** 用户添加项目并填写了描述
- **THEN** 系统存储包含 `description` 字段的项目配置

### Requirement: Validation of project config
系统 SHALL 在保存项目配置前验证：项目名称非空且不超过100字符、Git地址非空且以 `https://`、`ssh://` 或 `git@` 开头、描述不超过100字符、鉴权方式必须为有效枚举值、凭证字段非空。

#### Scenario: Validate Git URL format
- **WHEN** 用户输入的Git地址不以 `https://`、`ssh://` 或 `git@` 开头
- **THEN** 系统拒绝保存并提示"请输入有效的Git仓库地址"

#### Scenario: Validate required credential
- **WHEN** 用户选择"SSH Key"但未填写SSH Key内容
- **THEN** 系统拒绝保存并提示"请输入SSH Key"

#### Scenario: Validate description length
- **WHEN** 用户输入超过100个字符的描述
- **THEN** 系统拒绝保存并提示"项目描述不能超过100个字符"
