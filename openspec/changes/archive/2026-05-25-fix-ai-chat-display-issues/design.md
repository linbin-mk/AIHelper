## Context

AI 聊天模块（`chat.js`）当前在实时对话中对 thinking 卡片、tool call 卡片和 markdown 的渲染表现正常，但存在三个缺陷：

1. **无工具调用路径下 thinking 卡片被销毁**（chat.js:709 `thinkingEl.remove()`），用户无法回顾 AI 的思考过程
2. **工具调用和结果以纯文本展开**，没有折叠/展开机制，内容冗长时占据大量空间
3. **关闭插件后重新打开**，`renderChatMessages` 不会重建 thinking 卡片和 tool call 卡片，也不会对 markdown 内容做渲染

本项目为纯原生 JS Chrome 扩展，无构建工具，无外部依赖。聊天记录以 JSON 数组存储于 `chrome.storage.local`。

## Goals / Non-Goals

**Goals:**
- thinking 卡片在无工具调用路径下保留并默认为折叠状态，可点击展开
- 工具调用与结果合并为单个可折叠卡片，具有"进行中→完成展开→自动折叠"生命周期
- `renderChatMessages` 从存储数据中正确重建 thinking 卡片和 tool call 卡片
- `renderChatMessages` 对 assistant 消息调用 `renderMarkdown()` 渲染 markdown
- 消息存储格式不需要破坏性变更——现有 `reasoning_content` 和 `tool_calls` 字段已足够

**Non-Goals:**
- 不改动流式传输逻辑（SSE 解析、token 拼装等）
- 不改动 `buildMessages` 构建消息发送给 LLM 的逻辑
- 不引入新外部依赖
- 不改变已有的 taskCard/combinedTaskCard 渲染逻辑

## Decisions

### 1. 思考卡片：从"移除"改为"保留并折叠"

**当前行为**：在 `startAgentLoop` 的纯文本回复路径（L708-709），`thinkingEl.remove()` 直接将思考卡片从 DOM 中移除。

**修改方案**：参考工具调用路径（L629-635）的做法，将移除改为填充内容 + 折叠：
- 将 `thinkingEl.remove()` 替换为：
  ```
  if (thinkingEl && thinkingTextEl) {
    thinkingTextEl.textContent = currentReasoningContent || streamedReasoning;
    thinkingEl.classList.add('thinking-collapsed');
  }
  ```
- toggle 的 `onclick` 内联处理器已存在且可工作（`t()` 为全局函数），无需额外改动
- 若 reasoning 从未触发（`thinkingEl` 为 null），跳过即可

**备选方案**：新建一个独立的折叠卡片来容纳 reasoning_content。但复用已有 DOM 更简单，且与工具调用路径的行为一致。

### 2. 工具调用卡片：改为可折叠结构 + 进行中状态 + 自动折叠

**当前行为**：`showToolCallBubble` 和 `showToolResultBubble` 分别创建两个独立的 DOM 元素，内容直接展开。

**修改方案**：创建一个新的函数 `createCollapsibleToolCard(toolName, args, result)`，生成类似 thinking card 的可折叠结构，并引入完整的生命周期：

**卡片状态机**：
```
┌──────────┐   工具开始执行   ┌──────────────┐   结果返回   ┌────────────┐
│  创建     │ ──────────────▶ │  进行中       │ ──────────▶ │  完成展开   │
│ (折叠)    │                │ (展开,动态)    │             │ (展开)     │
└──────────┘                └──────────────┘             └─────┬──────┘
                                                                │
                                                    下一个工具   │
                                                    开始调用     │
                                                                ▼
                                                          ┌────────────┐
                                                          │  完成折叠   │
                                                          │ (可点击展开)│
                                                          └────────────┘
```

**各阶段行为**：
- **创建时**：卡片默认折叠，头部显示"🔧 调用 {toolName}"
- **进行中**：AI 开始执行工具时卡片展开，头部显示"⚡ 调用 {toolName} ... 进行中"，内容区可能有动态状态提示
- **完成展开**：结果返回后填充结果内容，卡片保持展开状态，方便用户看到刚返回的数据
- **完成折叠**：下一个工具调用开始（或最终回复开始时），卡片自动折叠，用户可点击头部展开查看完整内容

