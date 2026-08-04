## ADDED Requirements

### Requirement: activateSkill 共享函数
系统 SHALL 提供 `activateSkill(skillId)` 共享函数，统一手动激活和语义激活的入口。函数校验 skill ID 是否存在，若存在则调用 `registry.activate(skillId)` 并返回结构化结果。

#### Scenario: 激活已注册 skill
- **WHEN** 调用 `activateSkill(skillId)` 传入已注册的 skill ID
- **THEN** `registry.activate(skillId)` 被调用，触发 `renderSkillStatusBar()` 渲染 tag
- **AND** 返回 `{activated: true, skillId: "<id>", name: "<name>", prompt: "<getPrompt() 正文>"}`

#### Scenario: 激活不存在的 skill
- **WHEN** 调用 `activateSkill(skillId)` 传入未注册的 skill ID
- **THEN** 返回 `{activated: false, error: "skill not found: <id>"}`，不更新激活状态

### Requirement: activate_skill 工具供 AI 调用
系统 SHALL 新增 `activate_skill` 内置工具，AI 可通过 tool call 调用此工具激活 skill 并获取完整规则正文。工具 handler 调用共享的 `activateSkill()` 函数。

#### Scenario: AI 通过工具激活 skill
- **WHEN** AI 调用 `activate_skill` 工具传入 `skillId`
- **THEN** handler 调用 `activateSkill(skillId)`，返回 `JSON.stringify(result)` 给 AI 作为 tool result
- **AND** 状态栏自动渲染该 skill 的 tag

#### Scenario: 工具在 buildMergedTools 中可见
- **WHEN** 系统构建发送给 LLM 的工具列表
- **THEN** `activate_skill` 出现在工具列表中，AI 可在 tool_calls 中引用

### Requirement: 手动激活改用共享函数
`selectSlashSkill()` 和 panel "使用"按钮的激活逻辑 SHALL 调用共享的 `activateSkill()` 函数，消除重复代码。

#### Scenario: 斜杠命令激活
- **WHEN** 用户通过 `/skillId` 或斜杠面板点击激活 skill
- **THEN** `selectSlashSkill()` 内部调用 `activateSkill(skillId)`，然后设置输入框文本和 UI

#### Scenario: 面板"使用"按钮激活
- **WHEN** 用户在技能详情弹窗点击"使用"按钮
- **THEN** 按钮回调调用 `activateSkill(skillId)`，然后切换 tab 和设置输入框

### Requirement: 技能目录提示引导 AI 使用 activate_skill
系统 SHALL 在 `buildSkillDirectory()` 注入的提示文本中明确告知 AI 通过 `activate_skill` 方法激活 skill 获取完整规则。

#### Scenario: 目录提示包含 activate_skill 引导
- **WHEN** 系统构建 system prompt 中的技能目录
- **THEN** 目录末尾的提示文本建议 AI："若用户请求匹配某技能意图，请调用 `activate_skill` 激活该技能以获取完整规则，然后严格遵循"

#### Scenario: 无已注册 skill 时不注入提示
- **WHEN** 系统未注册任何 Skill，`buildSkillDirectory()` 返回空字符串
- **THEN** 不注入任何技能相关提示文本
