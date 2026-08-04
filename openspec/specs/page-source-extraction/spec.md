## ADDED Requirements

### Requirement: Get full page HTML source

The system SHALL allow extracting the serialized HTML of the entire page (default) or a specific element identified by a CSS selector, with configurable maximum length truncation.

#### Scenario: Extract full page HTML
- **WHEN** AI invokes `get_page_source` with no parameters (or default `selector: "body"`)
- **THEN** the system returns an object with `url`, `title`, `selector`, `html` (the `outerHTML` of the matched element), `truncated`, and `totalLength`

#### Scenario: Extract HTML of a specific element
- **WHEN** AI invokes `get_page_source` with `selector: "#main-content"`
- **THEN** the system returns the `outerHTML` of the element matching `#main-content`

#### Scenario: Selector matches no element
- **WHEN** AI invokes `get_page_source` with a selector `.non-existent`
- **THEN** the system returns an object with `selector` and `error: "NO_ELEMENT_FOUND"`

#### Scenario: Selector matches multiple elements
- **WHEN** AI invokes `get_page_source` with a selector `div.card`
- **THEN** the system uses only the first matching element and returns its `outerHTML`

### Requirement: HTML source truncation

The system SHALL truncate the output HTML when it exceeds the configured maximum length, returning truncation metadata.

#### Scenario: HTML within max length
- **WHEN** the serialized HTML length is within `maxLength` (default 50000 characters)
- **THEN** the system returns the complete HTML with `truncated: false` and `totalLength` equal to the HTML length

#### Scenario: HTML exceeds max length
- **WHEN** the serialized HTML length exceeds `maxLength`
- **THEN** the system returns the first `maxLength` characters with `truncated: true` and `totalLength` set to the full length

### Requirement: Source tool parameter validation

The system SHALL validate the parameters of `get_page_source` and return errors for invalid inputs.

#### Scenario: Invalid maxLength parameter
- **WHEN** AI invokes `get_page_source` with `maxLength: -1`
- **THEN** the system treats it as default `maxLength` (50000), clamping invalid values to valid range

### Requirement: Source tool returns structured output

The system SHALL return source extraction results in a consistent JSON structure.

#### Scenario: Successful extraction output format
- **WHEN** `get_page_source` completes successfully
- **THEN** the returned object contains exactly the fields: `url`, `title`, `selector`, `html`, `truncated`, `totalLength`, with the optional `error` field present only on failure
