## ADDED Requirements

### Requirement: 余额不足错误识别

系统 SHALL 在 API 请求返回 402 HTTP 状态码时，识别为余额不足错误，而非使用通用错误提示。

#### Scenario: API 返回 402 状态码且响应体包含 "Insufficient Balance"

- **WHEN** 大模型 API 返回 HTTP 402 且响应体包含文本 "Insufficient Balance"
- **THEN** 聊天页面显示用户友好的余额不足错误气泡（使用 `chat.insufficientBalance` 文案）

#### Scenario: API 返回 402 状态码但响应体不包含 "Insufficient Balance"

- **WHEN** 大模型 API 返回 HTTP 402 但响应体不包含 "Insufficient Balance" 文本
- **THEN** 聊天页面仍显示用户友好的余额不足错误气泡（使用 `chat.insufficientBalance` 文案）

### Requirement: 余额不足提醒气泡

系统 SHALL 在显示余额不足错误气泡后，自动追加一条提醒气泡，告知用户需要充值。

#### Scenario: 正常触发提醒气泡

- **WHEN** 系统识别到余额不足错误并显示错误气泡
- **THEN** 聊天中在错误气泡下方追加一条以助手角色显示的提醒气泡，内容为 `chat.insufficientBalanceReminder` 文案

#### Scenario: 提醒气泡保存到历史记录

- **WHEN** 提醒气泡被追加到聊天界面
- **THEN** 提醒气泡内容同时保存到当前会话的消息历史记录中

### Requirement: 国际化支持

系统 SHALL 提供 `chat.insufficientBalance` 和 `chat.insufficientBalanceReminder` 的中英文文案。

#### Scenario: 中文环境显示中文提示

- **WHEN** 用户语言设置为中文且发生余额不足错误
- **THEN** 错误气泡和提醒气泡均显示中文文案

#### Scenario: 英文环境显示英文提示

- **WHEN** 用户语言设置为英文且发生余额不足错误
- **THEN** 错误气泡和提醒气泡均显示英文文案
