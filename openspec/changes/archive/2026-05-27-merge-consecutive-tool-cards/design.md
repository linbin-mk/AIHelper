## Context

当前 `chat.js` 中工具调用的渲染方式：每个工具调用独立创建一张 `chat-message-tool-card`，`startAgentLoop` 中同一轮 LLM 返回的多个 tool_calls 依次创建独立卡片（`chat.js:890-936`），`renderChatMessages` 恢复历史时也是逐一创建（`chat.js:210-224`）。卡片默认展开（`tool-card-expanded`），仅在下一轮工具调用开始时通过 `autoCollapseToolCards()` 折叠（`chat.js:468-472`）。

卡片样式在 `panel.css:841-928`，核心结构为 `.chat-message-tool-card > .chat-bubble-tool-card > (.tool-card-header + .tool-card-body)`。

当工具调用较多时（如 5-10 个），页面充斥大量卡片，视觉杂乱。

## Goals / Non-Goals

**Goals:**
- 同一轮对话中连续的多个工具调用合并为一个分组卡片
- 所有工具卡片（分组卡片和单个卡片）在完成后默认折叠
- 分组卡片展开后可看到子项列表，每个子项可独立展开查看参数和结果
- 实时流式和历史恢复均应用新行为
- 保持现有卡片的折叠/展开交互逻辑不变

**Non-Goals:**
- 不改变工具执行的顺序或逻辑
- 不改变跨轮次的工具调用展示（不同用户消息之间的工具调用不合并）
- 不改变思考卡片的渲染结构（仅确保其折叠行为一致）

## Decisions

### 1. 分组策略：同一 assistant 消息的 tool_calls 合并

**决策**：只在同一 `assistant` 消息内的 `tool_calls` 数组上进行合并（`chat.js:890` 的 for 循环范围），不跨消息合并。历史恢复时同理。

**备选方案**：跨多轮 assistant 消息合并。被拒绝的原因：中间可能有用户消息或模型文本回复，跨消息合并会导致语义断裂。

### 2. 分组卡片 DOM 结构：外层容器 + 子卡片列表

**决策**：新增 `createGroupedToolCard(toolCalls)` 函数，生成如下结构：

```
.chat-message-tool-card-group
  .chat-bubble-tool-card-group.tool-card-group-collapsed
    .tool-card-group-header  ← "🔧 调用 N 个工具" + 折叠箭头
    .tool-card-group-body
      .tool-card-sub-item.tool-card-sub-collapsed  ← 每个工具子项
        .tool-card-sub-header  ← "⚡ toolName" + 展开箭头
        .tool-card-sub-body
          .tool-card-section (参数)
          .tool-card-section (结果)
```

**原因**：两层折叠——外层控制整组可见性，内层控制每个工具详情。复用现有 `.tool-card-section` / `.tool-card-args` / `.tool-card-result` 样式。

### 3. 默认折叠：初始 class 改为 collapsed

**决策**：将 `createCollapsibleToolCard` 中 `tool-card-expanded` 改为 `tool-card-collapsed`，`▼` 改为 `▶`。`setCardState('executing', ...)` 执行时仍会自动展开（`chat.js:433-434`），所以执行中临时展开不受影响。完成后默认回到折叠。

**备选方案**：保持创建时展开，完成后调用 `setCardState('collapsed')`。被拒绝：增加不必要的闪烁，且历史恢复时已有该逻辑（`chat.js:223`），统一初始状态更简洁。

### 4. 状态管理：activeToolCards 保存块级引用

**决策**：`activeToolCards` 不变，继续存储当前轮次的所有卡片引用。当使用分组时，`activeToolCards` 中只存储分组卡片的 `{ wrapper, card }` 引用。`autoCollapseToolCards()` 无需修改即可处理。

### 5. 历史恢复：检测连续 tool_calls 并合并

**决策**：`renderChatMessages` 中，检测连续的多条 `msg.tool_calls`（中间无用户消息、无 `msg.content` 的 assistant 消息），将它们合并为一个分组卡片。单个 tool_call 的 assistant 消息仍渲染为单独卡片。

## Risks / Trade-offs

- **[Risk] 分组卡片展开后内容过多** → 子项默认折叠，用户按需展开，避免一次性展示大量 JSON
- **[Risk] 现有选择器依赖 `.chat-message-tool-card` class 的代码可能被影响** → 分组卡片使用新 class `.chat-message-tool-card-group`，不干扰现有样式
- **[Risk] 分组卡片状态更新复杂度增加** → `setCardState` 仅用于单个卡片；分组卡片使用 `updateGroupedSubItem(groupCard, index, state, info)` 更新指定子项
