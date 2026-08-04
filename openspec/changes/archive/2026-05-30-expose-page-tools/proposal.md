## Why

`background.js` 中已存在 5 条页面操作的消息路由和对应内容脚本（`GET_PAGE_CONTEXT`、`GET_PAGE_INTERACTIVE_ELEMENTS`、`CLICK_ELEMENT`、`REFRESH_PAGE`、`EXECUTE_REQUEST`），但它们没有被注册为 AI 可调用的 Tool。AI 在对话中无法获取页面上下文、可交互元素，也无法点击元素、刷新页面或执行 HTTP 请求。而技能文档（如 `website-outline`、`test-data-generation`）已经在 prompt 中引用这些工具名，导致 AI 尝试调用时收到 "未知工具" 错误。

## What Changes

- 在 `chat.js` 的 `TOOLS` 数组中新增 5 个页面工具定义，使 AI 可以调用
- 在 `chat.js` 的 `executeToolCall()` 中新增 5 个 `if` 分支，通过 `chrome.runtime.sendMessage` 调用 `background.js` 已有路由
- `click_element` 和 `execute_request` 的特殊处理：通过 `chrome.storage.local` 传参 → 注入内容脚本执行 → 等待结果回调
- 完全复用现有 `background.js` 消息路由和内容脚本，不动底层代码

## Capabilities

### New Capabilities

- `page-context-tool`: 将 `GET_PAGE_CONTEXT` 消息路由暴露为 AI 工具 `get_page_context`，返回当前页面 URL、标题和可见表单字段
- `page-interactive-elements-tool`: 将 `GET_PAGE_INTERACTIVE_ELEMENTS` 暴露为 AI 工具 `get_page_interactive_elements`，返回页面可交互元素列表（tag、文本、选择器、坐标、角色等）
- `click-element-tool`: 将 `CLICK_ELEMENT` 暴露为 AI 工具 `click_element`，通过 CSS 选择器点击页面元素并检测页面变化

### Modified Capabilities

- `browser-page-refresh`: 补齐 `refresh_page` 工具的 `handler` 实现，使其从 "仅 prompt 声明" 变为实际可调用
- `agent-execute-tool`: 补齐 `execute_request` 工具的 `handler` 实现，使其从 "仅 spec 定义" 变为实际可调用

## Impact

- 修改文件: `chrome-extension/src/panel/chat.js`（新增 TOOLS 定义 + executeToolCall 分支）
- 不新增文件
- 不修改 `background.js`、内容脚本、技能系统
- 不影响现有工具和消息处理流程
- 无 API 或依赖变更
