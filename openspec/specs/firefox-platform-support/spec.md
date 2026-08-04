## ADDED Requirements

### Requirement: Firefox Manifest Configuration

The extension SHALL provide a Firefox-compatible `manifest.json` that uses `background.scripts` for Event Pages, `sidebar_action` for the UI entry point, and includes `browser_specific_settings` with a Firefox extension ID.

#### Scenario: Firefox manifest is valid

- **WHEN** the `firefox-extension/manifest.json` is loaded in Firefox
- **THEN** Firefox SHALL parse the manifest without errors and the extension SHALL be installable

#### Scenario: Background runs as Event Page

- **WHEN** the extension is active in Firefox
- **THEN** the background script SHALL run as an Event Page (loaded on demand, suspended when idle)

#### Scenario: UI opens via sidebar

- **WHEN** user clicks the extension toolbar icon in Firefox
- **THEN** the sidebar panel SHALL open alongside the page content

### Requirement: Firefox Request Header Management

The extension SHALL manage per-tab request headers in Firefox using `webRequest.onBeforeSendHeaders` blocking mode instead of `declarativeNetRequest` dynamic rules.

#### Scenario: Add request headers for a specific tab

- **WHEN** user adds request headers for the current tab in Firefox
- **THEN** subsequent HTTP requests from that tab SHALL include the added headers

#### Scenario: Remove request headers for a specific tab

- **WHEN** user removes request headers for a tab in Firefox
- **THEN** subsequent HTTP requests from that tab SHALL NOT include the removed headers

#### Scenario: Headers are tab-scoped

- **WHEN** headers are configured for tab A in Firefox
- **THEN** HTTP requests from tab B SHALL NOT be affected by tab A's headers

### Requirement: Firefox Sidebar UI

The extension SHALL render the AI chat interface in a Firefox `sidebar_action` panel, adapting the layout from the Chrome Side Panel design.

#### Scenario: Sidebar displays chat interface

- **WHEN** user opens the extension sidebar in Firefox
- **THEN** the AI chat panel, session sidebar, and toolbar SHALL be rendered within the sidebar panel

#### Scenario: Sidebar adapts to available width

- **WHEN** the sidebar panel opens in Firefox
- **THEN** the UI SHALL fill the available sidebar width without horizontal scrolling

#### Scenario: Chat state persists across sidebar open/close

- **WHEN** user closes and reopens the extension sidebar in Firefox
- **THEN** the active chat session and conversation history SHALL be restored from storage

### Requirement: Firefox Content Script - MAIN World Injection

The extension SHALL inject `request-interceptor.js` into the MAIN world of web pages in Firefox to intercept `fetch` and `XMLHttpRequest` calls.

#### Scenario: Fetch interception in MAIN world

- **WHEN** a web page makes a `fetch` request in Firefox
- **THEN** the injected MAIN world script SHALL capture the request URL, method, and body

#### Scenario: XHR interception in MAIN world

- **WHEN** a web page makes an `XMLHttpRequest` in Firefox
- **THEN** the injected MAIN world script SHALL capture the request details

#### Scenario: MAIN world script does not have extension API access

- **WHEN** the MAIN world content script runs in Firefox
- **THEN** it SHALL communicate with the extension via `window.postMessage` or custom DOM events, not via `chrome.runtime.sendMessage`

### Requirement: Firefox Browser Compatibility Layer

The extension SHALL include a minimal browser compatibility layer that normalizes `chrome.*` and `browser.*` API access across Chrome and Firefox.

#### Scenario: browser namespace fallback in Chrome

- **WHEN** the extension runs in Chrome
- **THEN** `globalThis.browser` SHALL be set to `chrome` at startup

#### Scenario: browser namespace native in Firefox

- **WHEN** the extension runs in Firefox
- **THEN** the native `browser` namespace SHALL be used without modification
