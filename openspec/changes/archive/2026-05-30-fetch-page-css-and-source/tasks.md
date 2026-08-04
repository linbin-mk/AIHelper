## 1. 内容脚本

- [x] 1.1 创建 `page-css.js` — 实现 CSS 提取内容脚本，支持 `computed` 模式（通过 `getComputedStyle` 获取指定选择器元素的计算样式，过滤默认值）和 `stylesheet` 模式（收集所有 `<style>` 和 `<link rel="stylesheet">` 的 CSS 规则文本，处理 CORS 异常）
- [x] 1.2 创建 `page-source.js` — 实现 HTML 源码提取内容脚本，支持通过 CSS 选择器获取指定元素的 `outerHTML`，默认 `body`，支持 `maxLength` 截断
- [x] 1.3 创建 `page-js.js` — 实现 JS 提取内容脚本，支持 `inline` 模式（内联脚本代码）、`external` 模式（外部脚本 URL 列表）、`all` 模式（两者兼有），支持 `maxLength` 截断

## 2. Background 消息路由

- [x] 2.1 扩展 `handleInjectScript` 函数，支持可选的 `args` 参数，通过 `chrome.scripting.executeScript` 的 `args` 字段传递给注入脚本
- [x] 2.2 在 `chrome.runtime.onMessage` 的 `switch` 中添加 `GET_PAGE_CSS` case，调用 `handleInjectScript` 注入 `page-css.js` 并将 selector/mode/maxLength 通过 args 传入
- [x] 2.3 在 `chrome.runtime.onMessage` 的 `switch` 中添加 `GET_PAGE_SOURCE` case，调用 `handleInjectScript` 注入 `page-source.js` 并将 selector/maxLength 通过 args 传入
- [x] 2.4 在 `chrome.runtime.onMessage` 的 `switch` 中添加 `GET_PAGE_JS` case，调用 `handleInjectScript` 注入 `page-js.js` 并将 mode/maxLength 通过 args 传入

## 3. 工具注册

- [x] 3.1 在 `chat.js` 的 `TOOLS` 数组中添加 `get_page_css` 工具定义（`function.name: "get_page_css"`，参数: `selector`(string), `mode`(string, enum: computed/stylesheet), `maxLength`(number)）
- [x] 3.2 在 `chat.js` 的 `TOOLS` 数组中添加 `get_page_source` 工具定义（`function.name: "get_page_source"`，参数: `selector`(string), `maxLength`(number)）
- [x] 3.3 在 `chat.js` 的 `executeToolCall` 函数中添加 `get_page_css` 的处理分支，发送 `GET_PAGE_CSS` 消息到 background 并返回结果
- [x] 3.4 在 `chat.js` 的 `executeToolCall` 函数中添加 `get_page_source` 的处理分支，发送 `GET_PAGE_SOURCE` 消息到 background 并返回结果
- [x] 3.5 在 `chat.js` 的 `TOOLS` 数组中添加 `get_page_js` 工具定义（`function.name: "get_page_js"`，参数: `mode`(string, enum: inline/external/all), `maxLength`(number)）
- [x] 3.6 在 `chat.js` 的 `executeToolCall` 函数中添加 `get_page_js` 的处理分支，发送 `GET_PAGE_JS` 消息到 background 并返回结果

## 4. 验证

- [x] 4.1 手动验证：加载扩展，访问测试页面，通过 AI 调用 `get_page_css`（computed/stylesheet 模式）
- [x] 4.2 手动验证：通过 AI 调用 `get_page_source`，验证完整页面和选择器返回
- [x] 4.3 手动验证：异常场景（不存在选择器、截断标记、跨域样式表 accessible:false）
- [x] 4.4 手动验证：通过 AI 调用 `get_page_js`，验证 inline/external/all 三种模式
