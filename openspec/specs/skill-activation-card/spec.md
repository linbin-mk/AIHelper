## ADDED Requirements

### Requirement: 发送消息时插入 skill 激活卡片

当用户在 skill 激活状态下发送消息时，系统 SHALL 在消息列表中用户消息气泡之前插入一张 skill 激活卡片，展示当前激活的 skill 名称和描述信息。

#### Scenario: 单个 skill 激活时发送消息
- **WHEN** 用户激活了 skill "openspec-propose"（名称为 "OpenSpec Propose"）
- **AND** 用户发送消息
- **THEN** 消息列表中在用户消息气泡上方出现一张 skill 激活卡片
- **AND** 卡片显示 skill 名称 "OpenSpec Propose"
- **AND** 卡片显示 skill 的描述信息
- **AND** 卡片样式与"工具调用"卡片、"AI 思考"同级（使用 `chat-message chat-message-skill-card` CSS 类）

#### Scenario: 多个 skill 激活时发送消息
- **WHEN** 用户同时激活了多个 skill
- **AND** 用户发送消息
- **THEN** 消息列表中为每个激活的 skill 各插入一张激活卡片
- **AND** 卡片按 skill 激活顺序排列在用户消息上方

#### Scenario: 无 skill 激活时发送消息
- **WHEN** 用户未激活任何 skill
- **AND** 用户发送普通消息
- **THEN** 不插入 skill 激活卡片
- **AND** 消息列表仅显示用户消息气泡和 AI 回复

### Requirement: Skill 激活卡片持久化存储

Skill 激活卡片 SHALL 作为消息记录的一部分持久化到会话存储中，会话恢复时自动渲染。

#### Scenario: 发送带 skill 的消息后持久化
- **WHEN** 用户激活 skill 并发送消息
- **AND** skill 激活卡片已插入消息列表
- **THEN** 会话的 `messages` 数组中包含一条 `{ role: 'skill_activation', skillId, skillName, skillDescription, timestamp }` 消息
- **AND** 该消息位于用户消息之前

#### Scenario: 会话恢复时渲染 skill 激活卡片
- **WHEN** 用户切换到包含 skill 激活消息的历史会话
- **AND** `renderChatMessages()` 被调用来渲染消息列表
- **THEN** 遇到 `role === 'skill_activation'` 的消息时渲染对应的 skill 激活卡片
- **AND** 卡片展示与发送时一致（名称、描述）
- **AND** 卡片样式与实时创建的一致

### Requirement: Skill 激活卡片不参与 LLM 对话

Skill 激活卡片消息 SHALL 仅作为 UI 展示元素，不发送给 LLM API。

#### Scenario: 构建 LLM 请求时过滤 skill 激活消息
- **WHEN** `buildMessages()` 构建发送给 LLM 的消息数组
- **AND** 会话消息中包含 `role === 'skill_activation'` 的消息
- **THEN** 该消息被跳过，不包含在发送给 LLM 的 messages 数组中
- **AND** skill 的 prompt 和 tools 仍通过 `buildActiveSkillPrompt()` 正确注入
