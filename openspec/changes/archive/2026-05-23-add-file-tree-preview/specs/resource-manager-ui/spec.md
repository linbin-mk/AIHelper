## MODIFIED Requirements

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
