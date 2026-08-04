## Why

AI 聊天模块存在三个显示缺陷：思考卡片完成后无法展开查看思考内容、工具调用结果以纯文本展示而非可折叠卡片、关闭插件后重新打开时 markdown 渲染和卡片结构全部丢失。这些问题严重影响了聊天记录的可读性和用户体验。

## What Changes

- **思考卡片在思考完成后不再被移除**：无工具调用路径下保留 thinkingEl 并折叠，用户可点击展开查看完整思考内容
- **工具调用和结果改为可折叠卡片**：调用工具 + 结果统一收在一个可折叠卡片中，默认折叠，点击展开查看详情
- **聊天记录恢复时重建视觉结构**：`renderChatMessages` 增加对 `reasoning_content`、`tool_calls` 的特殊渲染逻辑，恢复 thinking 卡片和 tool call 卡片
- **修复 markdown 渲染丢失问题**：恢复聊天记录时对 assistant 消息调用 `renderMarkdown()` 后再插入 DOM，取代直接 `innerHTML = rawContent`

## Capabilities

### New Capabilities

（无新增 capability，本次变更为对已有 capability 的缺陷修复）

### Modified Capabilities

- `ai-chat-panel`: 修改消息渲染逻辑——thinking 卡片在无工具调用路径下保留并折叠；tool call/result 改为带生命周期的可折叠卡片（进行中→完成展开→自动折叠）；`renderChatMessages` 重建 thinking 和 tool call 卡片；恢复消息时正确渲染 markdown
- `chat-history`: `renderChatMessages` 利用已有 `reasoning_content` 和 `tool_calls` 字段重建视觉结构，无需新增存储字段

## Impact

- **chat.js**: `createThinkingBubble`、`showToolCallBubble`、`showToolResultBubble`、`renderChatMessages` 等核心函数需修改
- **panel.css**: 新增 tool call 卡片折叠/展开相关样式
- **消息存储格式**: 无需新增字段——现有 `reasoning_content` 和 `tool_calls` 已涵盖重建所需数据
- **无新增外部依赖**
