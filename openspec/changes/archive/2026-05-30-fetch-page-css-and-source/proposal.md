## Why

当前 AIHelper 的 Agent 可以捕获网络请求、页面 URL、标题和可交互元素，但**无法获取页面的 CSS 样式和 HTML 源码**。当用户让 AI 分析或复刻页面 UI 样式（如按钮颜色、布局、字体大小）时，AI 只能基于猜测而非真实数据给出答案，导致产出不准确。

## What Changes

- 新增 `page-css-extraction` 内容脚本，支持获取指定元素的计算样式或页面全部样式表内容
- 新增 `page-source-extraction` 内容脚本，支持获取页面完整或局部的 HTML 源码（DOM 序列化）
- 新增 `page-js-extraction` 内容脚本，支持获取页面内联脚本代码和外部脚本引用列表
- 在 Agent 工具列表中新增 `get_page_css`、`get_page_source`、`get_page_js` 三个工具，供 AI 在对话中调用
- 在 `background.js` 中注册对应的消息处理路由（`GET_PAGE_CSS`、`GET_PAGE_SOURCE`、`GET_PAGE_JS`）

## Capabilities

### New Capabilities
- `page-css-extraction`: 从当前页面提取 CSS 样式信息，包括指定元素的计算样式（computed style）和页面样式表（stylesheet）原始内容
- `page-source-extraction`: 从当前页面提取 HTML 源码，支持完整页面、指定选择器元素、或截断输出
- `page-js-extraction`: 从当前页面提取 JavaScript 代码，支持内联脚本内容提取和外部脚本 URL 列表

### Modified Capabilities
<!-- No existing capabilities need to change at the spec level -->

## Impact

- 影响文件: `chrome-extension/src/background.js`（新增消息路由）、`chrome-extension/src/panel/chat.js`（新增工具定义和执行逻辑）
- 新增文件: `chrome-extension/src/content/page-css.js`、`chrome-extension/src/content/page-source.js`、`chrome-extension/src/content/page-js.js`
- 无 API 或依赖变更
- 不影响现有内容脚本和消息处理流程
