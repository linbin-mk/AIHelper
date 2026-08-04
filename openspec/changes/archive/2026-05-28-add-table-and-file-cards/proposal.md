## Why

当前聊天面板已支持询问卡片（`ask_user`）和授权卡片（`request_auth`），让 AI 可以交互式地向用户提问或请求授权。但缺少两种常见场景：AI 生成表格数据后需要结构化的表格展示（非 Markdown 表格），以及 AI 生成文件（如代码、报告、配置文件）后需要让用户下载保存。新增表格卡片和文件卡片可填补这两个空白，让 AI 的输出能力更完整。

## What Changes

- 新增 **表格卡片（Table Card）**：AI 通过 `display_table` 工具调用，在聊天面板中渲染一张包含列头和行数据的结构化表格卡片，支持可点击的行和分页
- 新增 **文件卡片（File Card）**：AI 通过 `provide_file` 工具调用，在聊天面板中渲染一张文件下载卡片，用户可点击下载按钮将文件保存到本地
- 在 `chat.js` 中新增两个工具定义（`display_table`、`provide_file`）、对应的卡片创建函数和事件处理器
- 在 `panel.css` 中新增表格卡片和文件卡片的 Catppuccin 风格样式
- 在 `i18n.js` 中新增中英文翻译文本

## Capabilities

### New Capabilities
- `ai-table-card`: AI 可将结构化数据以表格形式展示在聊天面板中，支持列头、行数据、行点击交互
- `ai-file-card`: AI 可提供文件供用户下载，卡片显示文件名、类型、大小等信息，点击按钮触发浏览器下载

### Modified Capabilities
（无现有 spec 需要修改）

## Impact

- **chat.js**: 在 TOOLS 数组中新增 `display_table` 和 `provide_file` 工具定义；新增 `createTableCard()`、`handleTableCard()`、`createFileCard()` 函数；在 `executeToolCall()` 中新增两个 case 分支
- **panel.css**: 新增 `.chat-message-table-card`、`.chat-bubble-table-card`、`.chat-message-file-card`、`.chat-bubble-file-card` 等样式规则（约 150 行）
- **i18n.js**: 新增 `chat.tableCardTitle`、`chat.fileCardTitle`、`chat.fileCardDownload` 等翻译键（中英文共约 12 个新键）
- **无外部依赖**：表格卡片使用原生 `<table>` 实现，文件下载使用 `Blob` + `URL.createObjectURL` + `<a>` 点击触发，无需引入第三方库
