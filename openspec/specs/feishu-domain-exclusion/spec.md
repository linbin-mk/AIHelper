## ADDED Requirements

### Requirement: Content scripts excluded from Feishu domains via manifest

Chrome 和 Firefox 扩展的 `manifest.json` MUST 在 `request-interceptor-bridge.js` 和 `request-interceptor.js` 两个 content scripts 的配置中声明 `exclude_matches: ["*://*.feishu.cn/*"]`，确保浏览器不在飞书页面上注入这两个脚本。

#### Scenario: Chrome manifest excludes Feishu

- **WHEN** 用户在 Chrome 中打开 `https://abc.feishu.cn/docs/xxx` 页面
- **THEN** 浏览器不注入 `request-interceptor-bridge.js` 和 `request-interceptor.js`

#### Scenario: Firefox manifest excludes Feishu

- **WHEN** 用户在 Firefox 中打开 `https://abc.feishu.cn/docs/xxx` 页面
- **THEN** 浏览器不注入 `request-interceptor-bridge.js` 和 `request-interceptor.js`

### Requirement: Background webRequest listeners filter Feishu

`background.js` 中的 `chrome.webRequest.onBeforeRequest`、`chrome.webRequest.onBeforeSendHeaders`、`chrome.webRequest.onCompleted` 三个监听器 MUST 在入口处调用 `isExcludedUrl()` 检查请求 URL，如果 URL 属于飞书域名则直接 `return` 不处理。

#### Scenario: webRequest skips Feishu requests

- **WHEN** 飞书页面发起一个 XHR 请求到 `https://abc.feishu.cn/api/xxx`
- **THEN** `background.js` 的 webRequest 监听器不对该请求执行 `addToBuffer()` 或 `sendToPanel()` 操作

#### Scenario: webRequest still captures non-Feishu requests

- **WHEN** 用户浏览 `https://example.com/api/data` 页面并发起 XHR 请求
- **THEN** `background.js` 的 webRequest 监听器正常捕获并记录该请求（不受 Feishu 排除逻辑影响）

### Requirement: Content script returns early on Feishu domains

`request-interceptor.js` MUST 在脚本入口（IIFE 开头）检查当前页面 `location.hostname`，如果匹配 `/\.feishu\.cn$/` 或等于 `feishu.cn`，则直接 `return`，不执行后续的 `fetch` 和 `XMLHttpRequest` monkey-patch。

#### Scenario: Feishu content script guard

- **WHEN** `request-interceptor.js` 在 `https://abc.feishu.cn/docs/xxx` 页面中被加载（例如通过 `injectInterceptor()` 动态注入）
- **THEN** 脚本检测到 `location.hostname` 匹配飞书域名，立即退出，不修改 `window.fetch` 和 `XMLHttpRequest`

#### Scenario: Non-Feishu content script normal execution

- **WHEN** `request-interceptor.js` 在 `https://example.com` 页面中被加载
- **THEN** 脚本正常执行 monkey-patch，拦截 `fetch` 和 `XMLHttpRequest` 请求

### Requirement: injectInterceptor excludes Feishu

`background.js` 中的 `injectInterceptor(tabId)` 函数 MUST 在调用 `chrome.scripting.executeScript` 之前，检查目标标签页的 URL 是否匹配飞书域名，如果是则跳过注入。

#### Scenario: injectInterceptor skips Feishu tabs

- **WHEN** 用户切换到飞书标签页（tab 激活触发 `injectInterceptor()`）
- **THEN** `injectInterceptor()` 检测到标签页 URL 属于飞书域名，不执行 `chrome.scripting.executeScript`

#### Scenario: injectInterceptor works for non-Feishu tabs

- **WHEN** 用户切换到 `https://github.com` 标签页
- **THEN** `injectInterceptor()` 正常注入 `request-interceptor.js`（如 CSP 允许）
