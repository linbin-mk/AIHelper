## ADDED Requirements

### Requirement: Agent can execute HTTP requests via page injection
The system SHALL provide an `execute_request` tool that injects a script into the active tab's page context to execute `fetch()` with Agent-provided parameters, returning the full response to the Agent.

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
The system SHALL provide a `get_captured_request_detail` tool that returns the complete information for a specific captured request including headers, body, URL, and method.

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
