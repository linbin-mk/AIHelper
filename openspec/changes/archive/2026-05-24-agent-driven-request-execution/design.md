## Context

当前系统架构中，TaskCard 的"执行"按钮点击后直接发送 `BATCH_EXECUTE` 消息到 background.js，由 `batch-executor.js` 在页面中并发执行 fetch 请求。请求头由 `executeBatch()` 从最近捕获的请求中简单复用，带硬编码默认值（`Content-Type: application/json;charset=UTF-8`）。失败后无自动重试机制。

新方案将执行决策权从硬编码逻辑转移到 AI Agent：用户点击"允许执行"后，Agent 通过工具调用查询请求详情 → 智能决定请求头 → 发起请求 → 分析失败原因 → 调整重试 → 输出报告。

## Goals / Non-Goals

**Goals:**
- AI Agent 全权负责请求头决策，零硬编码默认值
- Agent 通过工具调用执行单次 HTTP 请求，获取完整响应供分析
- 失败自动重试，最多 10 次，Agent 根据错误信息智能调整
- 执行完成后输出结构化结果报告

**Non-Goals:**
- 不改变请求捕获（interceptor）逻辑
- 不改变 AI 聊天流式响应机制
- 不改变 headerManager.js 的 DNR 注入逻辑

## Decisions

### 决策 1: 请求执行走页面注入（与现有 batch-executor 模式一致）

**选择**: `chrome.runtime.sendMessage({type: 'EXECUTE_REQUEST', ...})` → background.js 通过 `chrome.scripting.executeScript` 向目标 Tab 注入请求执行脚本，在页面上下文中执行 `fetch()`，结果通过消息回传。

**原因**: 
- 页面注入方式携带页面已有的 Cookie 和认证状态，无需 Agent 手动提取和传递
- 与现有 `batch-executor.js` 模式一致，复用已有的注入通道和消息回报机制
- 用户在 AI 聊天框中可看到 Agent 每次工具调用的输入/输出（查询请求 → 发请求 → 看结果 → 调整 → 重试），过程透明可追踪

**替代方案**: 在 background.js Service Worker 中直接 `fetch()`。优势是简单且不受 CORS/CSP 限制，但无法携带页面 Cookie/认证状态，Agent 需手动从捕获请求中提取并传递，增加复杂度且容易出错。

### 决策 2: 新增两个 Agent 工具而非复用现有工具

**选择**: 新增 `get_captured_request_detail` 和 `execute_request` 两个独立工具。

**原因**: 现有 `get_captured_requests` 只返回请求摘要（URL、方法、状态码），不包含请求头和请求体。HTTP 执行需要新工具，职责单一。工具数量增加但每个工具语义清晰。

### 决策 3: 重试循环在 Agent 循环内实现

**选择**: Agent 在 `startAgentLoop` 内自然进行多轮 tool call 完成重试，不需要单独的循环逻辑。

**原因**: 利用现有的 Agent 循环机制（`startAgentLoop` → `streamLLM` → `executeToolCall` → 注入结果 → 继续循环），每次失败 Agent 会收到包含错误信息的工具返回值，然后 LLM 分析并决定下一轮调用什么。重试上限通过在系统提示词中告知 Agent 实现。

### 决策 4: 按钮逻辑改为注入 Agent 消息

**选择**: "允许执行"按钮点击后，向聊天消息列表注入一条用户消息（如"请执行任务卡片 #{taskId}，查询页面捕获的请求信息，智能配置请求头并发送请求"），然后触发 `sendMessage()`。

**原因**: 复用现有 Agent 循环，无需新增独立的执行流程。Agent 自然会调用工具、分析结果、调整重试。

## Risks / Trade-offs

- **[风险] Agent 可能无限循环**: → 缓解：系统提示词中明确限制最大重试 10 次，Agent 循环内部 `maxIterations` 已有保护
- **[风险] 页面 CSP 限制注入的脚本**: → 缓解：使用 `chrome.scripting.executeScript` 的 MAIN world 注入（与现有 batch-executor 一致），可绕过页面 CSP。如页面有严格 CSP，Agent 会收到错误并尝试调整
- **[风险] `execute_request` 超时阻塞**: → 缓解：注入脚本内设置 30 秒超时（AbortController），超时后返回错误信息供 Agent 分析
- **[风险] LLM 调用成本增加**: 每次执行会触发多轮 LLM 调用（请求分析 + 重试决策），约 3-10 轮/次 → 缓解：这是"智能执行"的必然代价，用户接受
- **[风险] Agent 生成的请求头不安全**: Agent 可能生成包含敏感信息的请求头 → 缓解：与现有行为一致（Agent 从捕获请求中读取请求头，而非凭空生成）

### 决策 5: 彻底移除旧批量执行逻辑

**选择**: 删除 `batch-executor.js`、移除 `BATCH_EXECUTE`/`BATCH_CANCEL`/`BATCH_PROGRESS`/`BATCH_COMPLETE` 消息处理、移除 `batch_create_data` 工具。

**原因**: 旧批量执行方式是 Agent 驱动执行的旧版本，存在硬编码请求头、无智能重试等问题。新方案完全替代旧逻辑，不留两种执行路径避免代码膨胀和用户混淆。

## Migration Plan

1. 修改 `chat.js`：按钮文案 + 点击逻辑 + 新增工具 + Agent 提示词 + 移除 `batch_create_data` 工具
2. 修改 `background.js`：新增 `QUERY_REQUEST_DETAIL`、`EXECUTE_REQUEST` 消息处理器；移除 `BATCH_EXECUTE`、`BATCH_CANCEL`、`BATCH_PROGRESS`、`BATCH_COMPLETE` 消息处理和 `executeBatch()` 函数
3. 新增 `src/content/execute-request-inject.js`：轻量注入脚本，在页面上下文中执行单次 fetch 并回报结果
4. 删除 `src/content/batch-executor.js`
5. 修改 `manifest.json`：移除 `batch-executor.js` 的 web_accessible_resources
6. 修改 `panel.js`：移除 `BATCH_PROGRESS`/`BATCH_COMPLETE` 消息监听和 `handleTaskCancel()` 调用

## Open Questions

- 无
