## ADDED Requirements

### Requirement: AI 可调用 get_page_context 工具
系统 SHALL 在 `TOOLS` 数组中注册 `get_page_context` 工具，AI 调用后通过 `GET_PAGE_CONTEXT` 消息路由获取当前页面上下文。

工具定义 SHALL 包含描述："获取当前浏览器页面的上下文信息，包括 URL、标题和可见的表单字段列表（input、select、textarea 等）"。

#### Scenario: 工具注册
- **WHEN** AI 获取工具列表
- **THEN** 工具列表包含 `get_page_context`，无必填参数

#### Scenario: 成功获取页面上下文
- **WHEN** AI 调用 `get_page_context` 且当前有活动标签页
- **THEN** 系统通过 `chrome.runtime.sendMessage({ type: 'GET_PAGE_CONTEXT' })` 注入 `page-context.js`，返回 `{ url, title, formFields: [...] }`

#### Scenario: 无活动标签页
- **WHEN** AI 调用 `get_page_context` 但无活动标签页
- **THEN** 返回错误 `{ error: "no_active_tab", message: "未找到活动标签页" }`

### Requirement: 工具通过 executeToolCall 分发
`get_page_context` 工具 SHALL 在 `executeToolCall()` 函数中通过 `if (name === 'get_page_context')` 分支处理。

#### Scenario: 工具调用路由
- **WHEN** AI 调用 `get_page_context`
- **THEN** `executeToolCall` 匹配到对应分支，通过 `sendMessage` 发送 `GET_PAGE_CONTEXT` 到 background.js，返回 Promise
