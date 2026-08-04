## Why

AI 助手当前可以读取页面上下文、点击元素、填写表单，但无法切换浏览器标签页或导航到新 URL，无法跨页面完成工作流。添加 tab/page 导航工具可让 AI 独立完成跨站点操作。

## What Changes

- 新增 `navigate_to_url` 工具：导航当前标签页到指定 URL，支持等待页面加载完成
- 新增 `open_new_tab` 工具：打开新标签页并导航到指定 URL，返回新标签页 ID
- 新增 `switch_to_tab` 工具：切换到指定标签页（通过 tabId 或 URL 匹配）
- 新增 `close_tab` 工具：关闭指定标签页（通过 tabId，不关闭最后一个标签页以防窗口关闭）
- 新增 `list_tabs` 工具：列出当前窗口所有标签页及其标题、URL、tabId
- Chrome 和 Firefox background.js 中分别添加对应的消息处理和 tab API 调用

## Capabilities

### New Capabilities

- `tab-switching`: AI 助手可导航、切换、打开、关闭浏览器标签页，并列举所有打开的标签页信息

### Modified Capabilities

无。

## Impact

- `shared/chat.js` — TOOLS 数组中新增 5 个工具定义；executeToolCall 中新增对应处理分支，通过 `chrome.runtime.sendMessage` 发送给 background
- `chrome-extension/src/background.js` — onMessage 中新增 5 种消息类型处理，调用 `chrome.tabs.update/create/query/remove`
- `firefox-extension/src/background.js` — 同上，使用 `browser.tabs` API
