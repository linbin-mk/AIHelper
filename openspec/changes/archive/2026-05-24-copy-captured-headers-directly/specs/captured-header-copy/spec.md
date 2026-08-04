## ADDED Requirements

### Requirement: Capture all request headers
系统 SHALL 在 `onBeforeSendHeaders` listener 中存储捕获请求的全部 request header，不做名称过滤。

#### Scenario: Full headers captured
- **WHEN** 页面发出请求且 `onBeforeSendHeaders` 事件触发
- **THEN** `requestBuffer` 对应条目的 `headers` 字段包含 `details.requestHeaders` 中的所有 `{name, value}` 对

### Requirement: Copy headers from captured request on same page
系统 SHALL 在 `executeBatch()` 中从 `requestBuffer` 取任意一个有 header 的捕获请求（buffer 已限定当前 Tab），直接全量复制其 header。

#### Scenario: Headers copied
- **WHEN** `requestBuffer` 中存在任意有 header 的捕获请求（不限 method/path）
- **THEN** 批量请求的 header 为该捕获请求 headers 的浅拷贝

### Requirement: Batch execution in content script
系统 SHALL 在页面 Content Script 中执行批量 `fetch()` 请求，而非 Service Worker。Content Script 通过 `chrome.scripting.executeScript` 动态注入。

#### Scenario: Fetch executes in page context
- **WHEN** 批量请求发起
- **THEN** `fetch()` 在页面 Content Script 中执行
- **AND** Origin、Referer 由浏览器基于页面自动设置
- **AND** 同源请求的 Cookie 由浏览器自动携带

#### Scenario: Progress reported back
- **WHEN** Content Script 中每条请求完成
- **THEN** 通过 `chrome.runtime.sendMessage` 发送 `BATCH_PROGRESS` 给 Background
- **AND** Background 转发给 Panel 更新 UI
