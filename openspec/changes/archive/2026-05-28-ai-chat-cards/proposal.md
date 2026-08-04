## Why

当前 AI 对话中，Agent 无法与用户进行结构化交互——无法询问问题让用户选择答案，也无法在执行敏感操作前请求用户授权。当 Agent 需要用户决策或确认时（如：选择操作目标、确认是否执行危险操作），只能通过纯文本消息等待用户回复，用户体验差且容易出错。

## What Changes

- 新增**询问卡片**（Question Card）：AI 可在聊天流中插入问题卡片，支持预设选项点击和自由文本输入两种回答方式，用户回答后 Agent 收到结构化响应继续执行
- 新增**授权卡片**（Authorization Card）：AI 在执行敏感操作前弹出授权卡片，用户同意后继续执行，拒绝则终止当前会话
- Agent Loop 新增 `askUser` 工具：使 AI 能够主动调用并展示询问卡片
- Agent Loop 新增 `requestAuth` 工具：使 AI 能够主动调用并展示授权卡片
- 卡片样式与现有思考卡片、工具调用卡片风格一致，遵循 Catppuccin 主题系统

## Capabilities

### New Capabilities
- `ai-question-card`: AI 在聊天中向用户提问并获取结构化回答的交互卡片，包含问题文本、可选答案按钮，以及自由文本输入框（AI 可决定是否允许用户自行输入）
- `ai-auth-card`: AI 在执行敏感操作前的授权确认卡片，包含操作描述、风险提示，用户同意/拒绝两种操作

### Modified Capabilities
- `agent-execute-tool`: Agent 工具执行逻辑需扩展，支持 `askUser` 和 `requestAuth` 两种新工具类型，当遇到此类工具调用时暂停 Agent Loop 等待用户交互

## Impact

- `chrome-extension/src/panel/chat.js`: 新增卡片渲染逻辑、新增 `askUser`/`requestAuth` 工具定义、Agent Loop 暂停/恢复机制
- `chrome-extension/src/panel/panel.html`: 新增卡片 DOM 模板
- `chrome-extension/src/panel/panel.css`: 新增卡片样式
- `chrome-extension/src/panel/i18n.js`: 新增相关文案的多语言支持
