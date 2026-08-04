## Why

当用户的大模型账户余额不足时，API 返回 402 Insufficient Balance 错误，当前聊天页面仅显示通用错误气泡（"请求失败:402:..."），用户无法直观理解错误原因，导致困惑和无效排查。需要在识别到此类错误时，向用户提供明确的账户余额不足提示，降低用户排查成本。

## What Changes

- 在 `streamLLM()` 或 `startAgentLoop()` 的错误处理中识别 "402" 或 "Insufficient Balance" 错误
- 新增专用 i18n 文案：账户余额不足的错误提示和提醒信息
- 错误气泡显示后，自动在聊天中追加一条余额不足的提醒消息气泡（以助手角色发送）
- 兼容中英文双语切换

## Capabilities

### New Capabilities

- `balance-error-handling`: 识别大模型 API 余额不足错误（402），并以用户友好的方式提示用户充值

### Modified Capabilities

<!-- 无现有能力需要修改 -->

## Impact

- `shared/chat.js`：`startAgentLoop()` 的 catch 块（约第 2411 行）新增 402 错误识别分支；新增追加提醒气泡的逻辑
- `shared/i18n.js`：新增 `chat.insufficientBalance` 和 `chat.insufficientBalanceReminder` 等国际化文案
- `shared/css/panel.css`：如需区分提醒气泡样式，可能新增样式
