## ADDED Requirements

### Requirement: Request row click to expand
The system SHALL allow the user to click on a captured request row in the request list to toggle expansion of a detail panel below that row.

#### Scenario: Click expands a collapsed request
- **WHEN** user clicks on a collapsed request row in the request list
- **THEN** a detail panel expands below that row, and all other expanded rows collapse

#### Scenario: Click collapses an expanded request
- **WHEN** user clicks on an already expanded request row
- **THEN** the detail panel below that row collapses

#### Scenario: Only one row expanded at a time
- **WHEN** user clicks on a different request row while another row is expanded
- **THEN** the previously expanded row collapses automatically, and the new row expands

### Requirement: Detail panel shows request headers
The system SHALL display the request headers in a key-value table format within the expanded detail panel.

#### Scenario: Request has headers captured
- **WHEN** a request with captured headers is expanded
- **THEN** the detail panel displays a list of header name/value pairs

#### Scenario: No headers captured
- **WHEN** a request without captured headers is expanded
- **THEN** the detail panel displays "无请求头信息" placeholder text

### Requirement: Detail panel shows request body
The system SHALL display the captured request body in the detail panel, formatted as indented JSON when applicable.

#### Scenario: JSON request body
- **WHEN** a request with JSON request body is expanded
- **THEN** the body is displayed as syntax-highlighted, indented JSON text

#### Scenario: Non-JSON request body
- **WHEN** a request with a non-JSON request body is expanded
- **THEN** the body is displayed as plain text

#### Scenario: No request body
- **WHEN** a request without a request body (e.g., GET request) is expanded
- **THEN** the detail panel displays "无请求体" placeholder text

### Requirement: Detail panel shows response body
The system SHALL display the captured response body in the detail panel, formatted as indented JSON when applicable.

#### Scenario: JSON response body
- **WHEN** a request with JSON response body is expanded
- **THEN** the response body is displayed as syntax-highlighted, indented JSON text

#### Scenario: Response body exceeds size limit
- **WHEN** a response body exceeds 100KB
- **THEN** the body is truncated and "...（已截断）" is appended

#### Scenario: No response body captured
- **WHEN** a request whose response body was not captured is expanded
- **THEN** the detail panel displays "无响应体数据" placeholder text

### Requirement: Detail panel tab switching
The system SHALL provide tabs within the detail panel to switch between Request Headers, Request Body, and Response Body views.

#### Scenario: Switch to Request Headers tab
- **WHEN** user clicks the "请求头" tab in the detail panel
- **THEN** the request headers key-value list is displayed

#### Scenario: Switch to Request Body tab
- **WHEN** user clicks the "请求体" tab in the detail panel
- **THEN** the request body content is displayed

#### Scenario: Switch to Response Body tab
- **WHEN** user clicks the "响应体" tab in the detail panel
- **THEN** the response body content is displayed

### Requirement: Expanded row visual indicator
The system SHALL visually indicate which request row is currently expanded.

#### Scenario: Expanded row highlight
- **WHEN** a request row is expanded
- **THEN** that row is highlighted with a distinct background color (using theme variable)
