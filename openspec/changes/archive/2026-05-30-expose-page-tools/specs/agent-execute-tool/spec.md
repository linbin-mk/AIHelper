## ADDED Requirements

### Requirement: execute_request 工具在 chat.js 中实现
系统 SHALL 在 `TOOLS` 数组中注册 `execute_request` 工具并通过 `EXECUTE_REQUEST` 消息路由在页面上下文执行 HTTP 请求。

工具定义 SHALL 包含参数：
- `url`（string，必填）：请求 URL
- `method`（string，必填）：HTTP 方法（GET/POST/PUT/DELETE 等）
- `headers`（object，可选）：请求头键值对
- `body`（string，可选）：请求体，GET/HEAD 方法时忽略

#### Scenario: 工具注册
- **WHEN** AI 获取工具列表
- **THEN** 工具列表包含 `execute_request`，必填参数为 `url` 和 `method`，可选参数为 `headers` 和 `body`

#### Scenario: 成功执行 GET 请求
- **WHEN** AI 调用 `execute_request({ url: "https://example.com/api/data", method: "GET" })`
- **THEN** 系统注入 `execute-request-inject.js`，在页面上下文执行 `fetch()`，返回 `{ status, statusText, headers, body: "<响应体前50000字符>" }`

#### Scenario: 请求超时
- **WHEN** 注入脚本中的 fetch 超过 30 秒未响应
- **THEN** 返回 `{ error: { type: "timeout", message: "请求超时: 超过30秒未响应" } }`

#### Scenario: 网络错误
- **WHEN** fetch 失败（DNS 解析失败、连接被拒等）
- **THEN** 返回 `{ error: { type: "network_error", message: "<错误详情>" } }`

#### Scenario: 缺少必要参数
- **WHEN** AI 调用 `execute_request` 但缺少 `url` 或 `method`
- **THEN** 返回 `{ error: "bad_request", message: "缺少必要参数 url/method" }`

### Requirement: execute_request 通过异步监听获取结果
`execute_request` 工具 SHALL 采用与 `click_element` 相同的异步监听模式：发送 `EXECUTE_REQUEST` 消息并接收 ACK 后，通过一次性 `chrome.runtime.onMessage` 监听器捕获 `EXECUTE_REQUEST_RESULT`。

#### Scenario: 异步结果等待
- **WHEN** `execute_request` handler 发送 EXECUTE_REQUEST 消息并收到 ACK
- **THEN** handler 注册一次性 onMessage 监听器等待 EXECUTE_REQUEST_RESULT，超时 35s 后 resolve 或 reject（考虑请求 30s + 注入开销）
