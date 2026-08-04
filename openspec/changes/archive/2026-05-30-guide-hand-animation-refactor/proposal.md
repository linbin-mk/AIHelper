## Why

当前搜索触发后使用输入框边框颜色闪烁动画来引导用户注意到搜索框。闪烁动画效果不够直观醒目，且与发送按钮的引导手指动画风格不一致。将两者统一为手指引导动画，同时抽离为可复用的工具函数，提升代码复用性和视觉一致性。

## What Changes

- 搜索框闪烁动画替换为向左手指（👈）引导动画：手指在搜索框右侧左右往复运动，3 秒后淡出
- 将发送按钮引导（👇）和搜索引导（👈）抽离为统一的 `showGuideHand()` 工具函数
- CSS 动画类从 `.send-guide-hand` / `.search-guide-hand` 重构为 `.guide-hand` + 方向修饰器
- 移除旧的 `sidebar-search-input--flash` 样式和 `@keyframes search-flash`

## Capabilities

### New Capabilities

- `guide-hand-animation`: 通用手指引导动画系统，包含 `showGuideHand()` 工具函数、CSS `.guide-hand` 基础样式及方向修饰器

### Modified Capabilities

- `sidebar-capsule-toolbar`: 修改胶囊搜索按钮触发行为（闪烁→手指动画），移除「搜索框颜色闪烁动画」需求
- `multi-session-management`: 修改会话搜索场景中「通过放大镜按钮」和「通过胶囊搜索按钮」的闪烁行为为手指引导动画

## Impact

- `chrome-extension/src/panel/panel.js`: `flashSearchInput()` 逻辑修改、`showSearchGuide()` / `showSendGuide()` 简化为 `showGuideHand()` 包装
- `chrome-extension/src/panel/panel.css`: 移除 `sidebar-search-input--flash` / `send-guide-hand` / `search-guide-hand`，新增 `.guide-hand` 系列
