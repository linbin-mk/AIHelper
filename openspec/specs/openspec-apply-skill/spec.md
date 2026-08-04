## ADDED Requirements

### Requirement: 技能注册
系统 SHALL 在 `chrome-extension/skills/openspec-apply/` 目录下实现实现技能，通过 `window.__registerSkill()` 注册。技能的 `id` 为 `openspec-apply`，`name` 为 "OpenSpec 实现"，`category` 为 "开发"。

#### Scenario: 技能文件自注册
- **WHEN** `skills/openspec-apply/index.js` 在页面加载时调用 `window.__registerSkill({id: "openspec-apply", name: "OpenSpec 实现", category: "开发", ...})`
- **THEN** 该技能被添加到注册表，且立即进入激活状态

### Requirement: 按 tasks.md 逐步实现变更
技能 SHALL 在激活后读取指定变更的 tasks.md 和 design.md，按任务依赖顺序逐步实现代码变更，每完成一项任务标记状态并更新 tasks.md。

#### Scenario: 实现指定变更
- **WHEN** 用户发送 `/openspec-apply add-user-auth`
- **THEN** AI 通过 `get_memory_file` 读取 `{hostname}/openspec/changes/add-user-auth/tasks.md`
- **AND** 读取 proposal.md 和 design.md 获取完整上下文
- **AND** 按 tasks.md 中任务顺序逐步实现，每完成一项将 `- [ ]` 标记为 `- [x]`
- **AND** 将所有改动通过 `saveFile` 更新到记忆系统

#### Scenario: 无变更名称时列出可选变更
- **WHEN** 用户仅发送 `/openspec-apply` 未指定变更名称
- **THEN** AI 通过 `search_memories({pathPrefix: "openspec/changes/"})` 查询所有活跃变更（排除 archive/），列出供用户选择

#### Scenario: 变更不存在时提示
- **WHEN** 用户指定的变更名称在 `openspec/changes/` 路径下不存在
- **THEN** AI 提示用户该变更不存在，建议先执行 `/openspec-propose` 创建

#### Scenario: 缺少 tasks.md 或 design.md 时降级
- **WHEN** 指定变更目录存在但缺少 tasks.md
- **THEN** AI 提示 tasks.md 缺失，无法开始实现

### Requirement: 实现技能 Prompt 引导增量更新
`getPrompt()` SHALL 返回实现阶段的 prompt，引导 AI：读取全部 artifact 上下文 → 按 tasks.md 任务清单逐项实现 → 每完成一项立即更新 tasks.md 复选框状态 → 生成或修改相关源代码文件并存入记忆。

#### Scenario: AI 逐步执行并更新状态
- **WHEN** AI 完成了 tasks.md 中的第 1 项任务
- **THEN** AI 立即调用 `saveFile` 更新 tasks.md，将对应行的 `- [ ]` 改为 `- [x]`
- **AND** 继续下一项任务，不等待用户确认
