## Context

当前 `startAgentLoop` 中，AI 模型的 tool_calls 通过 `executeToolCall` 函数同步执行——工具被调用后立即返回结果，Agent Loop 继续下一轮迭代。这种模式无法处理需要用户交互的场景，因为用户操作是异步的且耗时不确定。

现有聊天界面已有类似交互卡片的先例：思考卡片 (`createThinkingBubble`)、工具调用卡片 (`createCollapsibleToolCard`/`createGroupedToolCard`)。这些卡片的模式可以作为设计参考。

约束：
- 纯 HTML/CSS/JS，无前端框架
- Catppuccin 双主题（深色/浅色）
- 卡片 DOM 在 `chatMessagesEl` 中按序渲染
- 遵循现有的 i18n 多语言机制

## Goals / Non-Goals

**Goals:**
- AI 可通过调用 `askUser` 工具在聊天中展示询问卡片，支持预设选项点击和自由文本输入
- AI 可通过调用 `requestAuth` 工具在聊天中展示授权确认卡片
- 用户回答后（点击选项或提交文本），Agent Loop 恢复执行，AI 收到结构化响应
- 用户拒绝授权时，会话立即终止，后续轮次不再执行
- 卡片样式与现有思考卡片、工具调用卡片视觉风格一致
- 支持 Catppuccin 双主题

**Non-Goals:**
- 不实现文件上传卡片
- 不修改 AI 模型侧逻辑（卡片由前端工具系统实现）
- 不在卡片中实现复杂的自定义 UI 组件

## Decisions

### 决策 1: 使用 Promise 挂起 Agent Loop 等待用户交互

**选择**: 在 `executeToolCall` 中，当遇到 `askUser`/`requestAuth` 时，创建卡片 DOM 并返回一个 Promise，该 Promise 在用户点击按钮时 resolve。Agent Loop 中的 `await executeToolCall(...)` 自然挂起。

**替代方案**: 在工具调用后立即返回占位符，然后通过消息事件系统异步恢复。  
**理由**: Promise 方案最简洁，直接利用现有的 `await` 机制，无需引入额外的事件总线或状态机。工具调用的结果就是用户的选择。

### 决策 2: 卡片作为独立的 DOM 元素插入，而非复用工具调用卡片

**选择**: 为询问卡片和授权卡片分别创建独立的渲染函数（`createQuestionCard`、`createAuthCard`），样式独立于 `.chat-bubble-tool-card`。

**替代方案**: 复用现有的 `createCollapsibleToolCard` 并通过特殊样式扩展。  
**理由**: 两种新卡片的交互模式与工具调用卡片完全不同——它们不是"查看参数和结果"，而是"等待用户点击操作"。独立的 DOM 结构和样式更清晰，便于维护和主题适配。

### 决策 3: `askUser` 和 `requestAuth` 注册在 TOOLS 数组中，但由 `executeToolCall` 特殊处理

**选择**: 将 `askUser` 和 `requestAuth` 加入 `TOOLS` 数组定义（发送给 AI 模型），但在 `executeToolCall` 函数中特殊处理这两个工具名称，不执行常规的工具逻辑，而是创建交互卡片并等待。

**替代方案**: 在 `streamLLM` 的 `onToolCalls` 回调中拦截，不经过 `executeToolCall`。  
**理由**: 在 `executeToolCall` 中处理保持了一致性——Agent Loop 的代码路径不变，只是工具执行结果的产生方式从"同步计算"变成了"用户异步交互"。

### 决策 4: 拒绝授权 = `abortController.abort()` + 错误卡片

**选择**: 当用户点击"拒绝"时，触发 `currentAbortController.abort()`，将发送状态重置为 false，并在聊天中插入一条提示消息。

**替代方案**: 返回一个特殊的错误结果给 AI，让 AI 自行处理。  
**理由**: 授权被拒绝意味着用户的明确意图是"停止"。继续让 AI 处理只会浪费 token。直接终止会话是最符合用户预期的行为。

### 决策 5: askUser 支持预设选项与自由文本的混合模式

**选择**: `askUser` 工具新增 `allowFreeInput` 参数（boolean），当为 true 时卡片底部渲染一个文本输入框和提交按钮。AI 可以同时提供 `options` + `allowFreeInput: true`（混合模式），也可以仅 `allowFreeInput: true`（纯自由输入），或仅 `options`（纯选择题）。用户提交文本时，card resolve 用户输入的文本字符串。

**替代方案**: 创建独立的 `askFreeText` 工具。  
**理由**: 统一在 `askUser` 中管理所有用户问答场景，AI 通过参数控制卡片形态，减少工具数量，降低 AI 选择错误工具的几率。

### 决策 6: 卡片使用 data 属性存储回调上下文

**选择**: 在卡片 DOM 上通过 `data-*` 属性存储必要信息（如 `data-tool-call-id`），在 `chatMessagesEl` 上使用事件委托处理点击。

**替代方案**: 为每个按钮绑定独立的闭包事件处理器。  
**理由**: 事件委托模式与现有 `chatMessagesEl.addEventListener('click', ...)` 保持一致，减少内存泄漏风险。

## Risks / Trade-offs

- **[风险] Promise 挂起导致 Agent Loop 长时间不释放**: 如果用户长时间不操作卡片，Agent Loop 会一直处于等待状态 → 为卡片设置 `data-timeout` 属性并在客户端忽略超时（用户可能离开再回来），但考虑增加 5 分钟超时自动取消的机制作为后续优化
- **[风险] 页面刷新或会话切换时挂起的 Promise 未清理**: 如果用户在卡片等待期间切换会话，旧会话的 Promise 仍在等待 → 需要监听会话切换事件，清理挂起状态；此场景可后续迭代处理
- **[取舍] 两张卡片复用相似的 Promise 挂起逻辑**: 询问卡片和授权卡片的挂起机制高度相似，但视觉和业务语义不同 → 接受少量代码重复，保持各自的独立性和清晰度
