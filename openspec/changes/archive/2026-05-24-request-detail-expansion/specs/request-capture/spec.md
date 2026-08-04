## MODIFIED Requirements

### Requirement: Buffering captured requests
The system SHALL maintain an in-memory ring buffer in the service worker, keeping at most the 200 most recent requests. Each buffer entry SHALL include: method, url, path, status, timestamp, headers, requestBody (when captured), and responseBody (when captured).

#### Scenario: Buffer under capacity
- **WHEN** 50 requests have been captured with a cap of 200
- **THEN** all 50 requests remain in the buffer

#### Scenario: Buffer overflow
- **WHEN** 201 requests have been captured with a cap of 200
- **THEN** the oldest request is evicted, keeping only the 200 most recent

### Requirement: Push requests to side panel
The system SHALL push new request entries to the connected side panel via `chrome.runtime.sendMessage` when a request completes (with status code). The message SHALL include requestBody and responseBody when available.

#### Scenario: Push completed request with body to panel
- **WHEN** a request completes with status code, and body data has been captured by the content script
- **THEN** the service worker sends a message containing `{type: 'REQUEST_COMPLETED', data: {method, path, status, timestamp, requestBody, responseBody}}` to the side panel

#### Scenario: Panel not connected
- **WHEN** a request completes but the side panel is closed or not connected
- **THEN** the request is still buffered but no message is sent (no error thrown)

### Requirement: Query captured requests on panel open
The system SHALL respond to `QUERY_REQUESTS` messages from the side panel by returning the full buffered request list including headers and body data, so the panel can initialize its display on open.

#### Scenario: Panel requests initial data
- **WHEN** the side panel opens and sends `{type: 'QUERY_REQUESTS'}`
- **THEN** the service worker responds with `{type: 'REQUESTS_DATA', data: [...]}` containing all buffered requests with headers, requestBody, and responseBody fields

## ADDED Requirements

### Requirement: Service worker handles body data from content script
The system SHALL accept `REQUEST_BODY_DATA` messages from the content script, match them to buffered requests by URL path and method, and store the body data.

#### Scenario: Body data matched to existing request
- **WHEN** the service worker receives `{type: 'REQUEST_BODY_DATA', data: {path, method, requestBody, responseBody}}`
- **THEN** the matching buffer entry is updated with `requestBody` and `responseBody`, and the panel is notified via `REQUEST_COMPLETED` with the updated data

#### Scenario: Body data has no match
- **WHEN** the service worker receives body data that matches no buffered request
- **THEN** the body data is discarded silently
