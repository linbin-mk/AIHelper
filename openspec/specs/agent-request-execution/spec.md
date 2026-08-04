## Requirements

### Requirement: Authorization card shows "允许执行" button
The system SHALL render request_auth authorization card with action buttons "允许执行" and "取消".

#### Scenario: Render request_auth card for confirmation
- **WHEN** AI calls `request_auth` tool with action, detail, and riskLevel
- **THEN** the system renders an authorization card with the primary action button displaying "允许执行"

#### Scenario: Button disabled after authorization
- **WHEN** the user clicks "允许执行" and execution begins
- **THEN** the button changes to disabled state with text "已授权"

### Requirement: Agent receives execution instruction on button click
The system SHALL inject a user message into the chat instructing the Agent to execute the task, then trigger the Agent loop.

#### Scenario: Button click triggers agent execution
- **WHEN** the user clicks "允许执行" on a task card
- **THEN** a user message with the full execution instruction is appended to chatMessages, and the Agent loop starts automatically

### Requirement: Agent queries captured request details
The Agent SHALL call the `get_captured_request_detail` tool to retrieve full request information including URL, method, headers, and body for a given request ID.

#### Scenario: Agent queries request detail
- **WHEN** the Agent calls `get_captured_request_detail` with a valid requestId
- **THEN** the tool returns the request's full details: url, method, headers (as key-value pairs), body, and status code

#### Scenario: Request ID not found
- **WHEN** the Agent calls `get_captured_request_detail` with an invalid or expired requestId
- **THEN** the tool returns an error message indicating the request was not found

### Requirement: Agent performs intelligent request execution loop
The Agent SHALL use the `execute_request` tool to send HTTP requests, analyze responses, and retry on failure with adjusted parameters up to 10 total attempts.

#### Scenario: Successful request on first attempt
- **WHEN** the Agent calls `execute_request` with valid parameters and the server returns a success status (2xx)
- **THEN** the Agent receives the response and generates a success report

#### Scenario: Request fails with 4xx error
- **WHEN** the Agent calls `execute_request` and the server returns a 4xx error
- **THEN** the Agent analyzes the error response, adjusts request headers or body, and retries

#### Scenario: Request fails with 5xx error
- **WHEN** the Agent calls `execute_request` and the server returns a 5xx error
- **THEN** the Agent waits briefly and retries with the same parameters

#### Scenario: Maximum retry limit reached
- **WHEN** the Agent has made 10 execute_request calls without success
- **THEN** the Agent stops retrying and outputs a failure report with all attempt details

### Requirement: Agent generates execution result report
The Agent SHALL output a structured Markdown report after execution completes (success or failure).

#### Scenario: Success report
- **WHEN** execution succeeds on any attempt
- **THEN** the Agent outputs a report containing: success status, request URL, method, final request headers used, response status code, response body summary, and number of attempts

#### Scenario: Failure report
- **WHEN** execution fails after 10 attempts
- **THEN** the Agent outputs a report containing: failure status, all attempt details (headers used, error received for each), and the reason for final failure

### Requirement: Two-step constraint for all data write operations
The system SHALL enforce a two-step constraint: Step 1 — the Agent MUST only collect information and call `request_auth` tool for user review, NEVER calling `execute_request` proactively; Step 2 — only after the user clicks "允许执行" on the auth card may the Agent call `execute_request` to send HTTP requests.

#### Scenario: Agent collects info and calls request_auth for create operation
- **WHEN** the user asks to create/modify/delete data (even a single record)
- **THEN** the Agent uses `get_captured_requests`/`get_captured_request_detail` to collect request info, calls `request_auth` tool, and does NOT call `execute_request`

#### Scenario: Agent may not skip request_auth for single-item operations
- **WHEN** the user asks to create/delete a single record
- **THEN** the Agent STILL calls `request_auth` for user review before executing

#### Scenario: Agent calls execute_request only after user clicks "允许执行"
- **WHEN** the user clicks "允许执行" on a request_auth card
- **THEN** the Agent may call `execute_request` to send the HTTP request

#### Scenario: request_auth describes HTTP method in detail
- **WHEN** the Agent calls request_auth for a modify or delete operation
- **THEN** the request_auth includes the correct HTTP method (PUT/PATCH/DELETE) in its detail, reflecting the operation type

### Requirement: No hardcoded default request headers
The system SHALL NOT include any hardcoded default request headers. All request headers MUST be decided by the Agent based on captured request information.

#### Scenario: Agent decides all headers
- **WHEN** the Agent prepares to call `execute_request`
- **THEN** the Agent determines all request headers from either captured request data or its own reasoning; the system does not inject any default headers
