## MODIFIED Requirements

### Requirement: Query captured requests on panel open
The system SHALL respond to `QUERY_REQUESTS` messages from the side panel by returning the full buffered request list including headers and body data, so the panel can initialize its display on open. The system SHALL also respond to `QUERY_REQUEST_DETAIL` messages requesting full details for a single request by its requestId.

#### Scenario: Panel requests initial data
- **WHEN** the side panel opens and sends `{type: 'QUERY_REQUESTS'}`
- **THEN** the service worker responds with `{type: 'REQUESTS_DATA', data: [...]}` containing all buffered requests with headers, requestBody, and responseBody fields

#### Scenario: Agent queries single request detail
- **WHEN** the side panel or Agent sends `{type: 'QUERY_REQUEST_DETAIL', requestId: '<id>'}`
- **THEN** the service worker responds with `{type: 'REQUEST_DETAIL', data: {url, method, path, status, headers, requestBody, responseBody, timestamp}}` for the matching request

#### Scenario: Request detail query with no match
- **WHEN** the side panel sends `{type: 'QUERY_REQUEST_DETAIL', requestId: '<invalid-id>'}`
- **THEN** the service worker responds with `{type: 'REQUEST_DETAIL_ERROR', error: 'not_found', message: 'No request found with ID: <invalid-id>'}`
