## ADDED Requirements

### Requirement: Replay button in detail panel
The system SHALL display a "再次发起" (resend) button at the bottom of the expanded detail panel.

#### Scenario: Replay button visible
- **WHEN** a request row is expanded
- **THEN** the detail panel shows a "再次发起" button below the body content

### Requirement: Resend request with same parameters
The system SHALL resend the captured request using the same method, URL, headers, and body as the original.

#### Scenario: Resend GET request
- **WHEN** user clicks "再次发起" on an expanded GET request
- **THEN** a new GET request is sent to the original URL with the original request headers

#### Scenario: Resend POST request with body
- **WHEN** user clicks "再次发起" on an expanded POST request that has a JSON body
- **THEN** a new POST request is sent with the original headers and JSON body

#### Scenario: Resend without original body
- **WHEN** user clicks "再次发起" on a request whose body was not captured
- **THEN** the request is sent without a body (or with empty body)

### Requirement: Resent request appears in request list
The system SHALL have the resent request automatically captured by the `webRequest` listener and appended to the request list.

#### Scenario: Resent request captured
- **WHEN** a request is resent via "再次发起"
- **THEN** the new request appears in the request list with its method, path, and status

#### Scenario: Expand resent request to see new details
- **WHEN** user clicks on the newly captured resent request in the list
- **THEN** the detail panel expands showing its headers and body (from the new capture)

### Requirement: Resend via content script in page context
The system SHALL resend requests by sending the request parameters (method, URL, headers, body) to the content script via `chrome.tabs.sendMessage`, which executes `fetch` in the page context (no CORS restrictions).

#### Scenario: Panel sends resend message to content script
- **WHEN** user clicks "再次发起"
- **THEN** the panel sends a `REPLAY_REQUEST` message with `{method, url, headers, body}` to the content script, and the content script executes fetch in the page context

#### Scenario: Content script executes fetch
- **WHEN** content script receives `REPLAY_REQUEST` message
- **THEN** it calls `fetch(url, {method, headers, body})` with the provided parameters, and the request is automatically captured by the service worker's webRequest listener

### Requirement: Resend visual feedback
The system SHALL provide visual feedback when resending a request.

#### Scenario: Button shows loading state
- **WHEN** user clicks "再次发起"
- **THEN** the button text changes to "发送中..." and the button is disabled until the request completes or fails

#### Scenario: Resend success feedback
- **WHEN** the resent request completes successfully
- **THEN** the button returns to its normal state and the new request row is scrolled into view

#### Scenario: Resend failure feedback
- **WHEN** the resent request fails (network error)
- **THEN** the button returns to its normal state and an error message is briefly displayed
