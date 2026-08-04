## 1. 工具定义（shared/chat.js）

- [x] 1.1 在 TOOLS 数组中新增 `navigate_to_url` 工具定义（参数：url, waitForLoad），含描述和参数 schema
- [x] 1.2 在 TOOLS 数组中新增 `open_new_tab` 工具定义（参数：url），含描述和参数 schema
- [x] 1.3 在 TOOLS 数组中新增 `switch_to_tab` 工具定义（参数：tabId, urlPattern），含描述和参数 schema
- [x] 1.4 在 TOOLS 数组中新增 `close_tab` 工具定义（参数：tabId），含描述和参数 schema
- [x] 1.5 在 TOOLS 数组中新增 `list_tabs` 工具定义（无必需参数），含描述

## 2. 工具执行处理（shared/chat.js）

- [x] 2.1 在 `executeToolCall` 中添加 `navigate_to_url` 处理分支：验证 URL 格式，通过 sendMessage 发送 NAVIGATE_TO_URL 到 background，返回结果
- [x] 2.2 在 `executeToolCall` 中添加 `open_new_tab` 处理分支：通过 sendMessage 发送 OPEN_NEW_TAB 到 background，返回新标签页信息
- [x] 2.3 在 `executeToolCall` 中添加 `switch_to_tab` 处理分支：通过 sendMessage 发送 SWITCH_TO_TAB 到 background，支持 tabId 和 urlPattern 两种查找方式
- [x] 2.4 在 `executeToolCall` 中添加 `close_tab` 处理分支：通过 sendMessage 发送 CLOSE_TAB 到 background，返回关闭结果
- [x] 2.5 在 `executeToolCall` 中添加 `list_tabs` 处理分支：通过 sendMessage 发送 LIST_TABS 到 background，返回当前窗口所有标签页列表

## 3. Chrome Background 消息处理（chrome-extension/src/background.js）

- [x] 3.1 在 onMessage 中添加 NAVIGATE_TO_URL 处理：调用 `chrome.tabs.update(activeTabId, { url })`，返回 tabId、url、title
- [x] 3.2 在 onMessage 中添加 OPEN_NEW_TAB 处理：调用 `chrome.tabs.create({ url })`，返回 tabId、url、title
- [x] 3.3 在 onMessage 中添加 SWITCH_TO_TAB 处理：通过 tabId 直接 `chrome.tabs.update` 激活，或通过 urlPattern 用 `chrome.tabs.query` 查找后激活
- [x] 3.4 在 onMessage 中添加 CLOSE_TAB 处理：先检查窗口标签页数量，大于 1 时才调用 `chrome.tabs.remove`，否则返回错误
- [x] 3.5 在 onMessage 中添加 LIST_TABS 处理：调用 `chrome.tabs.query({ currentWindow: true })`，返回格式化的标签页数组

## 4. Firefox Background 消息处理（firefox-extension/src/background.js）

- [x] 4.1 在 onMessage 中添加 NAVIGATE_TO_URL 处理：使用 `browser.tabs.update(activeTabId, { url })`
- [x] 4.2 在 onMessage 中添加 OPEN_NEW_TAB 处理：使用 `browser.tabs.create({ url })`
- [x] 4.3 在 onMessage 中添加 SWITCH_TO_TAB 处理：使用 `browser.tabs.query` + `browser.tabs.update`
- [x] 4.4 在 onMessage 中添加 CLOSE_TAB 处理：检查标签页数量后使用 `browser.tabs.remove`
- [x] 4.5 在 onMessage 中添加 LIST_TABS 处理：使用 `browser.tabs.query({ currentWindow: true })`

## 5. 同步与验证

- [x] 5.1 运行 `bash sync.sh` 将 shared/chat.js 修改同步到两个扩展目录
- [ ] 5.2 在 Chrome 中加载扩展，测试所有 5 个工具：导航、打开新标签页、切换标签页、关闭标签页、列出标签页
- [ ] 5.3 在 Firefox 中加载扩展，测试所有 5 个工具
