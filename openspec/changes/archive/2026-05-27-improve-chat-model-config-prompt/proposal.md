## Why

当前"AI聊天"Tab 对未配置大模型的情况采用**静默跳转**处理——点击 Tab 时没有任何提示就跳转到设置页；保存配置后又自动跳回聊天页。用户感知不到发生了什么，交互体验不友好。需要将暗逻辑显式化，改为在用户实际操作聊天功能时才提示配置。

## What Changes

- **移除** 点击"AI聊天"Tab 时因未配模型自动跳转到设置页的暗逻辑（`checkConfigAndOpenChat`）
- **移除** 保存模型配置后自动跳回"AI聊天"Tab 的暗逻辑（`config.js` 中的 `switchTab('chat')`）
- **新增** 在聊天输入框获得焦点或点击发送按钮时，检测模型配置状态
- **新增** 未配置时弹出悬浮提示框，告知用户需要先配置大模型，并提供"前往设置"按钮一键跳转
- 已配置模型时，交互行为与当前保持一致

## Capabilities

### New Capabilities
<!-- No new capabilities introduced -->

### Modified Capabilities
- `ai-chat-panel`: 修改聊天 Tab 切换逻辑——移除静默跳转；新增输入框交互时的配置检测与悬浮提示

## Impact

- `chrome-extension/src/panel/panel.js`: `checkConfigAndOpenChat()` 函数修改或移除；`switchTab` 中 chat 分支逻辑修改；新增配置检测与悬浮提示 UI 逻辑
- `chrome-extension/src/panel/config.js`: 移除保存成功后的 `switchTab('chat')` 调用
- `chrome-extension/src/panel/panel.html`: 可能新增悬浮提示框的 HTML 结构
- `chrome-extension/src/panel/panel.css`: 新增悬浮提示框样式
- `chrome-extension/src/panel/i18n.js`: 新增提示文本的国际化 key
