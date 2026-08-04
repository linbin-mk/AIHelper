## 1. 注册 5 个页面工具到 TOOLS 数组

- [x] 1.1 在 `TOOLS` 数组中新增 `get_page_context` 工具定义：type='function', 无必填参数, 描述说明可获取页面 URL/标题/表单字段
- [x] 1.2 在 `TOOLS` 数组中新增 `get_page_interactive_elements` 工具定义：type='function', 无必填参数, 描述说明可获取可交互元素列表（最多100个）
- [x] 1.3 在 `TOOLS` 数组中新增 `click_element` 工具定义：type='function', 必填参数 `selector`(string), 可选参数 `timeout`(number), 描述说明通过CSS选择器点击元素
- [x] 1.4 在 `TOOLS` 数组中新增 `refresh_page` 工具定义：type='function', 无必填参数, 描述说明刷新当前浏览器标签页
- [x] 1.5 在 `TOOLS` 数组中新增 `execute_request` 工具定义：type='function', 必填参数 `url`(string) 和 `method`(string), 可选参数 `headers`(object) 和 `body`(string)

## 2. 实现同步工具的 executeToolCall 分支

- [x] 2.1 在 `executeToolCall()` 中新增 `get_page_context` 分支：发送 `{ type: 'GET_PAGE_CONTEXT' }` 到 background.js，返回 `JSON.stringify(response.data)`
- [x] 2.2 在 `executeToolCall()` 中新增 `get_page_interactive_elements` 分支：发送 `{ type: 'GET_PAGE_INTERACTIVE_ELEMENTS' }` 到 background.js，返回 `JSON.stringify(response.data)`
- [x] 2.3 在 `executeToolCall()` 中新增 `refresh_page` 分支：发送 `{ type: 'REFRESH_PAGE' }` 到 background.js，返回 `JSON.stringify(response.data)`

## 3. 实现异步工具的 executeToolCall 分支

- [x] 3.1 在 `executeToolCall()` 中新增 `click_element` 分支：发送 `{ type: 'CLICK_ELEMENT', data: { selector, timeout } }`，ACK 后注册一次性 `onMessage` 监听器等待 `CLICK_ELEMENT_RESULT`，30s 超时
- [x] 3.2 在 `executeToolCall()` 中新增 `execute_request` 分支：发送 `{ type: 'EXECUTE_REQUEST', data: { url, method, headers, body } }`，ACK 后注册一次性 `onMessage` 监听器等待 `EXECUTE_REQUEST_RESULT`，35s 超时

## 4. 验证

- [x] 4.1 刷新扩展后在对话中输入"获取当前页面上下文"，验证 AI 调用 `get_page_context` 并返回正确数据
- [x] 4.2 在对话中输入"列出页面可交互元素"，验证 AI 调用 `get_page_interactive_elements` 并返回元素列表
- [x] 4.3 在对话中输入"刷新页面"，验证 AI 调用 `refresh_page` 并返回刷新结果
- [x] 4.4 在任意页面测试点击工具（如"点击 .nav-item 元素"），验证 AI 调用 `click_element` 并返回点击结果
- [x] 4.5 在任意页面测试请求工具（如"GET https://httpbin.org/get"），验证 AI 调用 `execute_request` 并返回响应
- [x] 4.6 确认 skill prompt 中引用的工具名（`get_page_interactive_elements`、`click_element`、`refresh_page`、`execute_request`）不再返回"未知工具"错误
