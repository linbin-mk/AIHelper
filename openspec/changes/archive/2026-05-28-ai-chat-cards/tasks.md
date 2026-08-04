## 1. 工具定义与注册

- [x] 1.1 在 `chat.js` 的 TOOLS 数组中添加 `askUser` 工具定义，参数包含 `question`（必填 string）、`options`（选填 string[]）、`allowFreeInput`（选填 boolean）、`placeholder`（选填 string）
- [x] 1.2 在 `chat.js` 的 TOOLS 数组中添加 `requestAuth` 工具定义，参数包含 `action`（必填 string）、`detail`（必填 string）和 `riskLevel`（选填 string 枚举 low/medium/high）

## 2. 询问卡片（Question Card）实现

- [x] 2.1 在 `chat.js` 中实现 `createQuestionCard(question, options, allowFreeInput, placeholder)` 函数，生成询问卡片 DOM（包含问题文本、选项按钮列表，以及条件渲染的文本输入框+提交按钮），遵循 Catppuccin 主题样式
- [x] 2.2 在 `chat.js` 中实现 `handleQuestionCard(cardWrapper, options, allowFreeInput)` 函数，返回 Promise，通过事件委托监听选项点击和自由文本提交，resolve 用户选择的文本或输入的文本，同时将未选/未用交互元素变灰
- [x] 2.3 在 `panel.css` 中添加询问卡片样式（`.chat-bubble-question-card`、`.question-card-header`、`.question-card-options`、`.question-card-option-btn`、`.question-card-free-input`、`.question-card-submit-btn` 等），适配深色/浅色主题

## 3. 授权卡片（Authorization Card）实现

- [x] 3.1 在 `chat.js` 中实现 `createAuthCard(action, detail, riskLevel)` 函数，生成授权卡片 DOM（包含警告图标、操作名称、详细说明、风险等级标识、同意/拒绝按钮），遵循 Catppuccin 主题样式
- [x] 3.2 在 `chat.js` 中实现 `handleAuthCard(cardWrapper)` 函数，返回 Promise，同意时 resolve `{authorized: true}`，拒绝时 reject 并触发 `abortController.abort()`
- [x] 3.3 在 `panel.css` 中添加授权卡片样式（`.chat-bubble-auth-card`、`.auth-card-header`、`.auth-card-body`、`.auth-card-actions`、`.auth-btn-approve`、`.auth-btn-reject` 等），适配深色/浅色主题

## 4. Agent Loop 交互挂起机制

- [x] 4.1 在 `executeToolCall` 函数中添加对 `askUser` 工具的特殊处理：解析参数，调用 `createQuestionCard` + `handleQuestionCard`，将 Promise 的 resolve 值作为工具结果返回
- [x] 4.2 在 `executeToolCall` 函数中添加对 `requestAuth` 工具的特殊处理：解析参数，调用 `createAuthCard` + `handleAuthCard`，将 Promise 的 resolve 值作为工具结果返回
- [x] 4.3 处理 auth 拒绝场景：`handleAuthCard` reject 时捕获异常，调用 `showErrorBubble` 显示提示信息，调用 `setSending(false)` 恢复 UI 状态

## 5. 多语言文案

- [x] 5.1 在 `i18n.js` 中添加询问卡片相关文案（中文/英文）：`chat.questionCardTitle`、`chat.questionCardPlaceholder`、`chat.questionCardSubmit`、`chat.questionCardInputPlaceholder`
- [x] 5.2 在 `i18n.js` 中添加授权卡片相关文案（中文/英文）：`chat.authCardTitle`、`chat.authCardActionLabel`、`chat.authCardDetailLabel`、`chat.authCardApprove`、`chat.authCardReject`、`chat.authCardApproved`、`chat.authCardRejected`、`chat.authSessionStopped`、`chat.authRiskLow`、`chat.authRiskMedium`、`chat.authRiskHigh`

## 6. 验证与测试

- [x] 6.1 手动测试：发送请求触发 AI 调用 `askUser`，验证卡片渲染、选项点击、Agent 继续执行
- [x] 6.2 手动测试：发送请求触发 AI 调用 `requestAuth`，验证同意和拒绝两条路径的行为
- [x] 6.3 手动测试：深色/浅色主题切换，验证两张卡片的样式适配
- [x] 6.4 手动测试：卡片等待期间切换会话或停止按钮，验证清理逻辑
