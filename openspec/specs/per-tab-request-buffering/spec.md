## Requirements

### Requirement: Capture requests from all tabs
The system SHALL use `chrome.webRequest` listeners to monitor HTTP requests from ALL tabs, not just the active tab. Each captured request SHALL be associated with its originating `tabId`.

#### Scenario: Capture request from active tab
- **WHEN** tab A is active and executes `fetch('https://example.com/api/user')`
- **THEN** the request is captured and stored in tab A's buffer with `tabId` set to tab A's id

#### Scenario: Capture request from non-active tab
- **WHEN** tab A is active, tab B is in the background, and tab B executes `fetch('https://example.com/api/data')`
- **THEN** the request is captured and stored in tab B's buffer (not discarded)

#### Scenario: Ignore requests without tab association
- **WHEN** a webRequest event fires with `tabId < 0` (e.g., extension service worker request)
- **THEN** the request is discarded and not stored in any buffer

### Requirement: Per-tab request buffering with 50-entry limit
The system SHALL maintain a separate request buffer per tab, structured as `Map<tabId, { buffer: Map<requestId, entry>, order: string[] }>`. Each per-tab buffer SHALL hold at most 50 entries, evicting the oldest entry (FIFO) when the limit is exceeded.

#### Scenario: Per-tab buffer under capacity
- **WHEN** tab A has 30 requests buffered with a cap of 50
- **THEN** all 30 requests remain in tab A's buffer

#### Scenario: Per-tab buffer exceeds capacity
- **WHEN** tab A has 50 requests buffered and a new request arrives
- **THEN** the oldest request is evicted and the new request is appended, keeping exactly 50 entries

#### Scenario: Different tabs have independent buffers
- **WHEN** tab A has 40 requests and tab B has 10 requests
- **THEN** both buffers are independent; tab A's buffer is not affected by tab B's buffer size

#### Scenario: Buffer isolation between tabs
- **WHEN** tab A's buffer reaches 50 entries and a new request arrives for tab B (which has 5 entries)
- **THEN** tab A evicts its oldest entry while tab B simply appends its new entry

### Requirement: Tab switch preserves request history
The system SHALL preserve all buffered requests when the user switches active tabs. Switching tabs SHALL only change which buffer the panel displays, without clearing any data.

#### Scenario: Switch to a tab with existing requests
- **WHEN** user switches from tab A to tab B, and tab B already has 15 buffered requests
- **THEN** the panel displays tab B's 15 historical requests immediately

#### Scenario: Requests continue capturing on non-displayed tabs
- **WHEN** the panel is displaying tab A's requests, and tab B (in background) issues new requests
- **THEN** tab B's requests are still captured into tab B's buffer, and will be visible when user switches to tab B

#### Scenario: Switch back to previous tab preserves data
- **WHEN** user switches from tab A to tab B and back to tab A
- **THEN** tab A's previously captured requests are still displayed, with no data loss

### Requirement: Tab close cleanup
The system SHALL listen for `chrome.tabs.onRemoved` and SHALL delete the corresponding per-tab buffer to free memory.

#### Scenario: Tab closed releases buffer
- **WHEN** tab A is closed
- **THEN** tab A's buffer is removed from `tabRequestBuffers` immediately

#### Scenario: Panel displaying closed tab's data resets
- **WHEN** tab A is closed while the panel is displaying tab A's requests
- **THEN** the panel clears its request list display

### Requirement: Panel data source switching
The panel SHALL maintain a `currentMonitoringTabId` and SHALL filter visible request rows by that tabId. When `TAB_REQUESTS_SWITCH` is received, the panel SHALL update `currentMonitoringTabId` and re-filter the display without destroying existing DOM rows.

#### Scenario: Panel filters requests by monitoring tab
- **WHEN** panel receives a `REQUEST_CAPTURED` message with `tabId: 123` but `currentMonitoringTabId` is 456
- **THEN** the request row is created in DOM but hidden (display: none)

#### Scenario: Panel switches tab and shows relevant requests
- **WHEN** panel receives `TAB_REQUESTS_SWITCH { tabId: 456 }`
- **THEN** all rows with `data-tab-id="456"` become visible and all other rows are hidden

#### Scenario: Panel queries requests on open
- **WHEN** panel opens and sends `QUERY_REQUESTS`
- **THEN** background responds with requests for the currently active tab only

### Requirement: Message protocol carries tabId
All request-related messages between background and panel SHALL include `tabId` to identify which tab the request belongs to.

#### Scenario: REQUEST_CAPTURED message includes tabId
- **WHEN** background sends `REQUEST_CAPTURED` to panel
- **THEN** the message payload includes `{ tabId, method, url, path, requestId }`

#### Scenario: REQUEST_COMPLETED message includes tabId
- **WHEN** background sends `REQUEST_COMPLETED` to panel
- **THEN** the message payload includes `{ tabId, method, path, status, timestamp, requestBody, responseBody }`

#### Scenario: TAB_REQUESTS_SWITCH replaces REQUESTS_CLEARED
- **WHEN** user switches active tabs in Chrome
- **THEN** background sends `TAB_REQUESTS_SWITCH { tabId }` to panel instead of `REQUESTS_CLEARED`
