## Context

当前 `shared/chat.js` 的 `startAgentLoop()` 在 `catch` 块中处理 API 错误，对 401/403/404/timeout 有专用提示，但 402（余额不足）走通用分支，仅显示原始错误信息 `"请求失败:402:..."`。用户无法直观理解问题原因，也不知道如何解决。

错误响应格式为 `"402:{"error":{"message":"Insufficient Balance",...}}"`，其中 HTTP 状态码在前，JSON 错误体在后。

## Goals / Non-Goals

**Goals:**
- 识别 API 返回的 402 状态码或 "Insufficient Balance" 错误消息
- 以中文/英文友好文案告知用户余额不足，并提示充值
- 在错误气泡后自动追加一条提醒气泡，进一步引导用户

**Non-Goals:**
- 不实现充值功能或跳转到充值页
- 不修改 API 请求/响应流程
- 不添加余额查询或预警功能
- 不改变现有的 401/403/404 错误处理逻辑

## Decisions

### 1. 错误识别位置：在 `startAgentLoop()` catch 块中新增分支

在现有 401/403/404 分支后添加 402 分支。错误消息格式为 `"402:<body>"`，可通过 `msg.includes('402')` 或检查 `msg.startsWith('402:')` 识别。

选择此处而非 `streamLLM()` 内部是因为：现有错误处理模式一致在 catch 块中通过 HTTP 状态码分流，保持一致性。

### 2. 提醒气泡实现：在 `showErrorBubble()` 后追加助手气泡

`showErrorBubble()` 创建错误气泡（带 `❌` 前缀，红色样式）。余额不足需额外显示充值引导，有两种方案：

| 方案 | 描述 | 选择 |
|------|------|------|
| A | 修改错误消息内容，在一条气泡中同时包含错误信息和充值提示 | 不选：错误气泡风格偏负面，提醒内容更适合中性信息展示 |
| B | 错误气泡保持 `showErrorBubble()` 输出，其后追加普通助手气泡显示提醒 | **选择**：区分错误提示与引导信息，提醒气泡用普通助手样式，语义清晰 |

实现方式：在 402 分支调用 `showErrorBubble()` 后，调用 `appendMessageBubble('assistant', reminderText)` 追加提醒气泡。两个气泡均保存到会话历史记录。

**提醒文案无需额外样式**，可直接复用 `.chat-bubble` 普通样式（与 AI 回复一致）。

### 3. i18n 文案设计

新增两个文案键：

- `chat.insufficientBalance`：主错误信息，替代通用 `"请求失败:402:..."` 文本
  - 中文："账户余额不足，API 请求被拒绝 (402)"
  - 英文："Insufficient account balance, API request rejected (402)"
- `chat.insufficientBalanceReminder`：提醒气泡内容，用于引导用户充值
  - 中文："您的账户余额已用尽，请前往模型服务商平台进行充值，充值后将自动恢复使用。"
  - 英文："Your account balance has been exhausted. Please top up on the model provider's platform to resume usage."

### 4. 错误识别条件

使用宽松匹配策略，兼顾不同 API 提供商的返回格式：

1. 优先检查 HTTP 状态码包含 `402` → 确定余额不足
2. 同时检查响应体中是否包含 `Insufficient Balance`（不限大小写）

只要满足条件 1，或同时满足条件 1+2，即触发余额不足处理。

## Risks / Trade-offs

- **[误判风险]** 若未来有非余额相关的 402 错误，会显示误导性提示 → 同时检查状态码和消息体关键字，降低误判概率
- **[重复气泡]** 提醒气泡追加后，若用户切换会话再回来，会看到两个气泡 → 可接受，两个气泡语义不同，符合预期
- **[多语言兼容]** 不同 API 提供商返回的 Insufficient Balance 消息可能包含不同措辞 → 使用 includes 模糊匹配，或后续按需扩展关键字列表
