## Why

当前 AI 聊天输入框为单行 `<input type="text">`，不支持多行输入，用户无法在消息中插入换行（Shift+Enter 无实际效果）。当输入较长内容时，单行输入框视觉受限，无法预览完整文本，影响编辑体验。此变更旨在提升聊天输入的多行编辑能力，同时保持快捷发送的流畅性。

## What Changes

- 将聊天输入框从 `<input type="text">` 替换为 `<textarea>`，支持多行文本输入
- 键盘交互改为：**Enter 发送消息**，**Shift+Enter 插入换行**
- 文本区域随内容自动增高，最大高度限制为初始单行高度的 4 倍；超出最大高度后出现垂直滚动条
- 输入框的高度与布局适配，不影响现有侧边栏和消息列表的布局

## Capabilities

### New Capabilities
- `chat-input-autoresize`: 聊天输入框自动增高能力，随内容行数动态调整高度，最大高度为初始高度的 4 倍，超出后显示垂直滚动条；Enter 发送、Shift+Enter 换行的键盘交互

### Modified Capabilities
<!-- No spec-level requirement changes. Element type and layout changes are implementation
     details; all existing ai-chat-panel requirements (config detection, disabled state, etc.)
     remain unchanged at the behavioral level. -->

## Impact

- 影响文件：`chrome-extension/src/panel/panel.html`（DOM 结构）、`chrome-extension/src/panel/panel.css`（样式）、`chrome-extension/src/panel/chat.js`（事件监听与发送逻辑）、`chrome-extension/src/panel/panel.js`（配置检测拦截适配）
- 需注意斜杠面板的 Enter 键处理逻辑与新的 Enter 发送逻辑之间的交互
- 发送中状态仍需禁用输入框
