## Requirements

### Requirement: Agent can execute HTTP requests via page injection
The system SHALL provide an `execute_request` tool that injects a script into the active tab's page context to execute `fetch()` with Agent-provided parameters, returning the full response to the Agent. 工具分发 MUST 通过 Skill 声明驱动：遍历激活 Skill 的工具列表查找匹配名称，找到后调用对应 `handler`；未找到则回退到内置处理。

#### Scenario: Execute GET request via page injection
- **WHEN** the Agent calls `execute_request` with `{url: "https://example.com/api/data", method: "GET", headers: {"Authorization": "Bearer token"}}`
- **THEN** background.js injects a script into the active tab that executes `fetch(url, {method: "GET", headers: ...})` and returns `{status, statusText, headers, body}` to the Agent

#### Scenario: Execute POST request with body via page injection
- **WHEN** the Agent calls `execute_request` with `{url: "https://example.com/api/create", method: "POST", headers: {"Content-Type": "application/json"}, body: '{"name":"test"}'}`
- **THEN** background.js injects a script into the active tab that executes `fetch(url, {method: "POST", headers: ..., body: ...})` and returns `{status, statusText, headers, body}`

#### Scenario: Request timeout
- **WHEN** the HTTP request takes longer than 30 seconds
- **THEN** the tool returns `{error: "timeout", message: "Request exceeded 30 second timeout"}`

#### Scenario: Network error
- **WHEN** the HTTP request fails due to a network error (DNS failure, connection refused)
- **THEN** the tool returns `{error: "network_error", message: "<error details>"}`

### Requirement: Agent can query full request details by ID
The system SHALL provide a `get_captured_request_detail` tool that returns the complete information for a specific captured request including headers, body, URL, and method. 工具分发 MUST 通过 Skill 声明驱动。

#### Scenario: Query existing request
- **WHEN** the Agent calls `get_captured_request_detail` with `{requestId: "12345"}`
- **THEN** the tool returns `{url, method, path, status, headers: [{name, value}], requestBody, responseBody, timestamp}`

#### Scenario: Query non-existent request
- **WHEN** the Agent calls `get_captured_request_detail` with a requestId not in the buffer
- **THEN** the tool returns `{error: "not_found", message: "No request found with ID: <id>"}`

### Requirement: All tool parameters are provided by the Agent
The system SHALL NOT inject any default values for `execute_request` or `get_captured_request_detail` parameters. The Agent MUST provide all parameters explicitly.

#### Scenario: Agent provides all execute_request parameters
- **WHEN** the Agent calls `execute_request`
- **THEN** the Agent provides url, method, headers, and body (if applicable); no default values are applied by the system

#### Scenario: Agent provides requestId to query detail
- **WHEN** the Agent calls `get_captured_request_detail`
- **THEN** the Agent provides the requestId; the system does not assume any default request

### Requirement: 工具分发按 Skill 声明匹配
系统 SHALL 在处理工具调用时，遍历所有激活 Skill 的 `getTools()` 返回值，查找 `function.name` 与调用名称匹配的工具，找到后执行其 `handler`。匹配顺序为由后向前（后激活的 Skill 优先级更高），未匹配时回退到内置工具。对于 `askUser` 和 `requestAuth` 两种交互工具，系统 SHALL 通过 Promise 挂起 Agent Loop 等待用户交互完成后返回结果。

#### Scenario: 后激活 Skill 覆盖同名工具
- **WHEN** 两个激活 Skill 都提供了名为 "execute_request" 的工具
- **THEN** 系统使用后激活的 Skill 提供的 `handler`（后激活优先）

#### Scenario: Skill 提供工具但 handler 执行失败
- **WHEN** Skill 的工具 `handler(args)` 抛出异常
- **THEN** 系统返回 `{error: "tool_error", message: "<exception message>"}` 给 Agent

#### Scenario: 执行 askUser 工具时挂起等待用户选择
- **WHEN** Agent 调用 `askUser` 工具
- **THEN** 系统渲染询问卡片，通过 Promise 挂起 Agent Loop，在用户点击选项后 Promise resolve 并返回用户选择的选项文本

#### Scenario: 执行 requestAuth 工具时挂起等待用户确认
- **WHEN** Agent 调用 `requestAuth` 工具
- **THEN** 系统渲染授权卡片，通过 Promise 挂起 Agent Loop，在用户点击"同意"后 Promise resolve 返回 `{authorized: true}`

#### Scenario: requestAuth 被拒绝时终止会话
- **WHEN** 用户点击授权卡片中的"拒绝"按钮
- **THEN** 系统拒绝 Promise，触发 `abortController.abort()` 终止 Agent Loop

### Requirement: execute_request 工具在 chat.js 中实现
系统 SHALL 在 `TOOLS` 数组中注册 `execute_request` 工具并通过 `EXECUTE_REQUEST` 消息路由在页面上下文执行 HTTP 请求。

工具定义 SHALL 包含参数：
- `url`（string，必填）：请求 URL
- `method`（string，必填）：HTTP 方法（GET/POST/PUT/DELETE 等）
- `headers`（object，可选）：请求头键值对
- `body`（string，可选）：请求体，GET/HEAD 方法时忽略

#### Scenario: 工具注册
- **WHEN** AI 获取工具列表
- **THEN** 工具列表包含 `execute_request`，必填参数为 `url` 和 `method`，可选参数为 `headers` 和 `body`

#### Scenario: 成功执行 GET 请求
- **WHEN** AI 调用 `execute_request({ url: "https://example.com/api/data", method: "GET" })`
- **THEN** 系统注入 `execute-request-inject.js`，在页面上下文执行 `fetch()`，返回 `{ status, statusText, headers, body: "<响应体前50000字符>" }`

#### Scenario: 请求超时
- **WHEN** 注入脚本中的 fetch 超过 30 秒未响应
- **THEN** 返回 `{ error: { type: "timeout", message: "请求超时: 超过30秒未响应" } }`

#### Scenario: 网络错误
- **WHEN** fetch 失败（DNS 解析失败、连接被拒等）
- **THEN** 返回 `{ error: { type: "network_error", message: "<错误详情>" } }`

#### Scenario: 缺少必要参数
- **WHEN** AI 调用 `execute_request` 但缺少 `url` 或 `method`
- **THEN** 返回 `{ error: "bad_request", message: "缺少必要参数 url/method" }`

### Requirement: execute_request 通过异步监听获取结果
`execute_request` 工具 SHALL 采用与 `click_element` 相同的异步监听模式：发送 `EXECUTE_REQUEST` 消息并接收 ACK 后，通过一次性 `chrome.runtime.onMessage` 监听器捕获 `EXECUTE_REQUEST_RESULT`。

#### Scenario: 异步结果等待
- **WHEN** `execute_request` handler 发送 EXECUTE_REQUEST 消息并收到 ACK
- **THEN** handler 注册一次性 onMessage 监听器等待 EXECUTE_REQUEST_RESULT，超时 35s 后 resolve 或 reject（考虑请求 30s + 注入开销）
