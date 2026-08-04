## ADDED Requirements

### Requirement: 技能 MD 文件基本结构
技能 SHALL 以 Markdown 文件定义，按语言后缀命名：`skill.cn.md`（中文）、`skill.en.md`（英文），存放在 `chrome-extension/skills/<skill-id>/` 目录下。至少需要提供一个语言版本的文件。文件由 YAML front matter（元数据）和 Markdown 正文（自然语言内容）两部分组成，通过 `---` 分隔符分隔。

#### Scenario: 仅中文版本的技能
- **WHEN** 技能目录下仅存在 `skill.cn.md` 文件，包含必要的 YAML front matter 字段和正文
- **THEN** 无论当前界面语言是什么，该文件被成功解析并注册为有效技能

#### Scenario: 中英文双版本技能
- **WHEN** 技能目录下同时存在 `skill.cn.md` 和 `skill.en.md`
- **THEN** 系统根据当前语言选择对应文件加载，两文件各自独立解析和注册

#### Scenario: 空正文的技能
- **WHEN** 技能 MD 文件的正文部分为空或仅空白
- **THEN** 技能仍被注册，但系统提示词中该技能的内容为空

### Requirement: YAML Front Matter 元数据字段
技能 MD 文件的 YAML front matter SHALL 包含以下字段：
- `id`（必填）：技能唯一标识，kebab-case 格式，与目录名一致
- `name`（必填）：技能显示名称，中文
- `description`（必填）：技能简短描述，用于技能列表展示和 AI 目录
- `category`（可选）：技能分类，值为 `业务`、`产品`、`开发`、`测试` 之一。未提供时归入 `其他`

#### Scenario: 必填字段完整
- **WHEN** 技能 MD 文件的 front matter 包含 `id: "test-skill"`、`name: "测试技能"`、`description: "这是一个测试技能"`
- **THEN** 该技能被成功解析，所有字段值正确读取

#### Scenario: 缺少必填字段
- **WHEN** 技能 MD 文件的 front matter 缺少 `name` 字段
- **THEN** 该文件被跳过，不注册该技能，并记录错误日志

#### Scenario: 分类字段有效值
- **WHEN** 技能 MD 文件的 `category` 值为 `开发`
- **THEN** 该技能被归类到"开发"分组

#### Scenario: 分类字段无效值
- **WHEN** 技能 MD 文件的 `category` 值为不在预定义列表中的字符串
- **THEN** 该技能归入"其他"分组

### Requirement: Markdown 正文作为技能提示词
技能 MD 文件的正文部分 SHALL 作为技能的完整提示词（Prompt），在技能激活时注入到系统消息中。正文使用标准 Markdown 语法，可以包含标题、列表、代码块、链接等格式。

#### Scenario: 正文包含结构化内容
- **WHEN** 技能 MD 正文包含多级标题、有序列表、代码块
- **THEN** 正文内容完整保留，激活时全部注入到系统提示词中

#### Scenario: 正文作为详情页展示内容
- **WHEN** 用户点击技能行查看详情
- **THEN** 弹窗中渲染该技能 MD 文件的完整正文（不含 front matter）

### Requirement: 国际化多语言支持
技能 SHALL 通过独立语言文件支持国际化：`skill.cn.md` 和 `skill.en.md`。各语言文件的 front matter 中 `name` 和 `description` 字段使用对应语言的值，正文内容使用对应语言编写。语言文件各自独立，不相互引用。

#### Scenario: 中文版 name 和 description
- **WHEN** `skill.cn.md` 的 front matter 包含 `name: "代码大师"`、`description: "AI 向导式代码开发"`
- **THEN** 中文界面下技能列表展示 "代码大师"

#### Scenario: 英文版 name 和 description
- **WHEN** `skill.en.md` 的 front matter 包含 `name: "Code Master"`、`description: "AI-guided code development"`
- **THEN** 英文界面下技能列表展示 "Code Master"

#### Scenario: 正文内容随语言切换
- **WHEN** 用户界面为英文且 `code-master/skill.en.md` 存在
- **THEN** 技能详情弹窗渲染英文正文，AI 提示词注入英文内容

#### Scenario: 仅中文版本存在时界面为英文
- **WHEN** 用户界面为英文但技能仅有 `skill.cn.md`
- **THEN** 回退加载中文文件，技能列表显示中文名称和描述

### Requirement: 基础组件直白引用
技能 MD 正文中 SHALL 直接使用系统工具名称（`ask_user`、`request_auth`、`display_table`、`provide_file`）来描述交互需求，让大模型明确知道应调用哪个工具。不需要在 front matter 中声明工具列表，正文中的自然语言指令即是大模型的行动依据。

#### Scenario: 技能明确要求用户确认
- **WHEN** 技能 MD 正文中写明 "使用 `request_auth` 工具生成授权卡片，让用户确认操作" 等直白指令
- **THEN** AI 在激活该技能时明确调用 `request_auth` 工具生成授权卡片

#### Scenario: 技能需要向用户提问
- **WHEN** 技能 MD 正文中写明 "使用 `ask_user` 工具向用户展示问题，提供选项按钮" 等直白指令
- **THEN** AI 在激活该技能时明确调用 `ask_user` 工具生成询问卡片

#### Scenario: 技能需要展示表格数据
- **WHEN** 技能 MD 正文中写明 "使用 `display_table` 工具以表格形式展示结果" 等直白指令
- **THEN** AI 在激活该技能时明确调用 `display_table` 工具生成表格卡片

#### Scenario: 技能需要提供文件下载
- **WHEN** 技能 MD 正文中写明 "使用 `provide_file` 工具提供文件下载" 等直白指令
- **THEN** AI 在激活该技能时明确调用 `provide_file` 工具生成下载卡片

#### Scenario: JS 技能迁移到 MD 时替换卡片逻辑
- **WHEN** 将 JS 技能中调用 `ask_user` / `request_auth` 等工具的地方转换为 MD
- **THEN** 正文中直接写明工具名称和使用场景（如 "使用 `request_auth` 工具生成授权卡片，让用户确认后执行下一步"），替代原有的 JS 工具调用代码
