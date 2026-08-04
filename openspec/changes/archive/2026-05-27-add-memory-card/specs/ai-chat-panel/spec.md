## MODIFIED Requirements

### Requirement: 聊天完成后触发记忆生成
系统 SHALL 在 `startAgentLoop` 完成最终回复保存后，异步触发记忆生成流程。

#### Scenario: 正常对话完成后触发记忆生成
- **WHEN** `startAgentLoop` 中无 tool_calls 分支执行 `await saveCurrentMessages()` 后
- **THEN** 系统异步调用 `triggerMemoryGeneration(sessionMessages, getCurrentHostname())`
- **AND** 该调用不 await，确保不阻塞 UI

#### Scenario: 生成记忆不阻塞发送状态
- **WHEN** 记忆生成被触发
- **THEN** `setSending(false)` 在触发前已执行
- **AND** 用户可立即发起新一轮对话

#### Scenario: 错误或取消时跳过记忆生成
- **WHEN** 用户取消对话或 AI 返回错误
- **THEN** 系统不触发记忆生成
