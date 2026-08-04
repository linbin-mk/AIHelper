## MODIFIED Requirements

### Requirement: Task card shows "允许执行" button
The system SHALL render request_auth authorization card with action buttons "允许执行" and "取消".

#### Scenario: Render request_auth card for confirmation
- **WHEN** AI calls `request_auth` tool with action, detail, and riskLevel
- **THEN** the system renders an authorization card with the primary action button displaying "允许执行"

#### Scenario: Button disabled after authorization
- **WHEN** the user clicks "允许执行" and execution begins
- **THEN** the button changes to disabled state with text "已授权"

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

#### Scenario: request_auth supports POST, PUT, PATCH, DELETE methods
- **WHEN** the Agent calls request_auth for a modify or delete operation
- **THEN** the request_auth includes the correct HTTP method (PUT/PATCH/DELETE) in its detail, reflecting the operation type

## REMOVED Requirements

### Requirement: Agent collects info and outputs taskCard for create operation
**Reason**: taskCard JSON 格式已被 `request_auth` 工具调用取代，AI 不再输出 JSON 文本
**Migration**: AI 改用 `request_auth` 工具获取用户授权，`detail` 字段中展示操作摘要

### Requirement: Agent may not skip taskCard for single-item operations
**Reason**: 同上
**Migration**: AI 仍需在单条操作时调用 `request_auth`，不可跳过

### Requirement: Agent calls execute_request only after user clicks "允许执行"
**Reason**: taskCard 按钮交互被 request_auth 卡片取代
**Migration**: 用户在 `request_auth` 卡片上点击"允许执行"后 AI 才可调用 `execute_request`

### Requirement: taskCard supports POST, PUT, PATCH, DELETE methods
**Reason**: taskCard JSON 格式废弃
**Migration**: `request_auth` 的 `detail` 字段中描述 HTTP 方法
