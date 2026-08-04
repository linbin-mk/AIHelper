## Why

当前 `#chatInput` 的高度自适应完全依赖 JS 手动测量 `scrollHeight`，并辅以 `MutationObserver` 监听主题切换，架构偏重。Chrome 已稳定支持 `field-sizing: content`，可在插件可控环境中以 CSS progressive enhancement 替代大部分 JS 逻辑，精简代码、减少 observer 开销。

## What Changes

- 将 `chatInput` 的高度自适应从纯 JS 方案重构为 **CSS 优先 + JS fallback** 方案
- CSS 层：启用 `field-sizing: content`（Chromium 环境全覆盖），设置 `min-height` / `max-height` 约束
- JS fallback 层：对不支持 `field-sizing` 的旧浏览器保留基于 `scrollHeight` 的 `input` 事件自适应
- 移除 `MutationObserver` 主题切换监听（`field-sizing` 不受主题字体变化影响）
- 移除 `measureChatInputHeight()` 和 `resetChatInputHeight()` 的显式高度操作
- 发送后重置高度的行为交由 CSS（清空内容后自动回到 `min-height`）和 fallback 共同保证

## Capabilities

### New Capabilities
无新增能力，此为纯实现重构。

### Modified Capabilities
无。此为纯实现重构，所有用户可观测行为与现有 `chat-input-autoresize` spec 完全一致。

## Impact

- `chrome-extension/src/panel/chat.js`: 删除 `measureChatInputHeight()`、`resetChatInputHeight()`、`MutationObserver` 主题监听、初始化调用；新增 `field-sizing` fallback 检测和 `input` 事件监听
- `chrome-extension/src/panel/panel.css`: 修改 `.chat-input` 样式，新增 `field-sizing` 支持
