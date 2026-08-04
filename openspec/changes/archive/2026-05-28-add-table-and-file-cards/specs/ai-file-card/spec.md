## ADDED Requirements

### Requirement: AI 可以调用 provideFile 工具提供文件下载
系统 SHALL 提供一个 `provideFile` 工具，AI 模型可通过 function calling 调用此工具，在前端聊天面板中渲染一张文件下载卡片。卡片显示文件信息并提供下载按钮，用户点击后通过浏览器原生机制下载文件。

#### Scenario: AI 调用 provideFile 提供文本文件下载
- **WHEN** AI 调用 `provideFile` 工具，参数为 `{fileName: "config.json", content: "{\"port\": 8080, \"debug\": true}", mimeType: "application/json"}`
- **THEN** 聊天面板中插入一张文件卡片，显示文件名"config.json"、MIME 类型"application/json"、内容预览（前 200 字符），以及一个"⬇ 下载"按钮

#### Scenario: 用户点击下载按钮触发浏览器下载
- **WHEN** 用户在文件卡片中点击"⬇ 下载"按钮
- **THEN** 浏览器触发文件下载，保存为 `config.json`（MIME 类型 `application/json`），`executeToolCall` 返回 `{downloaded: true}`，Agent 继续执行

#### Scenario: AI 未提供 mimeType 时默认 text/plain
- **WHEN** AI 调用 `provideFile` 工具，参数为 `{fileName: "README.md", content: "# Project\n\nDescription here"}`（未提供 `mimeType`）
- **THEN** 文件下载时使用默认 MIME 类型 `text/plain`

#### Scenario: 文件卡片显示内容预览
- **WHEN** AI 调用 `provideFile` 工具，`content` 长度超过 200 字符
- **THEN** 文件卡片中显示前 200 字符的预览，末尾追加"..."省略符，预览使用 `<pre>` 标签保留原始格式

#### Scenario: AI 调用 provideFile 后 Agent 自动继续
- **WHEN** AI 调用 `provideFile` 且卡片已渲染
- **THEN** `executeToolCall` 立即返回 `{displayed: true, fileName: "<文件名>"}`，Agent 循环不阻塞，等待用户下载是可选的（不要求用户确认）

#### Scenario: 文件卡片内容文本预览防 XSS
- **WHEN** AI 调用 `provideFile` 且 `content` 中包含 HTML 标签
- **THEN** 内容预览区域使用 `textContent` 渲染，不执行任何脚本

### Requirement: 文件卡片应符合 Catppuccin 主题风格
文件卡片 SHALL 在视觉风格上与现有的询问卡片、授权卡片保持一致，使用 Catppuccin 配色变量，并支持深色/浅色主题自动切换。

#### Scenario: 深色主题下渲染文件卡片
- **WHEN** 当前主题为深色模式
- **THEN** 文件卡片使用深色背景 (`var(--ctp-mantle)`)、文字颜色 (`var(--ctp-text)`)，左边框为绿色 (`3px solid var(--ctp-green)`)，内容预览区域使用 (`var(--ctp-crust)`) 背景，下载按钮使用绿色主题 (`var(--ctp-green-btn)`)

#### Scenario: 浅色主题下渲染文件卡片
- **WHEN** 当前主题为浅色模式
- **THEN** 文件卡片使用浅色背景和对应 Catppuccin 浅色变量，文字对比度足够

### Requirement: provideFile 工具定义需发送给 AI 模型
系统 SHALL 在 TOOLS 数组中包含 `provideFile` 的工具定义。工具参数包含 `fileName`（必填，string）、`content`（必填，string）、`mimeType`（选填，string，默认 `text/plain`）。

#### Scenario: AI 在系统提示中找到 provideFile 工具
- **WHEN** 构建 `/v1/chat/completions` 请求时
- **THEN** 请求的 `tools` 数组包含 `provideFile` 工具定义，其 `parameters` 包含 `fileName`（type: string, required）、`content`（type: string, required）、`mimeType`（type: string）
