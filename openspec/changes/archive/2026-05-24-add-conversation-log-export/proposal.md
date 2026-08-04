## Why

当前 AI Helper 聊天面板缺少会话日志导出能力，用户无法将对话数据导出到外部工具进行分析。这在调试 LLM 行为、分析 token 消耗、排查推理异常时是一个显著的功能缺口。

## What Changes

- 在聊天工具栏「清空」按钮左侧新增「导出日志」按钮
- 点击导出时，将当前聊天记录（含 role、content、reasoning_content、tool_calls 等完整信息）序列化为结构化 JSON 文件
- 文件名包含时间戳，方便多次导出和归档
- 使用浏览器下载机制，文件保存到系统下载目录

## Capabilities

### New Capabilities
- `conversation-log-export`: 将当前会话消息导出为 JSON 文件下载，包含完整消息结构和导出元数据（时间戳、消息数量等）

### Modified Capabilities
<!-- None -->

## Impact

- **Affected files**: `chrome-extension/src/panel/panel.html`（添加工具栏按钮）、`chrome-extension/src/panel/chat.js`（添加导出逻辑）、`chrome-extension/src/panel/panel.js`（可选：暴露导出函数）
- **No API changes**, 纯前端功能增强
- **No new permissions** required — 使用 Blob + anchor 下载方式，无需 `downloads` 权限
