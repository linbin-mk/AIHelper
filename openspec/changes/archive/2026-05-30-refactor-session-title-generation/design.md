## Context

当前标题生成流程：创建会话 → 发消息 → AI回复完成 → 调大模型生成标题 → 侧边栏出现卡片。等待期间侧边栏无任何反映，用户体验有空白感。

代码位置：
- `session-manager.js:23-37` — `createSession()`，title 初始化为空
- `session-manager.js:115-143` — `generateSessionTitle()`，含 title 已存在守卫和 isGeneratingTitle 防重入
- `session-manager.js:145-184` — `_requestTitle()` / `_fallbackTitle()`
- `chat.js:1691-1728` — `sendChatMessage()` 中创建会话逻辑
- `chat.js:2057-2073` — AI 完成后触发 `generateSessionTitle()`
- `panel.js:890-902` — `buildSessionCardHTML()`，title 为空时回退显示「未命名会话」

## Goals / Non-Goals

**Goals:**
- 用户发送首条消息后，会话卡片立即可见（使用截取的用户消息作为标题）
- 1分钟后通过大模型精炼标题，静默更新
- 简化标题生成状态管理，移除中间等待态

**Non-Goals:**
- 不改变标题的最大长度（保持15字符）
- 不改变大模型标题生成的 prompt 逻辑
- 不改变用户手动重命名功能

## Decisions

### 1. 两阶段标题生成策略

```
发送首条消息
   │
   ▼
阶段1（即时）：title = sanitize + truncate(userMessage, 15)
   │           titleSource = 'truncated'
   │           渲染卡片到侧边栏
   │           启动 1 分钟定时器
   │
   ▼
阶段2（延时1分钟）：调用 _requestTitle(userMessage, aiResponse)
   │           ├─ 成功 → title = AI结果，titleSource = 'ai'，更新卡片
   │           └─ 失败 → 不做任何处理，保留阶段1标题
```

### 2. 定时器管理

使用模块级 `Map<string, number>` 存储 sessionId → timerId 映射：
- 原因：`setTimeout` ID 不可序列化，不适合存到 session 对象中
- 定时器仅在页面生命周期内有效，页面刷新后不恢复（阶段1标题已足够）

### 3. 标题来源标记

新增 `titleSource` 字段区分截取标题和 AI 生成标题：
- `'truncated'`：来自用户消息截取的初始标题
- `'ai'`：来自大模型 API 精炼后的标题

用途：
- 定时器到期后只处理 `titleSource === 'truncated'` 的会话
- 用户手动重命名后不需更新此字段（手动修改优先级最高）
- 未来可用于 UI 区分展示（如标题旁加 AI 标识）

### 4. 触发时机

标题设置在 `sendChatMessage` 中创建会话后立即执行，而非在 `createSession` 中：
- 原因：`createSession` 被调用时还没有用户消息内容，无法截取标题
- 保持 `createSession` 纯粹：只创建会话结构，不依赖消息内容

### 5. 防重入简化

移除 `isGeneratingTitle` 标志位：
- 旧逻辑需要此标志是因为标题为空时可能被多次触发
- 新逻辑在发送消息时立即设置 title，不会再出现 title 为空的状态
- 会话进行中无法切换会话，不存在并发创建多个会话的场景

### 6. 停止按钮取消定时器

用户点击「停止」按钮时 SHALL 清除当前会话的延时标题定时器：
- 在 `stopAgentLoop` 中调用 `_clearTitleTimer` 清除定时器
- 定时器取消后不再尝试 API 精炼，截取标题即为最终标题
- 原因：用户主动停止代表对当前对话不满意，无需额外 API 调用

### 7. 会话早期完成直接精炼标题

AI 在 1 分钟定时器到期前完成首条回复时，直接取消定时器并用完整 AI 回复生成标题：
- `startAgentLoop` 中 AI 正常完成时，检查 `titleSource === 'truncated'`
- 若定时器尚未触发，清除定时器并立即调用 `generateSessionTitle(sid, userText, finalText)`
- 此时 AI 回复已完整生成，标题质量会比空 AI 回复的定时器回调更好

### 8. DeepSeek v4 推理模式兼容

DeepSeek v4 模型默认开启推理，`content` 和 `reasoning_content` 共享 `max_tokens` 额度：
- `max_tokens` 从 30 提高到 100，确保推理后有足够 token 输出标题
- 标题提取只用 `content`，不回退到 `reasoning_content`（那是思考过程不是答案）
- `finish_reason === 'length'` 时输出诊断日志辅助排查

### 9. 竞态条件修复

`setInitialTitle` 和 `doSendMessage → saveCurrentMessages` 存在竞态：
- 两者都加载同一份 sessions、修改后分别保存，后保存者覆盖前者
- 修复：`doSendMessage` 收进 `setInitialTitle.then()` 回调，确保标题先落盘再发消息

## Risks / Trade-offs

- **[风险] 截取标题质量低**：用户输入「帮我看一下这个问题」被截为「帮我看一下这个问」，意义不完整
  → 缓解：1分钟后 AI 精炼标题会覆盖，15字符自然截断是当前回退方案已有的行为

- **[风险] 页面刷新后定时器丢失**：用户发消息后立即刷新页面，标题停留在截取版本
  → 缓解：截取标题已有可读性，不会出现「未命名会话」空白态；用户可手动重命名；未来可考虑恢复机制

- **[取舍] titleSource 字段未持久化恢复定时器**：为了使实现简洁，不做刷新后恢复定时器
  → 影响有限，截取标题已能满足基本使用；AI 精炼标题是锦上添花
