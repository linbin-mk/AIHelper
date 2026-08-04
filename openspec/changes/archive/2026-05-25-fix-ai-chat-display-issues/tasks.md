## 1. Thinking 卡片：保留并折叠（无工具调用路径）

- [x] 1.1 在 `startAgentLoop` 的无工具调用路径（chat.js ~L708-709），将 `thinkingEl.remove()` 替换为填充内容并折叠
- [x] 1.2 填充 `thinkingTextEl.textContent` 为 `currentReasoningContent || streamedReasoning`
- [x] 1.3 添加 `thinking-collapsed` class 使卡片默认折叠
- [x] 1.4 验证 toggle 点击可展开/折叠，`t()` 函数在全局可访问

## 2. 工具调用卡片：可折叠结构 + 进行中状态 + 自动折叠

- [x] 2.1 创建 `createCollapsibleToolCard(toolName)` 函数，返回带生命周期的可折叠 DOM 元素
  - 卡片头部：图标 + 工具名称 + 状态标签（进行中/完成）
  - 卡片主体：参数 JSON 区域 + 结果内容区域
  - 初始为折叠状态，调用 `setCardState('executing')` 展开并显示"进行中..."
- [x] 2.2 实现卡片状态管理函数 `setCardState(cardEl, state, data)`：
  - `'executing'`：展开卡片，头部显示"⚡ 调用 {name} ... 进行中"
  - `'completed'`：填充结果内容，卡片保持展开
  - `'collapsed'`：自动折叠卡片，头部显示"🔧 调用 {name}"
- [x] 2.3 实现自动折叠机制：在 `showToolCallBubble` 调用点之前遍历活跃卡片数组，将所有旧卡片折叠；新卡片创建后加入数组
- [x] 2.4 替换 `showToolCallBubble` + `showToolResultBubble`：在工具调用时创建卡片并设 executing 状态，结果返回后设 completed 状态
- [x] 2.5 更新 CSS（`panel.css`）：添加 tool call 卡片各状态样式（进行中动画、折叠/展开切换）
- [ ] 2.6 验证多工具调用场景：每个工具有独立卡片，切换时旧卡片自动折叠，点击可展开查看

## 3. renderChatMessages 增强：重建视觉结构

- [x] 3.1 在 `renderChatMessages` 的消息循环中增加 `reasoning_content` 检测：如果消息有 `reasoning_content`（无论是否有 tool_calls），创建 thinking 卡片并填充内容、设为折叠状态
- [x] 3.2 在 `renderChatMessages` 中增加 `tool_calls` 检测：如果消息有 `tool_calls` 数组（独立于 reasoning_content 判断），为每个 tool call 创建可折叠卡片（折叠状态），并向后查找匹配的 `role: 'tool'` 消息按 `tool_call_id` 关联结果
- [x] 3.3 在 `renderChatMessages` 中确保纯 assistant 消息调用 `renderMarkdown()` 后再插入 innerHTML
- [ ] 3.4 测试旧聊天记录（无 `reasoning_content` / `tool_calls` 字段）降级为普通气泡渲染，不报错

## 4. CSS 样式更新

- [x] 4.1 为 tool call 可折叠卡片添加样式：`.tool-card-collapsed` / `.tool-card-expanded` 切换
- [x] 4.2 确保 tool call 卡片与 thinking 卡片的视觉风格一致（边框色、字号、间距）
- [x] 4.3 响应式适配：卡片内容在窄面板（~400px）中不溢出

## 5. 验证与回归测试

- [ ] 5.1 手动测试：AI 无工具调用对话 → thinking 卡片保留且可折叠/展开
- [ ] 5.2 手动测试：AI 调用工具 → 工具卡片进行中时展开，下一个工具开始后上一个自动折叠，点击可展开查看参数和结果
- [ ] 5.3 手动测试：关闭插件后重新打开 → 聊天记录中 thinking 卡片和 tool call 卡片正确重建
- [ ] 5.4 手动测试：关闭插件后重新打开 → markdown 内容（加粗、代码块、列表等）正确渲染
- [ ] 5.5 手动测试：清空聊天记录 → 重新对话 → 所有功能正常
