## ADDED Requirements

### Requirement: 历史会话中恢复文件卡片
当 `renderChatMessages` 重建聊天历史时，遇到 `provide_file` 工具调用的消息 SHALL 从工具调用参数中提取文件信息并重建文件卡片，下载功能保持可用。

#### Scenario: 切换历史会话时看到之前的文件卡片
- **WHEN** 用户切换到包含 `provide_file` 工具调用的历史会话
- **AND** `renderChatMessages` 处理该消息的 tool_calls
- **THEN** 渲染一张文件卡片，显示文件名、MIME 类型、内容预览
- **AND** "⬇ 下载"按钮可用，点击后从存储的参数中提取内容触发浏览器下载

#### Scenario: 文件卡片在历史中的下载行为
- **WHEN** 用户在历史会话的文件卡片中点击"⬇ 下载"按钮
- **THEN** 系统使用 `downloadFileContent(fileName, content, mimeType)` 触发浏览器下载
- **AND** 下载行为与原始对话中的下载完全一致
