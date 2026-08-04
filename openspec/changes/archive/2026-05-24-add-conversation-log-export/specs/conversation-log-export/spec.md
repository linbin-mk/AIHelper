## ADDED Requirements

### Requirement: Export conversation log button
聊天工具栏 MUST 在「清空」按钮左侧提供「导出日志」按钮，用于触发会话日志导出。

#### Scenario: Button is visible in toolbar
- **WHEN** 用户打开 AI 聊天 Tab
- **THEN** 聊天工具栏显示「导出日志」按钮，位于「清空」按钮左侧

#### Scenario: Button click triggers export
- **WHEN** 用户点击「导出日志」按钮且当前有聊天记录
- **THEN** 系统下载一个 JSON 文件，文件名格式为 `ai-helper-chat-YYYYMMDD-HHmmss.json`

#### Scenario: Button click with empty chat
- **WHEN** 用户点击「导出日志」按钮且当前无聊天记录
- **THEN** 系统仍下载一个 JSON 文件，其中 messages 为空数组，meta.messageCount 为 0

### Requirement: Export data structure
导出的 JSON 文件 MUST 包含 `meta` 和 `messages` 两个顶层字段。

#### Scenario: Exported file contains meta and messages
- **WHEN** 导出操作完成
- **THEN** 下载的 JSON 文件包含：
  - `meta.exportedAt`: ISO 8601 格式的导出时间戳
  - `meta.messageCount`: 导出的消息数量
  - `meta.modelConfig`: 包含 provider、model、temperature、maxTokens 字段的模型配置摘要
  - `messages`: 完整的聊天消息数组，每条消息包含 role、content 及可选字段（reasoning_content、tool_calls 等）

### Requirement: Export preserves full message data
导出 MUST 保留每条消息的完整结构，不截断或省略字段。

#### Scenario: Reasoning content is preserved
- **WHEN** 聊天记录中包含带有 `reasoning_content` 的 assistant 消息
- **THEN** 导出文件中该消息的 `reasoning_content` 字段完整保留

#### Scenario: Tool calls are preserved
- **WHEN** 聊天记录中包含带有 `tool_calls` 的 assistant 消息
- **THEN** 导出文件中该消息的 `tool_calls` 字段完整保留
