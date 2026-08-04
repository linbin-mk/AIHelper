## ADDED Requirements

### Requirement: Project description data field
系统 SHALL 在项目配置数据模型中提供 `description` 字段（可选，字符串类型）。该字段 MUST 用于存储用户对项目用途、业务背景的自由文本描述。

#### Scenario: Create project with description
- **WHEN** 用户添加项目时填写了描述内容
- **THEN** 系统将描述文本存入项目配置的 `description` 字段

#### Scenario: Create project without description
- **WHEN** 用户添加项目时未填写描述
- **THEN** 系统将 `description` 设置为空字符串，不影响项目创建

#### Scenario: Edit project description
- **WHEN** 用户编辑项目时修改描述内容
- **THEN** 系统更新该项目配置的 `description` 字段

#### Scenario: Load legacy project without description
- **WHEN** 系统加载存量项目配置（不含 `description` 字段）
- **THEN** 系统视 `description` 为空字符串，不报错

### Requirement: Description character limit validation
系统 SHALL 验证描述字段内容不超过 100 个字符（含中英文、标点、空格）。输入时 MUST 有字数计数提示，超出限制时 MUST 阻止保存。

#### Scenario: Description within limit
- **WHEN** 用户输入不超过 100 个字符的描述
- **THEN** 系统正常保存配置

#### Scenario: Description exceeds limit
- **WHEN** 用户输入超过 100 个字符的描述
- **THEN** 系统拒绝保存并提示"项目描述不能超过100个字符"

### Requirement: Description input UI in project form
系统 SHALL 在资源管理的添加项目和编辑项目表单中提供描述输入框（`<textarea>`），标签为"项目描述"，placeholder 提示用户填写项目用途说明。输入框右侧或下方 MUST 显示实时字数计数 `(n/100)`。

#### Scenario: Display description input in add form
- **WHEN** 用户打开添加项目表单
- **THEN** 表单底部显示项目描述输入框和字数计数 `(0/100)`

#### Scenario: Display description input in edit form
- **WHEN** 用户打开编辑项目表单
- **THEN** 表单中项目描述输入框预填当前描述内容，字数计数更新为当前字数

#### Scenario: Real-time character count
- **WHEN** 用户在描述输入框中输入文字
- **THEN** 字数计数实时更新为当前字符数

### Requirement: Description display in project card
系统 SHALL 在项目卡片中展示描述内容的摘要（如有）。超过 30 个字符的 MUST 截断并显示 `...`。

#### Scenario: Project card with description
- **WHEN** 项目配置包含非空描述
- **THEN** 项目卡片在同步状态下方显示描述摘要，超过30字时截断

#### Scenario: Project card without description
- **WHEN** 项目描述为空
- **THEN** 项目卡片不显示描述行

### Requirement: Description injection in AI chat context
系统 SHALL 在 AI 聊天的 `buildProjectContext()` 构建的项目摘要中注入描述内容。格式为每个项目附加 ` - 描述` 到摘要末尾。

#### Scenario: Project with description in AI context
- **WHEN** 系统构建 AI 聊天上下文且项目有非空描述
- **THEN** 系统消息中包含 `项目名(N文件) - 用户描述内容`

#### Scenario: Project without description in AI context
- **WHEN** 系统构建 AI 聊天上下文且项目描述为空
- **THEN** 系统消息中仅包含 `项目名(N文件)`，不附加描述
