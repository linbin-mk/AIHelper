## 1. CSS 层重构

- [x] 1.1 修改 `.chat-input` 样式：将 `min-height: unset`、`overflow-y: hidden` 替换为 CSS 自定义属性方案 — 定义 `--chat-font-size: 13px`、`--chat-line-height: 1.4`、`--chat-max-rows: 4`、`--chat-padding-v: 16px`，用 `calc()` 计算 `min-height` 和 `max-height`；设置 `overflow-y: auto`
- [x] 1.2 添加 `@supports (field-sizing: content)` 块，在其中设置 `field-sizing: content`
- [x] 1.3 移除 `.chat-input.scrollable` CSS 规则（`overflow-y: auto` 已覆盖滚动条行为）

## 2. JS fallback 实现

- [x] 2.1 新增模块级常量 `const SUPPORTS_FIELD_SIZING = CSS.supports('field-sizing', 'content')`，作为能力检测的冻结判断
- [x] 2.2 删除 `_chatInputMinHeight`、`_chatInputMaxHeight` 全局变量
- [x] 2.3 删除 `measureChatInputHeight()` 函数及其初始化调用
- [x] 2.4 删除 `resetChatInputHeight()` 函数
- [x] 2.5 删除 `_themeObserver` MutationObserver 及其 observe 调用
- [x] 2.6 删除 `sendChatMessage()` 中 `resetChatInputHeight()` 调用
- [x] 2.7 重构 `autoResizeChatInput()` 为纯 fallback 版本：当 `!SUPPORTS_FIELD_SIZING` 时注册 `input` 监听；fallback 内部通过 `getComputedStyle` 读取 CSS 自定义属性（`--chat-font-size` 等）计算 min/max 高度，与 CSS `calc()` 公式保持一致，避免硬编码
- [x] 2.8 删除所有 `chatInputEl.classList.add/remove('scrollable')` 调用（`.scrollable` 类已被彻底移除）

## 3. 验证

- [x] 3.1 验证 `field-sizing` 路径下：单行输入、多行自动增高、4 行上限截断、粘贴大量文本、emoji、IME 组合输入均正常
- [x] 3.2 验证 fallback 路径下行为一致（Chrome 开发者工具中模拟不支持 `field-sizing`）
- [x] 3.3 验证发送消息后输入框高度正确重置为 `min-height`
- [x] 3.4 验证主题切换（`data-theme` 变化）后输入框表现正常，无需 JS 干预
- [x] 3.5 验证发送中禁用态输入框样式正常
