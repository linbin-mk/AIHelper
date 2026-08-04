## ADDED Requirements

### Requirement: Get computed styles for a specific element

The system SHALL allow extracting all computed CSS styles for a DOM element identified by a CSS selector, returning only properties whose values differ from browser defaults.

#### Scenario: Extract computed styles for a visible element
- **WHEN** AI invokes `get_page_css` with mode `computed` and a valid CSS selector `.header-button`
- **THEN** the system returns an object with `selector`, `computedStyle` (an object of non-default CSS property-value pairs), and `elementInfo` containing `tagName` and `text` of the matched element

#### Scenario: Selector matches no element
- **WHEN** AI invokes `get_page_css` with mode `computed` and a selector `.non-existent`
- **THEN** the system returns an object with `selector` and `error: "NO_ELEMENT_FOUND"`

#### Scenario: Selector matches multiple elements
- **WHEN** AI invokes `get_page_css` with mode `computed` and a selector `li`
- **THEN** the system uses only the first matching element and returns its computed styles

### Requirement: Get page stylesheet content

The system SHALL allow extracting the CSS rules text from all `<style>` elements and accessible `<link rel="stylesheet">` elements on the page.

#### Scenario: Extract all stylesheets
- **WHEN** AI invokes `get_page_css` with mode `stylesheet` and no selector
- **THEN** the system returns a `stylesheets` array where each entry contains `type` (`inline` or `external`), `cssText` (the CSS rules text), and optional `href` for external stylesheets, plus `count` and `truncated` fields

#### Scenario: External stylesheet is cross-origin and inaccessible
- **WHEN** an external stylesheet's `cssRules` throws a SecurityError due to CORS
- **THEN** the system captures the exception, marks that entry as `accessible: false`, and includes `href` but leaves `cssText` as an empty string

#### Scenario: Stylesheet content exceeds max length
- **WHEN** the concatenated CSS text length exceeds the `maxLength` parameter (default 50000)
- **THEN** the system truncates the output, sets `truncated: true`, and records `totalLength`

### Requirement: CSS tool parameter validation

The system SHALL validate the parameters of `get_page_css` and return errors for invalid inputs.

#### Scenario: Invalid mode parameter
- **WHEN** AI invokes `get_page_css` with mode `invalid`
- **THEN** the system returns an error indicating `mode` must be `computed` or `stylesheet`

#### Scenario: Computed mode without selector
- **WHEN** AI invokes `get_page_css` with mode `computed` but no `selector` parameter
- **THEN** the system returns an error because `selector` is required for `computed` mode
