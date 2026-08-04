## ADDED Requirements

### Requirement: 技能注册
系统 SHALL 在 `chrome-extension/skills/openspec-explore/` 目录下实现探索模式技能，通过 `window.__registerSkill()` 注册。技能的 `id` 为 `openspec-explore`，`name` 为 "OpenSpec 探索"，`category` 为 "开发"。

#### Scenario: 技能文件自注册
- **WHEN** `skills/openspec-explore/index.js` 在页面加载时调用 `window.__registerSkill({id: "openspec-explore", name: "OpenSpec 探索", category: "开发", ...})`
- **THEN** 该技能被添加到注册表，且立即进入激活状态

### Requirement: 探索模式行为
技能 SHALL 在激活后引导 AI 进入 "思考伙伴" 角色：与用户探讨需求、分析问题、澄清范围、提出方案方向。探索模式不产生任何文件写入，仅输出分析结果。

#### Scenario: 进入探索模式
- **WHEN** 用户以 `/openspec-explore` 或自然语言请求探索（如 "帮我分析一下这个需求"）
- **THEN** AI 分析需求、提出澄清问题、建议方案方向、评估技术可行性
- **AND** 对话过程中不调用 `saveFile` 写入任何文件

#### Scenario: 探索模式不写入记忆
- **WHEN** AI 在 explore 模式下完成多轮探讨
- **THEN** 记忆系统中不产生任何 OpenSpec artifact 文件

### Requirement: 探索技能提示规则
`getPrompt()` SHALL 返回探索模式的引导规则，指导 AI 以开放式提问、结构化分析、方案对比的方式进行思考。提示应包含：需求分析框架（5W1H）、技术可行性评估要点、方案对比维度。

#### Scenario: AI 按探索框架输出
- **WHEN** 用户描述模糊需求（如 "我想给系统增加一个导出功能"）
- **THEN** AI 按照提示规则逐步分析：目标用户是谁？导出什么内容？什么格式？频率和数量？有哪些技术方案？各方案优劣？
