# chat-history

## ADDED Requirements

### Requirement: Message storage preserves visual structure information
When saving messages to `chrome.storage.local`, the system SHALL preserve enough information to reconstruct the visual structure (thinking cards, tool call cards) upon restoration. No new storage fields are needed — the existing `reasoning_content` and `tool_calls` fields are sufficient.

#### Scenario: Thinking card data preserved in storage
- **WHEN** an assistant message has reasoning_content
- **THEN** the stored message SHALL include the full `reasoning_content` string
- **AND** `renderChatMessages` SHALL infer thinking card presentation from the presence of `reasoning_content`

#### Scenario: Tool call card data preserved in storage
- **WHEN** an assistant message triggers tool calls
- **THEN** the stored message SHALL include the full `tool_calls` array
- **AND** the corresponding tool result messages SHALL include `tool_call_id` to enable association

### Requirement: restore path preserves storage format
`loadChatHistory` SHALL return messages in the same format they were saved, and `renderChatMessages` SHALL use the `reasoning_content` and `tool_calls` fields to reconstruct the visual structure.

#### Scenario: round-trip preservation
- **WHEN** messages are saved via `saveChatHistory` and loaded via `loadChatHistory`
- **THEN** all message fields (`role`, `content`, `reasoning_content`, `tool_calls`, `tool_call_id`) SHALL be preserved without data loss
