## Context

当前面板存在三个 UI/UX 问题：
1. 知识页面和设置页面的内容紧贴容器边缘，缺乏视觉呼吸感
2. 激活状态的会话卡片四周都有圆角，导致卡片左侧与侧边栏边缘之间有视觉间隙
3. 聊天输入框在中文输入法组合输入状态下，按 Enter 会直接发送消息，而不是先确认输入内容

这些改动均为纯 CSS 调整或少量 JavaScript 事件处理，不涉及架构变更。

## Goals / Non-Goals

**Goals:**
- 为知识页面和设置页面添加内边距，改善内容排版
- 激活会话卡片左侧无圆角，与侧边栏边缘无缝衔接
- 聊天输入框在 IME 组合状态下按 Enter 不发送消息，符合用户预期

**Non-Goals:**
- 不调整其他页面的布局
- 不改变非激活状态会话卡片的样式
- 不修改消息发送的核心逻辑

## Decisions

1. **知识/设置页面内边距**：通过 `#tab-knowledge` 和 `#tab-settings` ID 选择器添加 `padding: 12px 16px`，而非修改通用 `.tab-content` 类，避免影响聊天/技能/监控等其他 Tab。
2. **会话卡片圆角**：将 `.session-card--active` 的 `border-radius` 从 `8px` 均匀值改为 `0 8px 8px 0`（左上 0，其余保持 8px），与已有的 `border-left: 3px solid` 左边框视觉上衔接。
3. **IME 组合状态**：使用标准 Web API `compositionstart` / `compositionend` 事件追踪 `_isComposing` 标志位，在 keydown Enter 处理中增加 `!_isComposing` 条件判断。这是处理 IME 输入的标准方案，所有现代浏览器均支持。

## Risks / Trade-offs

- [低风险] 知识/设置页面内边距会使内容区域略微缩小，但 12px/16px 的内边距在合理范围内，不影响可用性。
- [低风险] IME 组合事件在某些特殊输入法下可能表现不一致，但 `compositionstart` / `compositionend` 是 W3C 标准，主流输入法均遵循此规范。
