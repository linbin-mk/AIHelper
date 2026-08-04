## Context

当前聊天界面的思考过程卡片（`.chat-bubble-thinking`）在 AI 推理流式输入期间，仅显示静态标签文案 `💭 思考过程` / `💭 Thinking`，没有任何视觉动效反馈。用户无法直观感知到 AI 正在处理中。项目为纯原生 JavaScript + CSS（无框架），使用 Catppuccin CSS 变量主题系统。

## Goals / Non-Goals

**Goals:**
- 思考过程中中文标签文案切换为 `💭 正在思考`，英文保持 `💭 Thinking`，通过动画让用户知道系统正在处理
- 为标签文字添加 CSS 渐变动画（明暗交替），增强处理中的视觉反馈
- 推理完成后标签恢复为静态文案，动画停止
- 兼容深色与浅色主题（Catppuccin 变量体系）

**Non-Goals:**
- 不改变思考卡片的展开/折叠交互逻辑
- 不改变思考内容的流式渲染机制
- 不添加 loading 图标或其他视觉元素（仅文字+动画）
- 不涉及历史消息恢复时的思考卡片行为（历史卡片保持折叠且无动画）

## Decisions

### 1. 动画方案：CSS `@keyframes` + `opacity` 呼吸效果

使用 CSS `@keyframes` 定义文字透明度在 60% 和 100% 之间循环交替，模拟"暗一些→亮回来"的呼吸感。

```css
@keyframes thinking-breathe {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}

.thinking-active .thinking-label {
  animation: thinking-breathe 1.5s ease-in-out infinite;
}
```

**备选方案被排除的原因：**
- `background-clip: text` + `linear-gradient` 渐变：实现复杂，且需额外处理 `-webkit-text-fill-color` 与主题色兼容
- 骨架屏/闪烁：视觉风格与当前设计不一致，且会遮挡已输出的推理文字

### 2. 状态切换方案：JavaScript 控制 `.thinking-active` CSS 类

在 `createThinkingBubble()` 创建卡片时默认添加 `.thinking-active` 类并设置标签文本为 `正在思考...`。推理完成后移除该类并恢复标签文本为 `思考过程`。

- 创建时（`createThinkingBubble` / history 恢复）：不添加 `.thinking-active`（历史卡片保持静态）
- 流式推理开始时（`onReasoning` 回调首次命中）：在新建的 thinkingEl 上添加 `.thinking-active` 类并更新标签
- 推理完成后（`thinkingEl.classList.add('thinking-collapsed')` 处）：移除 `.thinking-active` 并恢复标签为 `t('chat.thinkingLabel')`

### 3. 国际化新增键

在 `i18n.js` 中新增：
- `chat.thinkingActive`：中文 `💭 正在思考` / 英文 `💭 Thinking`
- 英文静态标签 `chat.thinkingLabel` 改为 `💭 Thought Process`，区别于动态的 `💭 Thinking`

保持现有 `chat.thinkingLabel` 不变，用于推理完成后的静态标签。

## Risks / Trade-offs

- **风险**：CSS 动画持续运行时可能轻微增加 GPU 渲染开销 → **缓解**：仅对 `opacity` 属性做动画，不涉及 layout/paint，对性能影响极小；推理完成后立即停止动画
- **风险**：`opacity` 变化在某些低性能设备上可能不流畅 → **缓解**：使用 `ease-in-out` 缓动，动画周期设为 1.5 秒，避免过快切换
- **风险**：主题兼容性：`.thinking-label` 使用 `var(--ctp-pink)`，`opacity` 动画仅影响透明度不影响颜色，对浅色/深色主题均适用
