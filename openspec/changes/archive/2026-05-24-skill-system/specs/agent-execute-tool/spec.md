## MODIFIED Requirements

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

## ADDED Requirements

### Requirement: 工具分发按 Skill 声明匹配
系统 SHALL 在处理工具调用时，遍历所有激活 Skill 的 `getTools()` 返回值，查找 `function.name` 与调用名称匹配的工具，找到后执行其 `handler`。匹配顺序为由后向前（后激活的 Skill 优先级更高），未匹配时回退到内置工具。

#### Scenario: 后激活 Skill 覆盖同名工具
- **WHEN** 两个激活 Skill 都提供了名为 "execute_request" 的工具
- **THEN** 系统使用后激活的 Skill 提供的 `handler`（后激活优先）

#### Scenario: Skill 提供工具但 handler 执行失败
- **WHEN** Skill 的工具 `handler(args)` 抛出异常
- **THEN** 系统返回 `{error: "tool_error", message: "<exception message>"}` 给 Agent
