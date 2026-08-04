## Why

当 AI 连续调用多个工具时，当前每个工具调用渲染为独立卡片，工具调用多时聊天区充斥大量卡片，视觉杂乱、滚动冗长，用户难以快速浏览对话脉络。需要将连续工具调用合并为一个分组卡片，并默认折叠以减少视觉干扰。

## What Changes

- **合并连续工具调用**：同一轮对话中连续的多个工具调用合并为一个"工具调用组"卡片，内部每个工具调用作为子项显示
- **默认折叠所有卡片**：工具调用卡片和工具调用组卡片在完成后默认折叠（无论实时流式还是历史恢复），用户点击展开查看详情
- **分组卡片交互**：点击分组卡片头部展开/折叠整组；每个子项可独立展开/折叠查看参数和结果
- **思考卡片同步调整**：思考卡片在完成后同样默认折叠（与工具卡片行为一致）

## Capabilities

### New Capabilities

- `tool-call-grouping`: 连续工具调用合并为一个分组卡片，包含子项列表

### Modified Capabilities

- `ai-chat-panel`: 工具调用卡片的默认状态从"展开"改为"折叠"；新增连续工具调用合并为分组卡片的渲染逻辑

## Impact

- `chrome-extension/src/panel/chat.js`: `createCollapsibleToolCard()`、渲染流程（`startAgentLoop` 和 `renderChatMessages`）、`autoCollapseToolCards()`、`activeToolCards` 管理逻辑
- `chrome-extension/src/panel/panel.css`: 新增分组卡片样式 `.tool-card-group`，调整折叠默认状态
- `chrome-extension/src/panel/i18n.js`: 可能需要新增分组卡片相关的国际化文本
