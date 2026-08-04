## Context

当前系统中存在两套"用户确认"机制的指令冲突：

1. **基础系统提示词**（`i18n.js` → `agents-md-cache.js` → 系统消息）：rule4 指示 AI "必须先输出 taskCard JSON 等待用户审查"
2. **Skill 系统**：`test-data-generation` 等 Skill 的 prompt 指导 AI 使用 `request_auth` / `ask_user` 等基础卡片工具

`chat.js:541` 仍保留 `msg.taskCard` 渲染钩子作为历史消息回显的兼容逻辑，但该格式的源头——系统提示词——仍在向 AI 生成指令，导致 AI 同时输出 taskCard JSON 文本和调用工具，出现"先输出操作卡片供你确认：```json { ... }```"等异常行为。

## Goals / Non-Goals

**Goals:**
- 统一数据写入前的用户确认流程为 `request_auth` 工具调用
- 从系统提示词中移除 taskCard JSON 格式指令
- 保留 `chat.js` 中 `msg.taskCard` 渲染钩子仅用于历史消息回显，确保旧会话消息不丢失

**Non-Goals:**
- 不删除 `chat.js` 中的 taskCard 渲染函数（`renderTaskCard` 等），历史消息回显仍需它们
- 不改变 `display_table` / `ask_user` / `request_auth` 工具的实现逻辑
- 不改变 `agent-request-execution` 中与 taskCard 无关的请求执行逻辑

## Decisions

### Decision 1: 用 `request_auth` 取代 `ask_user` 做执行确认

**方案**：在 Skill prompt 第6步将 `ask_user` 改为 `request_auth`，同时在基础系统提示词 rule4 中同样指向 `request_auth`。

**理由**：
- `request_auth` 语义专为授权场景设计（`action` + `detail` + `riskLevel`），UI 展示风险等级标记和批准/拒绝按钮
- `ask_user` 语义是"向用户提问获取结构化回答"（`question` + `options` + `multiSelect`），适合业务前置条件错误处理时的结构化选项
- 当前 Skill 用 `ask_user` + `options: ["允许执行", "取消"]` 模拟授权场景，语义错配

**替代方案**：继续用 `ask_user` 做确认。被拒绝原因：`request_auth` 有 `riskLevel` 字段，能清晰告知用户操作风险，比 `ask_user` 的 options 列表更合适。

### Decision 2: `i18n.js` rule4 改为引用工具而非指令格式

**方案**：将 rule4 从 "必须先输出 taskCard JSON" 改为 "必须先用 `request_auth` 工具请求用户授权"。

```diff
- 所有数据写入操作（创建/修改/删除）必须先输出 taskCard JSON 等待用户审查，绝对禁止在用户确认前直接调用 execute_request
+ 所有数据写入操作（创建/修改/删除）必须先用 request_auth 工具请求用户授权，绝对禁止在用户确认前直接调用 execute_request
```

**理由**：rule4 是基础提示词的核心约束，AI 会优先服从。将指令从输出格式改为工具调用，与 Skill 系统的指令一致，消除冲突。

### Decision 3: `chat.js:541-542` 仅移除 `msg.taskCard` 渲染钩子判断

**方案**：移除 `msg.taskCard` 的渲染分叉，因为 AI 不再产生 taskCard JSON 格式内容。

```javascript
// 移除这两行
if (msg.taskCard && typeof window.__renderSkillTaskCard === 'function') {
  window.__renderSkillTaskCard(msg.taskCard);
}
```

但保留 `renderTaskCard()`、`handleTaskExecute()` 等函数体（它们在历史消息回显路径中仍被引用）。

## Risks / Trade-offs

- **[风险] 历史消息中仍可能有 taskCard 格式** → `chat.js` 中 `renderChatMessages` 函数的 taskCard 渲染分支保留，仅移除从 AI 响应中提取 `msg.taskCard` 的逻辑
- **[风险] 其他 Skill 可能依赖 rule4 的 taskCard 指令** → 当前仅 `test-data-generation` 是唯一涉及数据写入的 Skill，其 prompt 已独立说明确认流程，不依赖 rule4
