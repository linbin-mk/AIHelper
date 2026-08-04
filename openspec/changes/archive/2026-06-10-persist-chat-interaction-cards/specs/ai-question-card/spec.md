## MODIFIED Requirements

### Requirement: AI 可以调用 askUser 工具向用户提问
系统 SHALL 提供一个 `askUser` 工具，AI 模型可通过 function calling 调用此工具，在前端聊天面板中渲染一张询问卡片。卡片支持多种模式：单选（仅 `options`）、多选（`options` + `multiSelect: true`）、纯自由输入（仅 `allowFreeInput: true`）、混合模式（`options` + `allowFreeInput: true`）。

系统 SHALL 在调用 `createQuestionCard` 之前将交互状态存入 `window._pendingInteraction`，以便在 DOM 需要重建时恢复卡片并重新绑定 Promise。

#### Scenario: AI 调用 askUser 展示选择题
- **WHEN** AI 调用 `askUser` 工具，参数为 `{question: "要使用哪个接口？", options: ["GET /api/users", "POST /api/users", "GET /api/orders"]}`
- **THEN** 聊天面板中插入一张询问卡片，显示问题文本"要使用哪个接口？"和三个可点击的答案按钮
- **AND** `window._pendingInteraction` 包含 `type: 'ask_user'`、`toolCallId`、`args`、`resolve`、`reject`

#### Scenario: 用户点击选项后 Agent 恢复执行
- **WHEN** 用户在询问卡片中点击某个选项按钮
- **THEN** 卡片进入完成状态（高亮选中的选项，其余变灰），Agent Loop 恢复执行，`executeToolCall` 返回用户选择的选项文本（如 `"GET /api/users"`）
- **AND** `window._pendingInteraction` 被清除为 `null`

#### Scenario: AI 调用 askUser 展示多选卡片
- **WHEN** AI 调用 `askUser` 工具，参数为 `{question: "选择需要导出的数据", options: ["用户数据", "订单数据", "日志数据", "配置数据"], multiSelect: true}`
- **THEN** 聊天面板中插入一张询问卡片，显示问题文本"选择需要导出的数据"、四个复选框选项、一个"确认选择"按钮
- **AND** `window._pendingInteraction` 包含交互状态

#### Scenario: 用户在多选卡片中勾选并确认
- **WHEN** 用户在询问卡片中勾选"用户数据"和"订单数据"后点击"确认选择"按钮
- **THEN** 卡片进入完成状态（所有复选框和确认按钮变灰），Agent Loop 恢复执行，`executeToolCall` 返回 `["用户数据", "订单数据"]`
- **AND** `window._pendingInteraction` 被清除

#### Scenario: AI 调用 askUser 展示自由输入框
- **WHEN** AI 调用 `askUser` 工具，参数为 `{question: "请输入你的需求描述", allowFreeInput: true, placeholder: "请在此描述..."}`
- **THEN** 聊天面板中插入一张询问卡片，显示问题文本"请输入你的需求描述"、一个文本输入框（placeholder 为"请在此描述..."）和一个提交按钮
- **AND** `window._pendingInteraction` 包含交互状态

#### Scenario: 用户提交自由文本后 Agent 恢复执行
- **WHEN** 用户在自由输入框中输入文字并点击提交按钮（或按 Enter 键）
- **THEN** 卡片进入完成状态，输入框和提交按钮变灰不可编辑，Agent Loop 恢复执行，`executeToolCall` 返回用户输入的文本内容
- **AND** `window._pendingInteraction` 被清除

#### Scenario: 混合模式：同时展示选项和自由输入
- **WHEN** AI 调用 `askUser` 工具，参数为 `{question: "选择操作类型", options: ["新增", "修改", "删除"], allowFreeInput: true, placeholder: "或输入自定义操作..."}`
- **THEN** 聊天面板中插入一张询问卡片，显示问题文本、三个答案按钮、一个文本输入框（含提交按钮），用户可点击选项或输入自定义文本后提交

#### Scenario: 询问卡片展示时停止按钮仍然可用
- **WHEN** 询问卡片正在等待用户回答，且用户点击聊天面板的"停止"按钮
- **THEN** Agent Loop 终止，卡片保留在聊天中但所有交互元素变灰不可操作
- **AND** `window._pendingInteraction` 被清除

#### Scenario: 从 _pendingInteraction 恢复询问卡片
- **WHEN** `renderChatMessages` 检测到消息中包含未完成的 `ask_user` 工具调用
- **AND** `_pendingInteraction` 存在且匹配此工具调用
- **THEN** 调用 `createQuestionCard` 并传入 `args` 中的 `question`、`options`、`allowFreeInput`、`placeholder`、`multiSelect`
- **AND** 调用 `handleQuestionCard` 绑定交互回调到 `_pendingInteraction.resolve` / `_pendingInteraction.reject`
- **AND** 用户与恢复后的卡片交互行为与原始卡片完全相同

### Requirement: 询问卡片应符合 Catppuccin 主题风格
询问卡片 SHALL 在视觉风格上与现有的思考卡片、工具调用卡片保持一致，使用 Catppuccin 配色变量，并支持深色/浅色主题自动切换。

#### Scenario: 深色主题下渲染询问卡片
- **WHEN** 当前主题为深色模式
- **THEN** 询问卡片使用深色背景 (`ctp-base`)、浅色文字 (`ctp-text`)，按钮使用 `ctp-surface0` 背景和 `ctp-blue` 边框

#### Scenario: 浅色主题下渲染询问卡片
- **WHEN** 当前主题为浅色模式
- **THEN** 询问卡片使用浅色背景 (`ctp-base`)、深色文字 (`ctp-text`)，按钮使用 `ctp-surface0` 背景和 `ctp-blue` 边框

### Requirement: askUser 工具定义需发送给 AI 模型
系统 SHALL 在 TOOLS 数组中包含 `askUser` 的工具定义。工具参数包含 `question`（必填，string）、`options`（选填，string[]）、`multiSelect`（选填，boolean）、`allowFreeInput`（选填，boolean）、`placeholder`（选填，string）。AI 在调用时至少需提供 `options` 或 `allowFreeInput` 之一。

#### Scenario: AI 在系统提示中找到 askUser 工具
- **WHEN** 构建 `/v1/chat/completions` 请求时
- **THEN** 请求的 `tools` 数组包含 `askUser` 工具定义，其 `parameters` 包含 `question`（type: string, required）、`options`（type: array of strings）、`multiSelect`（type: boolean）、`allowFreeInput`（type: boolean）、`placeholder`（type: string）
