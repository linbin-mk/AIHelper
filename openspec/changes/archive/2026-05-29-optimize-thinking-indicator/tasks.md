## 1. 国际化文案

- [x] 1.1 在 `i18n.js` 中文配置中新增 `chat.thinkingActive` 键，值为 `💭 正在思考`
- [x] 1.2 在 `i18n.js` 英文配置中新增 `chat.thinkingActive` 键，值为 `💭 Thinking`；同时将 `thinkingLabel`/`thinkingTitleExpanded`/`thinkingTitleCollapsed` 英文值改为 `💭 Thought Process` 以区分

## 2. CSS 动画与样式

- [x] 2.1 在 `panel.css` 中新增 `@keyframes thinking-breathe` 动画：`opacity` 在 `0.6` 和 `1` 之间循环，周期 1.5s，`ease-in-out`
- [x] 2.2 在 `panel.css` 中新增 `.thinking-active .thinking-label` 规则：应用 `thinking-breathe` 动画，`infinite` 循环

## 3. 思考卡片创建逻辑

- [x] 3.1 修改 `createThinkingBubble()` 函数：创建时默认不添加 `.thinking-active` 类，标签文案使用 `t('chat.thinkingLabel')`（静态文案）
- [x] 3.2 在 `startAgentLoop()` 的 `onReasoning` 回调中（首次创建 thinkingEl 后）：为 thinkingEl 添加 `.thinking-active` 类，将标签文案切换为 `t('chat.thinkingActive')`

## 4. 推理完成状态切换

- [x] 4.1 在 `startAgentLoop()` 中有 tool_calls 的分支（`thinkingEl.classList.add('thinking-collapsed')` 处）：移除 `.thinking-active` 类，恢复标签文案为 `t('chat.thinkingLabel')`
- [x] 4.2 在 `startAgentLoop()` 中无 tool_calls 的分支（`thinkingEl.classList.add('thinking-collapsed')` 处）：移除 `.thinking-active` 类，恢复标签文案为 `t('chat.thinkingLabel')`

## 5. 验证测试

- [x] 5.1 构建并加载插件，发送一条会触发推理的 AI 消息，验证思考卡片标签显示 `💭 正在思考` 且文字有呼吸动画
- [x] 5.2 等待推理完成，验证标签恢复为 `💭 思考过程` 且动画停止，卡片正常折叠
- [x] 5.3 在中文和英文语言设置下分别验证文案正确性
- [x] 5.4 刷新页面后验证历史恢复的思考卡片不带动画效果
