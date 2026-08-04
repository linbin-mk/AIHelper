## ADDED Requirements

### Requirement: AI 可以调用 requestAuth 工具请求用户授权
系统 SHALL 提供一个 `requestAuth` 工具，AI 模型在执行敏感操作（如修改数据、发送请求、删除资源等）前可通过 function calling 调用此工具，在前端聊天面板中渲染一张授权卡片，要求用户确认操作。

#### Scenario: AI 调用 requestAuth 请求授权
- **WHEN** AI 调用 `requestAuth` 工具，参数为 `{action: "删除用户数据", detail: "即将删除 3 条用户记录，此操作不可撤销", riskLevel: "high"}`
- **THEN** 聊天面板中插入一张授权卡片，显示操作名称"删除用户数据"、详细说明"即将删除 3 条用户记录，此操作不可撤销"、风险等级标识，以及"同意"和"拒绝"两个按钮

#### Scenario: 用户同意授权
- **WHEN** 用户在授权卡片中点击"同意"按钮
- **THEN** 卡片更新为"已授权"状态，Agent Loop 恢复执行，`executeToolCall` 返回 `{authorized: true}`

#### Scenario: 用户拒绝授权
- **WHEN** 用户在授权卡片中点击"拒绝"按钮
- **THEN** 触发 `currentAbortController.abort()`，Agent Loop 终止，卡片更新为"已拒绝"状态，`setSending(false)` 恢复发送按钮，并在聊天中显示会话已停止的提示

### Requirement: 授权卡片应符合 Catppuccin 主题风格
授权卡片 SHALL 在视觉风格上与现有的思考卡片、工具调用卡片保持一致，使用 Catppuccin 配色变量，并支持深色/浅色主题自动切换。

#### Scenario: 深色主题下渲染授权卡片
- **WHEN** 当前主题为深色模式
- **THEN** 授权卡片使用深色背景，包含醒目的警告图标，"同意"按钮使用 `ctp-green` 色调，"拒绝"按钮使用 `ctp-red` 色调

#### Scenario: 浅色主题下渲染授权卡片
- **WHEN** 当前主题为浅色模式
- **THEN** 授权卡片使用浅色背景，"同意"按钮使用 `ctp-green` 色调，"拒绝"按钮使用 `ctp-red` 色调

### Requirement: requestAuth 工具定义需发送给 AI 模型
系统 SHALL 在 TOOLS 数组中包含 `requestAuth` 的工具定义。工具参数包含 `action`（必填，字符串，操作名称）、`detail`（必填，字符串，操作详细说明）、`riskLevel`（选填，字符串枚举: low/medium/high）。

#### Scenario: AI 在系统提示中找到 requestAuth 工具
- **WHEN** 构建 `/v1/chat/completions` 请求时
- **THEN** 请求的 `tools` 数组包含 `requestAuth` 工具定义，其 `parameters` 包含 `action`、`detail`、`riskLevel` 字段

### Requirement: 授权拒绝后会话状态完整重置
当用户拒绝授权后，系统 SHALL 将发送状态完全重置，恢复输入框可用状态，不在聊天历史中保留未完成的中间消息。

#### Scenario: 拒绝授权后的界面状态
- **WHEN** 用户点击"拒绝"且 Agent Loop 终止后
- **THEN** 输入框恢复可编辑状态，停止按钮隐藏、发送按钮显示，授权卡片保留在聊天界面中作为操作记录
