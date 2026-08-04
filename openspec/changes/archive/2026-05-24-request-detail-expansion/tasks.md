## 1. Content Script：请求体/响应体拦截

- [x] 1.1 新建 `chrome-extension/src/content/request-interceptor.js`，拦截 `window.fetch` 和 `XMLHttpRequest`
- [x] 1.2 fetch 拦截器：捕获请求体（`request.body`）和响应体（`response.text()`），限流 100KB
- [x] 1.3 XHR 拦截器：捕获 `send` 的 body 和 `responseText`，兼容旧代码
- [x] 1.4 捕获到的 body 数据通过 `chrome.runtime.sendMessage` 发送 `REQUEST_BODY_DATA` 消息到 service worker

## 2. Service Worker：缓冲区扩展与消息路由

- [x] 2.1 `background.js` 添加 `REQUEST_BODY_DATA` 消息处理：按 path + method 匹配缓冲区条目，存储 `requestBody` 和 `responseBody`
- [x] 2.2 `getBufferedRequests()` 函数扩展，返回数据包含 `requestBody` 和 `responseBody` 字段
- [x] 2.3 `REQUEST_COMPLETED` 推送消息扩展，包含 body 数据（若已捕获）
- [x] 2.4 注入 content script 逻辑：tab 激活时通过 `chrome.scripting.executeScript` 注入 `request-interceptor.js`（使用 `world: 'MAIN'`）
- [x] 2.5 manifest.json 注册 `request-interceptor.js` 为 content script（可选，如需声明式注入）

## 3. Panel UI：请求行展开/折叠

- [x] 3.1 `panel.js` 添加请求行点击事件委托，根据 `data-request-id` 查找对应请求数据
- [x] 3.2 实现 `toggleRequestDetail(rid)` 函数：展开或折叠详情面板（同一时间仅展开一个）
- [x] 3.3 `panel.css` 添加 `.request-row.expanded` 高亮样式（使用 `--ctp-surface1` 主题变量）
- [x] 3.4 `panel.css` 添加 `.request-detail` 展开/折叠过渡动画（max-height transition）

## 4. Panel UI：详情面板内容渲染

- [x] 4.1 `panel.js` 添加 `renderRequestDetail(req)` 函数：构建详情面板 DOM
- [x] 4.2 详情面板 tab 栏：请求头、请求体、响应体三个 tab，点击切换显示
- [x] 4.3 请求头渲染：遍历 `headers` 对象，生成 key-value 表格行
- [x] 4.4 请求体渲染：JSON 格式化为缩进文本（`JSON.stringify(JSON.parse(body), null, 2)`），非 JSON 显示原始文本
- [x] 4.5 响应体渲染：同 4.4，超过 100KB 时截断并追加 "...（已截断）"
- [x] 4.6 空状态占位：无 headers 显示"无请求头信息"，无 body 显示"无请求体/响应体数据"，CSP 拦截显示"无法捕获（受页面 CSP 限制）"
- [x] 4.7 `panel.css` 添加详情面板样式：tab 栏、key-value 表格、代码块、占位文本，遵循 Catppuccin 主题

## 5. Panel UI："再次发起"按钮

- [x] 5.1 详情面板底部添加 `<button class="replay-btn">再次发起</button>`
- [x] 5.2 按钮点击事件：读取请求 method、url、headers、body，通过 `chrome.tabs.sendMessage` 发送 `REPLAY_REQUEST` 到 content script
- [x] 5.3 发送中状态：按钮文字变为"发送中..."，按钮 disabled
- [x] 5.4 content script 添加 `REPLAY_REQUEST` 消息处理：接收请求参数并在页面内执行 fetch
- [x] 5.5 成功/失败反馈：按钮恢复状态，新请求自动出现在列表中，失败时短暂显示错误提示

## 6. 集成测试

- [x] 6.1 验证 fetch API 的请求体/响应体被正确捕获并展示
- [x] 6.2 验证 XHR 请求的 body 被捕获
- [x] 6.3 验证 GET 请求（无 body）展开显示正常
- [x] 6.4 验证"再次发起"GET 请求成功并出现在列表中
- [x] 6.5 验证"再次发起"POST 请求成功并查看新请求详情
- [x] 6.6 验证暗色/亮色主题下详情面板样式正确
- [x] 6.7 验证大响应体（>100KB）截断行为
- [x] 6.8 测试页面 CSP 限制时的降级显示
