## ADDED Requirements

### Requirement: 历史会话中恢复表格卡片
当 `renderChatMessages` 重建聊天历史时，遇到 `display_table` 工具调用的消息 SHALL 从工具调用参数中提取表格数据并重建表格卡片，历史表格以只读模式展示（行不可点击选择）。

#### Scenario: 切换历史会话时看到之前的表格卡片
- **WHEN** 用户切换到包含 `display_table` 工具调用的历史会话
- **AND** `renderChatMessages` 处理该消息的 tool_calls
- **THEN** 渲染一张表格卡片，显示标题、列头和所有行数据
- **AND** 表格数据完整可读，可滚动查看
- **AND** 即使是可点击表格（`clickable: true`），历史恢复后行不可点击（只读模式）

#### Scenario: 历史表格卡片保持完整数据
- **WHEN** 历史消息中 `display_table` 包含 50 行数据
- **AND** `renderChatMessages` 重建表格卡片
- **THEN** 50 行数据全部渲染，表格容器设置 `max-height` 和滚动
