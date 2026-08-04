## ADDED Requirements

### Requirement: Enter 键在 IME 组合输入时不触发送
当用户在聊天输入框中使用输入法编辑器（IME）进行组合输入（如中文拼音输入）时，系统 SHALL 在组合输入期间抑制 Enter 键的发送行为，仅在该轮组合输入结束后才允许 Enter 键发送消息。

#### Scenario: IME 组合输入期间按 Enter 不发送
- **WHEN** 输入法处于组合输入状态（`compositionstart` 已触发但 `compositionend` 尚未触发）
- **AND** 用户按下 Enter 键（未按 Shift）
- **THEN** 系统 SHALL 不发送消息
- **AND** 系统 SHALL 让 Enter 键事件由输入法自身处理（确认当前组合输入内容）

#### Scenario: IME 组合结束后按 Enter 正常发送
- **WHEN** 输入法组合输入已结束（`compositionend` 已触发）
- **AND** 输入框中有内容
- **AND** 用户按下 Enter 键（未按 Shift）
- **THEN** 系统 SHALL 正常发送消息
