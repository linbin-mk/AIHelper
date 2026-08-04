## Why

当前欢迎页在用户无历史会话时仅展示简介文字，缺少引导用户发起首次对话的入口，导致新用户不知道从何开始。修改为展示推荐提示词卡片，降低首次使用门槛，提升新用户激活率。

## What Changes

- 当「最近会话」列表为空时，改为展示 3 个预设推荐提示卡片（可点击发起对话），替代现有完全隐藏的行为
- 推荐卡片数据通过 i18n 维护，支持中英文
- 卡片 UI 复用现有的 `.recent-session-card` 样式，新增点击发起新会话的行为
- 输入框聚焦时或已有活跃会话时，推荐卡片正常隐藏（由欢迎页整体显隐逻辑控制）

## Capabilities

### New Capabilities

- `welcome-recommend-prompts`: 欢迎页推荐提示卡片 UI，包含预设推荐问题列表及点击发起会话行为

### Modified Capabilities

- `chat-welcome-page`: 修改「无历史会话时不展示快捷入口」的场景行为 — 当无历史会话时不再隐藏「最近会话」区域，改为展示推荐提示卡片

## Impact

- `chrome-extension/src/panel/panel.html`: 在 `#welcomeRecentList` 容器内新增推荐卡片 DOM 占位
- `chrome-extension/src/panel/panel.js`: 修改 `renderRecentSessions()` 逻辑，无历史会话时渲染推荐卡片；新增推荐卡片点击处理函数
- `chrome-extension/src/panel/panel.css`: 可能需要微调推荐卡片样式以区分于历史会话卡片
- `chrome-extension/src/panel/i18n.js`: 新增推荐提示词的 i18n 键值
