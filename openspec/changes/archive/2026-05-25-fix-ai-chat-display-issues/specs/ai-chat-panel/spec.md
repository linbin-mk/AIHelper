# ai-chat-panel

## ADDED Requirements

### Requirement: Thinking card persists and is collapsible after thinking completes
When AI finishes reasoning (regardless of whether tool calls follow), the thinking card SHALL remain visible in the DOM. The card SHALL be in collapsed state once thinking is complete, with a clickable toggle to expand and view the full thinking content.

#### Scenario: No tool calls — thinking card stays collapsed
- **WHEN** AI streams reasoning_content followed by content (no tool_calls)
- **THEN** the thinking card SHALL remain in the DOM
- **AND** the thinking card SHALL be in collapsed state
- **AND** clicking the toggle SHALL expand the card to show full thinking content

#### Scenario: With tool calls — thinking card stays collapsed
- **WHEN** AI streams reasoning_content followed by tool_calls
- **THEN** the thinking card SHALL be collapsed (showing only header "思考过程")
- **AND** during tool execution, the thinking card SHALL remain collapsed
- **AND** clicking the toggle SHALL expand the card to show full thinking content at any time

### Requirement: Tool call card with executing state and auto-collapse
When the AI invokes a tool, the tool name, arguments, and result SHALL be displayed in a single collapsible card with a lifecycle: executing (expanded, dynamic) → completed (expanded) → collapsed (auto).

#### Scenario: Tool executing — card shows live "in progress" state
- **WHEN** AI starts executing a tool
- **THEN** a collapsible card SHALL appear
- **AND** the card SHALL be in expanded state
- **AND** the header SHALL show "⚡ 调用 {name} ... 进行中"
- **AND** the card body SHALL show tool arguments (formatted JSON)

#### Scenario: Tool completed — card populated with result
- **WHEN** tool returns a result
- **THEN** the card SHALL show the result content in the body
- **AND** the card SHALL remain in expanded state
- **AND** the header SHALL update to "🔧 调用 {name}"

#### Scenario: Next tool starts — previous tool card auto-collapses
- **WHEN** AI starts calling a new tool (next in sequence)
- **THEN** the previous tool's card SHALL auto-collapse
- **AND** clicking the collapsed header SHALL expand it again

#### Scenario: Multiple tools in one round
- **WHEN** AI calls multiple tools in a single response
- **THEN** each tool call SHALL have its own collapsible card
- **AND** each card SHALL contain both the tool call and the corresponding result

### Requirement: Chat history restores thinking cards and tool call cards
When the plugin is closed and reopened, `renderChatMessages` SHALL reconstruct thinking cards and tool call cards from stored message data, preserving the visual structure seen during the live conversation.

#### Scenario: Restore thinking card from reasoning_content
- **WHEN** a stored assistant message has `reasoning_content` field
- **THEN** `renderChatMessages` SHALL create a thinking card element showing the reasoning content
- **AND** the card SHALL be in collapsed state

#### Scenario: Restore thinking card even when tool_calls are present
- **WHEN** a stored assistant message has both `reasoning_content` and `tool_calls`
- **THEN** `renderChatMessages` SHALL create both a thinking card AND tool call cards
- **AND** both thinking card and tool cards SHALL be in collapsed state

#### Scenario: Restore tool call card from tool_calls
- **WHEN** a stored assistant message has `tool_calls` array
- **THEN** `renderChatMessages` SHALL create a collapsible tool call card for each tool call in collapsed state
- **AND** the corresponding tool result message SHALL be associated and displayed within the same card

### Requirement: Markdown rendered correctly in restored messages
When restoring chat history, assistant message content SHALL be rendered as markdown (not plain text).

#### Scenario: Markdown rendered in restored assistant messages
- **WHEN** `renderChatMessages` processes an assistant message with markdown content (e.g., `**bold**`, code blocks)
- **THEN** the content SHALL be passed through `renderMarkdown()` before being set as innerHTML
- **AND** the result SHALL display correctly formatted markdown
