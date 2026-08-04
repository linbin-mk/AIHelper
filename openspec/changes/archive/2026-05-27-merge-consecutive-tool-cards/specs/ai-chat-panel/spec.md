## MODIFIED Requirements

### Requirement: 工具调用卡片具有执行中状态和自动折叠功能
当 AI 调用工具时，工具名称、参数和结果应当显示在一个可折叠的卡片中，其生命周期为：执行中（展开，动态）→ 已完成（折叠）。卡片在创建时默认折叠，仅在工具执行中临时展开。

#### Scenario: 工具执行中 — 卡片显示实时"进行中"状态
- **WHEN** AI 开始执行工具
- **THEN** 应当出现一个可折叠的卡片
- **且** 卡片应当处于展开状态（仅在执行期间）
- **且** 标题应当显示 "⚡ 调用 {name} ... 进行中"
- **且** 卡片正文应当显示工具参数（格式化 JSON）

#### Scenario: 工具完成 — 卡片自动折叠
- **WHEN** 工具返回结果
- **THEN** 卡片标题应当更新为 "🔧 调用 {name}"
- **且** 卡片应当折叠（`tool-card-collapsed` + `▶` 箭头）

#### Scenario: 下一个工具开始 — 前一个工具卡片保持折叠
- **WHEN** AI 开始调用新工具（序列中的下一个）
- **THEN** 前一个工具的卡片应当保持折叠状态（已经是折叠的，无需额外操作）
- **且** 点击折叠的标题应当再次展开它

#### Scenario: 单轮调用多个工具
- **WHEN** AI 在单次响应中调用多个工具
- **THEN** 多个工具调用合并为一个分组卡片（参见 `tool-call-grouping` 规范）
- **且** 单个工具调用仍使用独立卡片

### Requirement: 聊天历史恢复思考卡片和工具调用卡片
当插件关闭后重新打开时，`renderChatMessages` 应当从存储的消息数据中重建思考卡片和工具调用卡片，工具卡片默认处于折叠状态。

#### Scenario: 从 reasoning_content 恢复思考卡片
- **WHEN** 存储的助手消息包含 `reasoning_content` 字段
- **THEN** `renderChatMessages` 应当创建一个思考卡片元素来显示推理内容
- **且** 卡片应当处于折叠状态

#### Scenario: 即使存在 tool_calls 也恢复思考卡片
- **WHEN** 存储的助手消息同时包含 `reasoning_content` 和 `tool_calls`
- **THEN** `renderChatMessages` 应当同时创建思考卡片和工具调用卡片（或分组卡片）
- **且** 思考卡片和工具卡片都应当处于折叠状态

#### Scenario: 从 tool_calls 恢复工具调用卡片
- **WHEN** 存储的助手消息包含 `tool_calls` 数组（多个元素）
- **THEN** `renderChatMessages` 应当创建一个分组卡片（参见 `tool-call-grouping` 规范）
- **且** 对应的工具结果消息应当关联并在对应的子项中显示
- **且** 分组卡片和所有子项均处于折叠状态

#### Scenario: 从单个 tool_call 恢复独立工具卡片
- **WHEN** 存储的助手消息包含 `tool_calls` 数组（仅一个元素）
- **THEN** `renderChatMessages` 应当创建一个独立的工具调用卡片
- **且** 卡片处于折叠状态
