## ADDED Requirements

### Requirement: 请求数据作为系统上下文注入

系统 SHALL 在每次发送聊天消息时，将当前捕获的 HTTP 请求数据作为系统消息注入到 LLM 请求的上下文。

#### Scenario: 发送消息时注入请求数据
- **WHEN** 用户发送聊天消息时存在已捕获的请求数据
- **THEN** 系统构建消息列表时，在用户消息之前插入一条 system 消息，内容为 JSON 格式的请求列表摘要（含 method、path、status、timestamp）

#### Scenario: 无请求数据时不注入
- **WHEN** 用户发送聊天消息时没有已捕获的请求数据
- **THEN** 系统不注入额外的请求数据上下文

#### Scenario: 上下文数据截断
- **WHEN** 捕获的请求数据超过 5000 字符（估算 token 限制）
- **THEN** 系统仅注入最近捕获的请求数据，确保上下文不超出模型的 token 窗口

### Requirement: Agent 工具调用 — 获取最新请求

系统 SHALL 提供 `get_captured_requests` Function Calling 工具，允许 AI 主动获取最新的请求数据。

#### Scenario: AI 调用工具获取请求
- **WHEN** AI 在回复过程中调用 `get_captured_requests` 函数
- **THEN** 系统向 Background Service Worker 查询当前请求缓冲区数据
- **AND** 系统将查询结果（请求列表）作为 tool 调用的返回值发送回 LLM，LLM 基于新数据生成最终回复

#### Scenario: 工具超时处理
- **WHEN** 工具调用 10 秒内未收到 Background 响应
- **THEN** 系统返回工具调用失败信息给 LLM，LLM 应告知用户暂时无法获取请求数据

### Requirement: 当前页面 URL 上下文

系统 SHALL 将当前标签页的 URL 作为额外上下文提供给 AI。

#### Scenario: 包含页面 URL
- **WHEN** 系统构建聊天请求的上下文消息
- **THEN** 系统在请求数据上下文或系统消息中包含当前页面的 URL，使 AI 了解用户正在浏览哪个页面