**实现细节**：
- 将 `showToolCallBubble` + `showToolResultBubble` 合并为统一的卡片管理
- 卡片引用存入数组，新工具调用时折叠数组中所有旧卡片
- 点击头部切换展开/折叠，不受自动折叠影响

**备选方案**：保持两个独立气泡但各自加折叠。但工具调用和结果在逻辑上是一个操作的两个阶段，合并更自然，也更节省空间。

### 3. 消息恢复：renderChatMessages 增强

**当前行为**：`renderChatMessages`（chat.js:116-133）只处理了 `combinedTaskCard` 和 `taskCard` 两种特殊类型，其余消息一律走 `appendMessageBubble` 普通气泡路径。

**修改方案**：在 `messages.forEach` 循环中分别判断 reasoning_content 和 tool_calls（两者独立，不互斥）：

```
messages.forEach((msg) => {
  if (msg.combinedTaskCard && ...) {
    // 不变 — skill 批量任务卡片
  } else if (msg.taskCard && ...) {
    // 不变 — skill 单个任务卡片
  } else {
    // 1. 有 reasoning_content → 始终重建 thinking 卡片
    if (msg.reasoning_content) {
      createThinkingBubble() 并填充 reasoning_content
    }

    // 2. 有 tool_calls → 重建工具卡片（独立判断，不 else if）
    if (msg.tool_calls) {
      for each tc in msg.tool_calls:
        createCollapsibleToolCard(tc) 处于 collapsed 状态
      向后查找 matching tool result 消息填充到对应卡片
    }

    // 3. 有文本内容 → 渲染内容气泡
    if (msg.content) {
      if (msg.role === 'assistant') {
        appendMessageBubble(content, renderMarkdown(content))
      } else {
        appendMessageBubble(content)
      }
    }
  }
})
```

**关键细节**：
- `reasoning_content` 在存储中已存在（add-ai-chat 时已添加），无需改存储格式
- `tool_calls` 和 `tool_call_id` 也已存储，可直接用于重建
- tool result 消息（role: 'tool'）有 `tool_call_id`，可与对应的 assistant tool_calls 消息匹配
- 对 assistant 内容调用 `renderMarkdown()` 修复 markdown 渲染问题

### 4. 自动折叠触发时机：下一个工具开始时

**选择**：当 AI 开始调用下一个工具时，自动折叠前一个工具卡片。

**理由**：
- 用户通常只需要关注当前正在执行的工具，之前的工具结果是"已过时"的信息
- 折叠后聊天区域更清爽，不会被多个展开的卡片占据大量空间
- 用户仍然可以点击展开查看历史工具调用的完整内容

**行为序列**：
```
思考卡片(展开,动态) → 思考卡片(折叠)
                     → 工具1卡片(展开,进行中) → 工具1卡片(展开,已完成)
                                                  → 工具2卡片(展开,进行中)
                       工具1卡片(自动折叠) ←──────┘
                                                           → 思考卡片(折叠)
                                                             工具1卡片(折叠)
                                                             工具2卡片(展开,已完成)
                                                           → 工具2卡片(自动折叠)
                                                           → 最终回复
```

**备选方案**：
- 最终回复时统一折叠所有卡片 → 工具数量多时中间区域过于拥挤，且用户无法聚焦当前工具
- 从不自动折叠 → 工具循环多轮后聊天区域被大量展开卡片填满

### 5. 工具结果关联逻辑

当前工具结果消息存储在 `window.chatMessages` 中，格式为：
```
{ role: 'tool', tool_call_id: 'call_xxx', content: '{"result": ...}' }
```

在重建时，遍历消息列表，将 `role: 'tool'` 的消息与前面最近的 `tool_calls` 消息按 `tool_call_id` 关联。因为单线程对话中工具调用的顺序是确定的，按顺序配对即可。

## Risks / Trade-offs

- **[兼容性] `renderChatMessages` 新增分支可能影响现有 skill 的 taskCard 渲染** → 新增分支放在已有 `taskCard` 判断之后，互不干扰
- **[数据完整性] 旧聊天记录没有 `reasoning_content` 或 `tool_calls` 字段** → 降级为普通气泡渲染，行为与当前一致，不影响展示
- **[性能] 大量 tool_calls 消息恢复时 DOM 操作较多** → 每条消息创建 1-2 个 DOM 元素，聊天记录上限 200 条，性能无影响
