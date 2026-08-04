## ADDED Requirements

### Requirement: Get inline JavaScript code

The system SHALL allow extracting the text content of all inline `<script>` elements on the page, with configurable maximum length truncation.

#### Scenario: Extract all inline scripts
- **WHEN** AI invokes `get_page_js` with mode `inline` or `all`
- **THEN** the system returns an `inlineScripts` array where each entry contains `index`, `text` (the JS code), and `type`, plus `inlineCount` and `truncated`/`totalLength` metadata

#### Scenario: No inline scripts on page
- **WHEN** the page has no inline `<script>` elements
- **THEN** the system returns `inlineScripts: []` and `inlineCount: 0`

### Requirement: Get external JavaScript references

The system SHALL allow listing all external `<script src="...">` elements on the page with their URLs and attributes.

#### Scenario: List all external scripts
- **WHEN** AI invokes `get_page_js` with mode `external` or `all`
- **THEN** the system returns an `externalScripts` array where each entry contains `src`, `type`, `async`, and `defer`, plus `externalCount`

#### Scenario: External script content is not accessible
- **WHEN** the system encounters `<script src="https://example.com/app.js">`
- **THEN** the system includes only the `src` URL and attributes, does NOT attempt to fetch the file content

### Requirement: JS content truncation

The system SHALL truncate inline script content when it exceeds the configured maximum length.

#### Scenario: Inline scripts within max length
- **WHEN** total inline script length is within `maxLength` (default 50000)
- **THEN** the system returns all inline scripts with `truncated: false`

#### Scenario: Inline scripts exceed max length
- **WHEN** total inline script length exceeds `maxLength`
- **THEN** the system truncates the last included script, sets `truncated: true`, and records `totalLength`

### Requirement: JS tool parameter validation

The system SHALL validate the mode parameter of `get_page_js`.

#### Scenario: Default mode
- **WHEN** AI invokes `get_page_js` without specifying `mode`
- **THEN** the system defaults to `inline` mode

#### Scenario: Invalid mode parameter
- **WHEN** AI invokes `get_page_js` with mode `invalid`
- **THEN** the system defaults to `inline` mode

### Requirement: JS tool returns structured output

The system SHALL return JS extraction results in a consistent JSON structure.

#### Scenario: Successful extraction output format
- **WHEN** `get_page_js` completes successfully
- **THEN** the returned object contains exactly the fields: `url`, `title`, `mode`, `inlineScripts`, `externalScripts`, `inlineCount`, `externalCount`, `truncated`, `totalLength`
