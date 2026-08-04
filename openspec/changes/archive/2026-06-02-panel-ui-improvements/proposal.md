## Why

面板界面在几个交互细节上存在问题：知识/设置页面缺少内边距导致内容紧贴边缘；激活状态的会话卡片左侧与侧边栏边缘有间隙，视觉上不连贯；中文输入法下，组合输入（有联想候选词）时按回车会直接发送消息而非先确认输入内容。

## What Changes

- 知识页面和设置页面增加 `padding: 12px 16px`，避免内容紧贴边缘
- 激活状态的会话卡片左边移除圆角，右边保留圆角，与侧边栏左边缘无缝衔接
- 聊天输入框新增 IME 组合状态追踪，中文输入法组合输入时按回车不再触发发送，需二次回车确认后再发送

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `ai-chat-panel`: 聊天输入框的 Enter 发送行为在 IME 组合输入期间被抑制，仅在组合结束后允许发送

## Impact

- `chrome-extension/src/panel/panel.css` — 新增 `#tab-knowledge, #tab-settings` 选择器；修改 `.session-card--active` 的 border-radius
- `chrome-extension/src/panel/chat.js` — 新增 `compositionstart` / `compositionend` 事件监听及 `_isComposing` 标志位，修改 keydown Enter 处理逻辑
