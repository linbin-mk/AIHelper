## ADDED Requirements

### Requirement: 切换到聊天 Tab 时保护运行中的 Agent Loop
当用户通过 Tab 切换回到聊天面板时，系统 SHALL 检查 Agent Loop 是否正在运行。如果 Agent Loop 正在运行，SHALL 跳过 DOM 清空重建以保护进行中的交互卡片；否则按正常流程刷新聊天视图。

#### Scenario: Agent Loop 运行中切回聊天 Tab 保留 DOM
- **WHEN** Agent Loop 运行中且 `_isSending === true`
- **AND** 用户点击聊天 Tab 按钮
- **THEN** `switchTab('chat')` 正常执行，显示聊天面板
- **AND** `refreshChatView` 检测到 `_isSending === true`，不调用 `renderChatMessages`
- **AND** 聊天面板中先前的 DOM 保持不变

#### Scenario: Agent Loop 空闲时切回聊天 Tab 正常刷新
- **WHEN** Agent Loop 未运行且 `_isSending === false`
- **AND** 用户点击聊天 Tab 按钮
- **THEN** `switchTab('chat')` 正常执行，显示聊天面板
- **AND** `refreshChatView` 正常调用 `renderChatMessages` 从消息数据重建视图
