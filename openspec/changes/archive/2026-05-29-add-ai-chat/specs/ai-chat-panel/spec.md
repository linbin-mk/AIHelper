## ADDED Requirements

### Requirement: Tab 切换 UI

系统 SHALL 在 Side Panel 顶部提供 Tab 栏，包含"请求监控"和"AI 聊天"两个 Tab。

#### Scenario: 默认显示请求监控 Tab
- **WHEN** 用户打开 Side Panel
- **THEN** 系统默认显示"请求监控" Tab，展示当前捕获的请求列表

#### Scenario: 切换到 AI 聊天 Tab
- **WHEN** 用户点击"AI 聊天" Tab
- **THEN** 系统切换到聊天界面，请求监控面板隐藏但后台持续捕获请求数据

#### Scenario: 切换回请求监控 Tab
- **WHEN** 用户在聊天界面点击"请求监控" Tab
- **THEN** 系统切换回请求监控界面，聊天界面隐藏但保持消息状态

### Requirement: 聊天消息输入与发送

系统 SHALL 提供文本输入框和发送按钮，支持用户输入消息并发送。

#### Scenario: 发送文本消息
- **WHEN** 用户在输入框中输入文本并点击发送按钮或按 Enter 键
- **THEN** 系统展示用户消息气泡，并将消息发送到模型配置指定的 API

#### Scenario: 发送空消息
- **WHEN** 用户输入框为空时点击发送
- **THEN** 系统忽略此操作，不发送消息

#### Scenario: 发送消息时显示加载状态
- **WHEN** 用户发送消息后等待 AI 回复
- **THEN** 系统在聊天区域底部显示加载指示器，发送按钮变为禁用状态

### Requirement: AI 回复展示（流式）

系统 SHALL 使用流式输出（SSE）展示 AI 回复，AI 回复逐字或逐 token 增量出现在聊天气泡中。

#### Scenario: 流式输出 AI 回复
- **WHEN** LLM API 返回流式响应（`stream: true`）
- **THEN** 系统创建空的 AI 消息气泡，通过 `ReadableStream` 逐块读取 SSE 数据
- **AND** 每个 `data:` 行的 JSON chunk 中提取 `choices[0].delta.content`，实时追加到气泡中
- **AND** 收到 `data: [DONE]` 后标记流结束，保存完整消息到聊天记录

#### Scenario: 流式输出期间自动滚动
- **WHEN** 流式输出过程中 AI 消息气泡内容持续增长
- **THEN** 聊天区域自动滚动到底部，保持最新内容可见

#### Scenario: 非流式降级
- **WHEN** 用户配置的模型服务不支持流式输出（返回非 200 或 content-type 非 text/event-stream）
- **THEN** 系统降级为普通非流式请求（`stream: false`），完整回复一次性展示

#### Scenario: API 调用失败提示
- **WHEN** 大模型 API 调用失败（网络错误、401/403 等）
- **THEN** 系统在聊天区域展示错误提示气泡，包含友好的错误信息

#### Scenario: 流式请求超时处理
- **WHEN** 流式请求超过 120 秒未收到任何数据块
- **THEN** 系统自动中止请求并展示超时提示，已收到的部分内容保留

### Requirement: 停止生成

系统 SHALL 在 AI 流式输出过程中提供停止生成按钮，用户可中断当前回复。

#### Scenario: 流式输出中停止
- **WHEN** AI 正在流式输出回复内容时，用户点击停止生成按钮
- **THEN** 系统调用 `AbortController.abort()` 中止 fetch 请求
- **AND** 已生成的部分内容保留在 AI 消息气泡中
- **AND** 输入框和发送按钮恢复可用

#### Scenario: 停止后端不显示发送按钮
- **WHEN** 无 AI 回复正在进行时
- **THEN** 不显示停止生成按钮，显示正常的发送按钮

### Requirement: 聊天区域自动滚动

系统 SHALL 在新消息到达时自动滚动聊天区域到底部。

#### Scenario: 新消息到达时自动滚动
- **WHEN** 新消息（用户消息或 AI 回复）追加到聊天区域
- **THEN** 聊天区域自动滚动到底部，确保最新消息可见

#### Scenario: 用户手动滚动后不强制滚动
- **WHEN** 用户手动向上滚动查看历史消息
- **THEN** 新消息到达时系统不强制滚动，允许用户停留在当前位置
