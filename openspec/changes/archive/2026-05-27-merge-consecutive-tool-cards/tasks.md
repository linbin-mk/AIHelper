## 1. CSS 样式

- [x] 1.1 新增分组卡片容器样式 `.chat-message-tool-card-group`、`.chat-bubble-tool-card-group`
- [x] 1.2 新增分组标题样式 `.tool-card-group-header` 和折叠状态 `.tool-card-group-collapsed .tool-card-group-body { display: none }`
- [x] 1.3 新增子项卡片样式 `.tool-card-sub-item`、`.tool-card-sub-header`、`.tool-card-sub-body`、`.tool-card-sub-collapsed .tool-card-sub-body { display: none }`
- [x] 1.4 新增分组工具计数徽章样式 `.tool-card-group-count`

## 2. 分组卡片核心逻辑

- [x] 2.1 新增 `createGroupedToolCard(toolCalls)` 函数，创建分组卡片 DOM 结构（分组标题 + N 个子项），每个子项包含可折叠的参数/结果区域
- [x] 2.2 新增 `updateGroupedSubItem(groupCard, index, state, info)` 函数，更新指定子项的执行状态（图标、状态文字、参数、结果）
- [x] 2.3 新增 `autoCollapseGroupCard(groupCard)` 函数，所有子项完成后折叠分组卡片

## 3. 默认折叠行为

- [x] 3.1 修改 `createCollapsibleToolCard()`，初始 class 从 `tool-card-expanded` 改为 `tool-card-collapsed`，箭头从 `▼` 改为 `▶`
- [x] 3.2 修改 `setCardState('completed', ...)`，完成后设置折叠状态（移除 `tool-card-expanded`、添加 `tool-card-collapsed`、箭头 `▶`）
- [x] 3.3 确认 `setCardState('executing', ...)` 仍会自动展开卡片（无需修改）

## 4. 实时流式渲染适配

- [x] 4.1 修改 `startAgentLoop()` 中工具调用渲染逻辑（约 888-936 行）：判断 `toolCalls.length > 1` 时调用 `createGroupedToolCard()`
- [x] 4.2 工具执行结果更新改为调用 `updateGroupedSubItem()` 而非 `setCardState()`
- [x] 4.3 所有子项完成后调用 `autoCollapseGroupCard()` 折叠分组

## 5. 历史恢复适配

- [x] 5.1 修改 `renderChatMessages()` 中 tool_calls 渲染逻辑（约 210-224 行）：多个 tool_calls 创建分组卡片
- [x] 5.2 历史恢复时子项预填充参数和结果，均默认折叠
- [x] 5.3 单个 tool_call 的历史恢复保持独立卡片，默认折叠

## 6. 国际化

- [x] 6.1 新增 `chat.toolGroupCall` 文本："🔧 调用 {count} 个工具"
- [x] 6.2 新增 `chat.toolGroupCompleted` 文本："🔧 调用 {count} 个工具 (已完成 {done}/{total})"

## 7. 验证

- [x] 7.1 使用本地会话日志文件 `chrome-extension/logs/ai-helper-chat-<测试会话>.json` 验证历史恢复渲染效果
- [ ] 7.2 实际对话测试多工具调用场景的实时渲染效果
- [ ] 7.3 测试单工具调用场景，确认独立卡片正常工作和默认折叠
