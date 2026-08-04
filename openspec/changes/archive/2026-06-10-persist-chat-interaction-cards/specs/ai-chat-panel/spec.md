## ADDED Requirements

### Requirement: 聊天历史中恢复交互式工具调用卡片
当 `renderChatMessages` 从存储的消息数据中重建聊天视图时，SHALL 识别 `tool_calls` 中的交互式工具调用（`ask_user`、`request_auth`、`display_table` 可点击模式），并根据 Agent Loop 运行状态决定是否绑定交互回调。

#### Scenario: 从 tool_calls 恢复交互式 ask_user 卡片
- **WHEN** 存储的助手消息包含 `tool_calls` 数组，且 `function.name === 'ask_user'`
- **AND** `_isSending === true` 且 `_pendingInteraction` 匹配此工具调用
- **THEN** `renderChatMessages` SHALL 创建询问卡片，展示问题、选项、自由输入框
- **AND** 卡片绑定 `handleQuestionCard` Promise 回调
- **AND** 不创建通用工具卡片

#### Scenario: 从 tool_calls 恢复交互式 request_auth 卡片
- **WHEN** 存储的助手消息包含 `tool_calls` 数组，且 `function.name === 'request_auth'`
- **AND** `_isSending === true` 且 `_pendingInteraction` 匹配此工具调用
- **THEN** `renderChatMessages` SHALL 创建授权卡片，展示操作名称、详情、风险等级
- **AND** 卡片绑定 `handleAuthCard` Promise 回调
- **AND** 不创建通用工具卡片

#### Scenario: 历史交互工具调用以只读模式展示
- **WHEN** 存储的助手消息包含 `ask_user` 或 `request_auth` 工具调用
- **AND** `_isSending === false` 或 `_pendingInteraction` 不匹配
- **THEN** `renderChatMessages` SHALL 创建对应的只读卡片（按钮 disabled）
- **AND** 不创建通用工具卡片
