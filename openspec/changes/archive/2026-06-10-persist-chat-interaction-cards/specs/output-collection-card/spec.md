## ADDED Requirements

### Requirement: 历史会话中恢复产物集合卡片
当 `renderChatMessages` 重建聊天历史时，遇到 `present_output_files` 工具调用的消息 SHALL 从工具调用参数中提取过滤条件并重新调用 `createOutputCollectionCard` 重建产物集合卡片。

#### Scenario: 切换历史会话时看到之前的产物集合卡片
- **WHEN** 用户切换到包含 `present_output_files` 工具调用的历史会话
- **AND** `renderChatMessages` 处理该消息的 tool_calls
- **THEN** 渲染一张产物集合卡片
- **AND** 卡片使用 IndexedDB 中当前实际存在的文件（按 `pathPrefix` 过滤）
- **AND** 文件预览和批量下载功能可用

#### Scenario: 历史产物文件已被删除
- **WHEN** 历史会话中的 `present_output_files` 引用的文件已从 IndexedDB 中删除
- **THEN** 卡片展示空状态提示
- **AND** 不显示下载按钮

#### Scenario: 部分历史产物文件仍存在
- **WHEN** 历史会话中的 `present_output_files` 引用的文件部分存在、部分已删除
- **THEN** 卡片仅展示仍存在的文件
- **AND** 文件计数和下载功能对应实际存在的文件
