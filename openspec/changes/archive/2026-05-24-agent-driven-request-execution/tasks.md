## 1. background.js - 新增消息处理器和注入脚本

- [x] 1.1 新增 `QUERY_REQUEST_DETAIL` 消息处理：根据 requestId 查询 `tabRequestBuffers` 中单条请求的完整信息（url, method, path, status, headers, requestBody, responseBody, timestamp），返回 `REQUEST_DETAIL` 或 `REQUEST_DETAIL_ERROR`
- [x] 1.2 新增 `EXECUTE_REQUEST` 消息处理：接收 `{url, method, headers, body}`，通过 `chrome.scripting.executeScript` 向当前活跃 Tab 注入脚本，在页面上下文中执行 `fetch(url, {method, headers, body})`，设置 30 秒超时（AbortController），脚本执行完毕后通过 `chrome.runtime.sendMessage` 将结果 `{status, statusText, responseHeaders, body}` 回报给 Service Worker，再转发给调用方
- [x] 1.3 新增 `src/content/execute-request-inject.js`：单次请求执行的轻量注入脚本，接收 `EXECUTE_REQUEST_INTERNAL` 消息后在页面上下文中执行 fetch，通过 `EXECUTE_REQUEST_RESULT` 消息回报结果

## 2. chat.js - 新增 Agent 工具

- [x] 2.1 在 `TOOLS` 数组中新增 `get_captured_request_detail` 工具定义：参数 `requestId`（string, required），描述"查询指定请求ID的完整详情（URL、方法、请求头、请求体）"
- [x] 2.2 在 `TOOLS` 数组中新增 `execute_request` 工具定义：参数 `url`（string, required）、`method`（string, required）、`headers`（object, required）、`body`（string, optional），描述"向当前页面注入脚本执行HTTP请求（携带页面Cookie和认证状态），返回完整响应"
- [x] 2.3 在 `executeToolCall()` 中新增两个工具的实现分支：`get_captured_request_detail` 发送 `QUERY_REQUEST_DETAIL` 消息并返回结果；`execute_request` 发送 `EXECUTE_REQUEST` 消息并返回结果（页面注入执行）

## 3. chat.js - 修改按钮和执行逻辑

- [x] 3.1 修改 `renderTaskCard()` 中按钮文案：第394行 "执行" → "允许执行"，第400行 "已执行" → "已允许执行"
- [x] 3.2 修改 `handleTaskExecute()` 函数：不再直接发送 `BATCH_EXECUTE`，改为向 `chatMessages` 注入一条用户消息，内容为"请执行任务卡片，查询页面捕获的请求信息，智能配置请求头并发送请求。最多重试10次，若全部失败则输出失败报告。"，然后调用 `sendMessage()` 触发 Agent 循环
- [x] 3.3 在 `handleTaskExecute()` 中移除原有的防并发逻辑和 `BATCH_EXECUTE` 消息发送，保留任务状态更新（标记为"已允许执行"）

## 4. chat.js - 优化 Agent 系统提示词

- [x] 4.1 在 `buildRequestContext()` 的 requestContext 中补充 Agent 请求执行的指导：说明 Agent 应先调用 `get_captured_request_detail` 查询请求信息，再调用 `execute_request` 发送请求，失败后根据错误码和错误信息智能调整请求头（如修改 Content-Type、补充 Authorization、调整 body 格式等），最多重试 10 次
- [x] 4.2 在系统提示词中明确要求 Agent 执行完成后必须输出结构化 Markdown 报告，包含请求URL、方法、最终使用的请求头、响应状态码、响应体摘要、尝试次数、每次调整的原因

## 5. chat.js - 移除旧批量执行代码

- [x] 5.1 移除 `TOOLS` 数组中的 `batch_create_data` 工具定义
- [x] 5.2 移除 `executeToolCall()` 中 `batch_create_data` 的实现分支
- [x] 5.3 移除 `handleTaskExecute()` 中原有的 `headers` 默认值构造逻辑（Content-Type 硬编码、auth token 自动拼接等）
- [x] 5.4 确保 `execute_request` 工具调用时系统不注入任何默认请求头，完全由 Agent 提供 headers 参数

## 6. 清理旧批量执行基础设施

- [x] 6.1 删除 `src/content/batch-executor.js` 文件
- [x] 6.2 在 `background.js` 中移除 `BATCH_EXECUTE`、`BATCH_CANCEL` 消息路由和处理
- [x] 6.3 在 `background.js` 中移除 `BATCH_PROGRESS_INTERNAL`、`BATCH_COMPLETE_INTERNAL` 消息路由
- [x] 6.4 在 `background.js` 中移除 `executeBatch()` 函数
- [x] 6.5 在 `manifest.json` 中移除 `batch-executor.js` 的 `web_accessible_resources` 声明
- [x] 6.6 在 `panel.js` 中移除 `BATCH_PROGRESS`、`BATCH_COMPLETE` 消息监听（`chrome.runtime.onMessage` 中的 case 分支）和 `handleTaskCancel()` 调用
- [x] 6.7 在 `panel.js` 中移除 `handleTaskCancel()` 函数（如存在）

## 7. 集成测试与验证

- [x] 7.1 验证"允许执行"按钮点击后正确注入消息并触发 Agent 循环
- [x] 7.2 验证 `get_captured_request_detail` 工具能正确返回请求详情
- [x] 7.3 验证 `execute_request` 工具能通过页面注入正确发送 HTTP 请求（携带页面 Cookie）并返回响应
- [x] 7.4 验证 Agent 在失败后能智能调整并重试（在聊天框中可看到工具的调用和响应）
- [x] 7.5 验证 10 次重试上限生效
- [x] 7.6 验证 Agent 输出的结果报告格式正确
- [x] 7.7 确认旧的 `BATCH_EXECUTE`、`batch-executor.js`、`batch_create_data` 已完全移除且无残留引用
