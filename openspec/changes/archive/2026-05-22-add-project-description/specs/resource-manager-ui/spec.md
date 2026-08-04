## MODIFIED Requirements

### Requirement: Add project form
系统 SHALL 提供"添加项目"表单，包含以下字段：项目名称（必填）、Git仓库地址（必填，支持 https:// 和 ssh:// 开头）、分支名称（可选）、鉴权方式（SSH Key / 账号密码 二选一）、鉴权凭证输入框、项目描述（可选，最多100字符）。提交时 MUST 验证必填字段、地址格式和描述长度。

#### Scenario: Open add project form
- **WHEN** 用户点击"添加项目"按钮或点击项目列表中的"+"按钮
- **THEN** 系统展开或弹出添加项目表单，表单末尾包含描述输入框和字数计数

#### Scenario: Submit valid project config
- **WHEN** 用户填写完整项目信息（名称、有效地址、鉴权方式及凭证）并提交
- **THEN** 系统保存项目配置（包含描述），关闭表单，项目列表刷新显示新项目

#### Scenario: Submit with validation errors
- **WHEN** 用户提交时名称或地址为空，或地址格式无效，或描述超长
- **THEN** 系统在对应字段旁显示红色错误提示，不保存配置

### Requirement: Edit and delete project
系统 SHALL 支持编辑已配置项目的名称、地址、鉴权信息和描述，以及删除项目及其缓存数据。编辑时 MUST 保留原有鉴权凭证（如未修改则不清空）。删除时 MUST 同时清除该项目在 IndexedDB 中的缓存数据。

#### Scenario: Edit project configuration
- **WHEN** 用户点击项目卡片上的编辑按钮，修改信息后提交
- **THEN** 系统更新该项目的配置（含描述字段），不改变未修改的凭证字段

#### Scenario: Delete project
- **WHEN** 用户点击删除按钮并确认删除
- **THEN** 系统移除该项目配置，并从 IndexedDB 中清除该项目所有缓存文件

### Requirement: Project list display
系统 SHALL 在资源管理视图中展示所有已配置的Git项目列表，每个项目显示名称、Git地址（截断显示）、描述摘要（如有，超过30字截断）、最近同步时间和同步状态（待同步/同步中/已同步/同步失败）。

#### Scenario: Empty project list
- **WHEN** 用户首次打开资源管理Tab且未配置任何项目
- **THEN** 系统显示空状态提示"暂无项目资源，点击下方按钮添加"

#### Scenario: Project list with items
- **WHEN** 用户已配置至少一个项目
- **THEN** 系统以卡片列表形式展示所有项目，每张卡片包含项目名称、地址摘要、描述摘要（如有）、最后同步时间、同步状态标签

#### Scenario: Project card with long description
- **WHEN** 项目描述超过30个字符
- **THEN** 项目卡片显示截断的描述，末尾添加 `...`
