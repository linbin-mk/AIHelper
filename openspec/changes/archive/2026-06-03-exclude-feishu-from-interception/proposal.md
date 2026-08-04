## Why

AI Helper 扩展的网络请求拦截器（fetch/XHR monkey-patch 与 webRequest 监听）会干扰飞书页面，导致飞书文档无法正常加载或功能异常。飞书有严格的安全机制，扩展的拦截行为会触发其 CSRF/XSRF 防护，致使页面白屏、请求失败或内容无法显示。需要排除飞书域名，避免拦截干扰。

## What Changes

- **manifest.json**（Chrome + Firefox）：为 request-interceptor 和 request-interceptor-bridge 两个 content scripts 添加 `exclude_matches: ["*://*.feishu.cn/*"]`
- **background.js**（Chrome + Firefox）：在 webRequest 的三个监听器（onBeforeRequest、onBeforeSendHeaders、onCompleted）以及 `injectInterceptor()` 中添加飞书域名过滤
- **request-interceptor.js**（Chrome content 真相源）：在脚本入口添加飞书域名早期返回守卫，避免在该域名下修改全局 fetch/XHR

## Capabilities

### New Capabilities

- `feishu-domain-exclusion`: 在扩展的网络请求拦截层面排除飞书域名（`*.feishu.cn`），确保飞书页面不受扩展干扰，正常加载和使用

### Modified Capabilities

<!-- 无现有 capability 需要修改 -->

## Impact

- **Chrome 扩展**: `chrome-extension/manifest.json`, `chrome-extension/src/background.js`, `chrome-extension/src/content/request-interceptor.js`
- **Firefox 扩展**: `firefox-extension/manifest.json`, `firefox-extension/src/background.js`
- **sync.sh**: `chrome-extension/src/content/request-interceptor.js` 的修改会自动同步到 Firefox
