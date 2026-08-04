## Why

当前聊天界面中"思考过程"卡片在 AI 正在推理时只有静态文案，用户无法直观感知 AI 正在处理中。需要增加动画效果，让用户清楚知道 AI 正在思考，提升交互体验和用户等待时的感知反馈。

## What Changes

- 在 AI 思考卡片创建后、推理输入完成前，将标签文案从静态 `💭 思考过程` / `💭 Thought Process` 改为 `💭 正在思考` / `💭 Thinking`（中文动态切换，英文使用不同词汇区分）
- 为思考中的标签文字添加 CSS 渐变亮度动画（文字颜色明暗交替循环），直观展示 AI 正在处理中
- 推理完成后标签文案恢复为静态 `💭 思考过程` / `💭 Thought Process`，动画停止
- 若推理发生错误，卡片被移除，动画自然消失

## Capabilities

### New Capabilities
- `thinking-process-indicator`: 思考过程卡片的动态文案与渐变动画效果，让用户在 AI 思考时能感知到处理状态

### Modified Capabilities
<!-- 无现有 spec 需要修改 -->

## Impact

- `chrome-extension/src/panel/chat.js` — `createThinkingBubble()` 函数：区分"思考中"与"已完成"状态，动态更新 `.thinking-label` 文本
- `chrome-extension/src/panel/panel.css` — 新增 `@keyframes` 渐变动画 + `.thinking-active` 状态样式类
- `chrome-extension/src/panel/i18n.js` — 新增 `💭 正在思考` 键，英文静态标签改为 `💭 Thought Process` 以区分 `💭 Thinking`
