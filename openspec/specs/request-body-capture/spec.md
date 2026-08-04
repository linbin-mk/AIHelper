## ADDED Requirements

### Requirement: Content script intercepts fetch calls
The system SHALL inject a content script into the active tab that intercepts `window.fetch` calls to capture request body and response body.

#### Scenario: Intercept JSON POST fetch
- **WHEN** the page executes `fetch('/api/data', {method: 'POST', body: JSON.stringify({key: 'value'})})`
- **THEN** the interceptor captures the request body `{"key":"value"}` and the response body

#### Scenario: Intercept GET fetch (no body)
- **WHEN** the page executes `fetch('/api/data')` (GET, no body)
- **THEN** the interceptor captures `null` for request body and the response body

#### Scenario: Non-JSON response
- **WHEN** fetch returns a response with `Content-Type: text/plain`
- **THEN** the interceptor captures the response body as plain text

### Requirement: Content script intercepts XMLHttpRequest calls
The system SHALL intercept `XMLHttpRequest` calls to capture request body and response body for backward compatibility.

#### Scenario: Intercept XHR POST
- **WHEN** the page sends an XHR POST with body
- **THEN** the interceptor captures the request body and response body

### Requirement: Body data sent to service worker
The system SHALL send captured body data from the content script to the service worker via `chrome.runtime.sendMessage`, keyed by URL and method for matching.

#### Scenario: Body data matched to buffered request
- **WHEN** content script captures body for a POST request to `/api/data`
- **THEN** service worker stores the request body and response body in the buffer entry with matching method and path

#### Scenario: Body data has no matching request in buffer
- **WHEN** content script sends body data but no matching request exists in the buffer
- **THEN** the body data is discarded silently

### Requirement: Response body size limit
The system SHALL enforce a 100KB size limit on captured response bodies.

#### Scenario: Response body under limit
- **WHEN** a response body is 50KB
- **THEN** the full body is captured and stored

#### Scenario: Response body exceeds limit
- **WHEN** a response body is 150KB
- **THEN** only the first 100KB is captured, and a `truncated: true` flag is set

### Requirement: Content script handles CSP restrictions gracefully
The system SHALL handle cases where content script injection fails due to page Content Security Policy.

#### Scenario: CSP blocks injection
- **WHEN** content script injection fails due to CSP restrictions
- **THEN** the detail panel's body sections display "无法捕获（受页面 CSP 限制）" placeholder text

### Requirement: Content script reuses existing headers from buffer
The system SHALL NOT re-capture request headers from the interceptor; headers are already captured by `webRequest.onBeforeSendHeaders` in the service worker.

#### Scenario: Headers already captured by webRequest
- **WHEN** the content script intercepts a fetch call
- **THEN** it only captures request body and response body, not headers
