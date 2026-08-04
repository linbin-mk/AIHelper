## Why

当前"请求监控"页面仅展示请求的 method、path 和 status，无法查看请求头、请求体、响应体等关键调试信息，也无法快速重放请求进行验证。开发者需要展开查看完整请求详情和"再次发起"能力，以提升 API 调试效率。

## What Changes

- 请求列表行支持点击展开/折叠，展开后显示请求详情面板
- 详情面板展示：请求头（key-value 列表）、请求体（JSON/文本）、响应体（JSON/文本）
- 通过 content script 拦截 fetch/XHR 捕获请求体和响应体，存入缓冲区
- 详情面板底部提供"再次发起"按钮，重新发送该请求（使用 `fetch` API）
- 重新发起的请求自动被捕获并追加到请求列表中

## Capabilities

### New Capabilities
- `request-detail-view`: 请求列表行点击展开，展示请求头、请求体、响应体的详情面板 UI
- `request-body-capture`: 通过内容脚本拦截 fetch/XHR，捕获请求体和响应体并存入缓冲区
- `request-replay`: 支持从详情面板"再次发起"请求，重放的请求自动进入请求列表

### Modified Capabilities
- `request-capture`: 扩展缓冲区数据结构，新增 `requestBody`、`responseBody` 字段；新增 body 数据的消息推送

## Impact

- 修改 `chrome-extension/src/background.js`：扩展缓冲区数据结构，新增 body 相关消息处理
- 修改 `chrome-extension/src/panel/panel.js`：新增请求行展开/折叠逻辑、详情面板渲染、"再次发起"处理
- 修改 `chrome-extension/src/panel/panel.css`：新增详情面板样式、展开动画
- 修改 `chrome-extension/src/panel/panel.html`：可选的详情面板 DOM 结构调整
- 新增 `chrome-extension/src/content/request-interceptor.js`：拦截页面的 fetch/XHR 调用，提取请求体和响应体
- 需要 `chrome.scripting` 权限注入 content script；需在 manifest.json 中注册 content script
