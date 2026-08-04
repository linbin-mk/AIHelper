## ADDED Requirements

### Requirement: Resource manager tab navigation
系统 SHALL 在 Side Panel 顶栏中提供"资源管理"Tab按钮，与"请求监控"、"AI聊天"并列显示。点击"资源管理"Tab时 MUST 切换到对应的资源管理视图。

#### Scenario: Switch to resource manager tab
- **WHEN** 用户点击"资源管理"Tab按钮
- **THEN** 系统显示资源管理视图，隐藏其他Tab视图
- **AND** "资源管理"Tab按钮高亮为激活状态

#### Scenario: Default tab on panel open
- **WHEN** 用户打开 Side Panel
- **THEN** 系统默认显示上次关闭时的Tab视图（保持Tab状态持久化）

### Requirement: Project list display
系统 SHALL 在资源管理视图中展示所有已配置的Git项目列表，每个项目显示名称、Git地址（截断显示）、描述摘要（如有，超过30字截断）、最近同步时间和同步状态（待同步/同步中/已同步/同步失败）。已同步项目 SHALL 额外显示可折叠的文件目录树预览区域。

#### Scenario: Empty project list
- **WHEN** 用户首次打开资源管理Tab且未配置任何项目
- **THEN** 系统显示空状态提示"暂无项目资源，点击下方按钮添加"

#### Scenario: Project list with items
- **WHEN** 用户已配置至少一个项目
- **THEN** 系统以卡片列表形式展示所有项目，每张卡片包含项目名称、地址摘要、描述摘要（如有）、最后同步时间、同步状态标签
- **AND** 已同步项目卡片额外显示可折叠的文件目录树预览入口

#### Scenario: Project card with long description
- **WHEN** 项目描述超过30个字符
- **THEN** 项目卡片显示截断的描述，末尾添加 `...`

#### Scenario: Synced project with file tree
- **WHEN** 项目同步状态为"已同步"
- **THEN** 项目卡片在"最后同步"时间下方显示文件目录树折叠按钮
- **AND** 点击按钮可展开/收起项目文件树

#### Scenario: Unsynced project without file tree
- **WHEN** 项目同步状态不是"已同步"
- **THEN** 项目卡片仅显示"最后同步: 从未"或无时间信息，不显示文件目录树按钮

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

### Requirement: One-click sync all
系统 SHALL 在资源管理视图顶部提供"一键同步最新代码"按钮，点击后批量拉取所有已配置项目的最新代码。同步过程中显示每个项目的实时同步进度。

#### Scenario: Sync all projects successfully
- **WHEN** 用户点击"一键同步最新代码"按钮
- **THEN** 系统依次或并行拉取所有项目的最新代码
- **AND** 每个项目卡片上显示同步进度（同步中/已完成/失败）
- **AND** 全部完成后更新各项目的最后同步时间

#### Scenario: Some projects fail to sync
- **WHEN** 部分项目同步失败（网络错误、认证失败等）
- **THEN** 失败项目显示"同步失败"状态和错误原因
- **AND** 成功项目正常更新完成，互不影响

### Requirement: Per-project sync
系统 SHALL 在每个项目卡片上提供单独的"同步"按钮，支持对单个项目进行代码拉取。

#### Scenario: Sync single project
- **WHEN** 用户点击某个项目卡片上的"同步"按钮
- **THEN** 系统仅拉取该项目的代码，更新其同步状态和时间

### Requirement: Sync status indication
系统 SHALL 在项目列表和同步按钮上显示清晰的同步状态：待同步（灰色图标）、同步中（旋转动画+进度百分比）、已同步（绿色图标+时间）、同步失败（红色图标+错误原因）。

#### Scenario: Sync in progress
- **WHEN** 某个项目正在同步
- **THEN** 该项目卡片显示旋转加载动画和当前进度
- **AND** "一键同步"按钮和单项目同步按钮均处于禁用状态
