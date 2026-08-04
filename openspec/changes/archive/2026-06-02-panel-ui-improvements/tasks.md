## 1. CSS 样式调整

- [x] 1.1 在 `panel.css` 中为 `#tab-knowledge` 和 `#tab-settings` 添加 `padding: 12px 16px`
- [x] 1.2 将 `.session-card--active` 的 `border-radius` 从 `8px 8px 8px 8px` 改为 `0 8px 8px 0`

## 2. 聊天输入框 IME 交互优化

- [x] 2.1 在 `chat.js` 中添加 `_isComposing` 标志位变量
- [x] 2.2 在 `chatInputEl` 上注册 `compositionstart` 事件监听，设置 `_isComposing = true`
- [x] 2.3 在 `chatInputEl` 上注册 `compositionend` 事件监听，设置 `_isComposing = false`
- [x] 2.4 在 keydown Enter 处理中增加 `!_isComposing` 条件判断
