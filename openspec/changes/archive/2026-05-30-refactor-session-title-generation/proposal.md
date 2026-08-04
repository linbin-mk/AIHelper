## Why

当前标题生成发生在 AI 首条回复完成后，导致会话卡片在 AI 回复期间不出现，侧边栏存在明显空白等待期。同时首条回复耗时长时，用户在回复完成前无法感知会话的存在。改为即时截取用户消息作为初始标题，1分钟后再用大模型精炼，让卡片立即可见并提升体验流畅度。

## What Changes

- 会话创建时立即将用户提问清理截取作为标题（最多15字符），不再等待 AI 回复完成
- 会话卡片在发送消息后立即渲染到侧边栏，不再延迟到 AI 回复完成
- 启动1分钟延时定时器，到期后调用大模型 API 生成更精炼的标题
- 大模型标题生成成功后替换初始标题；失败则保留初始标题，不做处理
- 移除 `isGeneratingTitle` 防重入标志位（不再需要）
- 侧边栏卡片渲染逻辑简化：不再有"等待标题生成完成"的中间状态

## Capabilities

### New Capabilities

<!-- 无新增能力，所有变更在现有 multi-session-management 能力范围内 -->

### Modified Capabilities

- `multi-session-management`: 修改「AI 自动生成会话标题」需求，标题生成改为两阶段（即时截取 + 延时大模型精炼），会话卡片渲染时机提前到发送消息时

## Impact

- `session-manager.js`: `createSession()` 增加初始标题生成逻辑，`generateSessionTitle()` 逻辑重写，增加延时定时器，移除 `isGeneratingTitle` 标志
- `chat.js`: 会话卡片渲染调用时机提前至发送消息后（不再等待 AI 回复完成）
- `panel.js`: `buildSessionCardHTML` 无需再处理 title 为空的回退显示
- `i18n.js`: 可能调整回退标题文案
