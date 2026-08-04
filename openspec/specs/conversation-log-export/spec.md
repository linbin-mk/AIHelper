# conversation-log-export

## MODIFIED Requirements

### Requirement: Export conversation log button
导出日志操作 SHALL 从聊天工具栏按钮改为侧边栏会话卡片的右键菜单入口。

#### Scenario: Right-click context menu trigger
- **WHEN** 用户右键点击侧边栏中某会话卡片
- **THEN** 右键菜单中显示「导出日志」选项
- **AND** 点击后触发该会话的日志导出

#### Scenario: Export from context menu
- **WHEN** 用户通过右键菜单点击「导出日志」且该会话有聊天记录
- **THEN** 系统下载一个 JSON 文件，文件名格式为 `ai-helper-chat-{sessionTitle}-YYYYMMDD-HHmmss.json`

#### Scenario: Export empty session
- **WHEN** 用户通过右键菜单导出无聊天记录的会话
- **THEN** 系统仍下载 JSON 文件，messages 为空数组，meta.messageCount 为 0

### Requirement: Export data structure
导出的 JSON 文件 MUST 包含 `meta` 和 `messages` 两个顶层字段。

#### Scenario: Exported file contains meta and messages
- **WHEN** 导出操作完成
- **THEN** 下载的 JSON 文件包含：
  - `meta.exportedAt`: ISO 8601 格式的导出时间戳
  - `meta.sessionTitle`: 会话标题
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
