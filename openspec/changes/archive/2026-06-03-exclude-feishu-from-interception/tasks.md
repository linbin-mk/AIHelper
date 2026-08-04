## 1. Chrome - manifest.json 排除飞书

- [x] 1.1 为 `request-interceptor-bridge.js` 的 content_scripts 配置添加 `"exclude_matches": ["*://*.feishu.cn/*"]`
- [x] 1.2 为 `request-interceptor.js` 的 content_scripts 配置添加 `"exclude_matches": ["*://*.feishu.cn/*"]`

## 2. Chrome - background.js 飞书域名过滤

- [x] 2.1 在文件顶部添加 `const EXCLUDED_HOSTS = ['feishu.cn'];` 和 `isExcludedUrl(url)` 辅助函数
- [x] 2.2 在 `onBeforeRequest` 监听器入口添加 `if (isExcludedUrl(details.url)) return;`
- [x] 2.3 在 `onBeforeSendHeaders` 监听器入口添加 `if (isExcludedUrl(details.url)) return;`
- [x] 2.4 在 `onCompleted` 监听器入口添加 `if (isExcludedUrl(details.url)) return;`
- [x] 2.5 修改 `injectInterceptor(tabId)` 函数，在调用 `executeScript` 前检查标签页 URL 是否为飞书域名，是则跳过注入

## 3. Chrome - request-interceptor.js 飞书守卫

- [x] 3.1 在 `request-interceptor.js` 的 IIFE 开头（`'use strict';` 之后）添加飞书域名检测和提前返回逻辑

## 4. Firefox - manifest.json 排除飞书

- [x] 4.1 为 `request-interceptor-bridge.js` 的 content_scripts 配置添加 `"exclude_matches": ["*://*.feishu.cn/*"]`
- [x] 4.2 为 `request-interceptor.js` 的 content_scripts 配置添加 `"exclude_matches": ["*://*.feishu.cn/*"]`

## 5. Firefox - background.js 飞书域名过滤

- [x] 5.1 在文件顶部添加 `const EXCLUDED_HOSTS = ['feishu.cn'];` 和 `isExcludedUrl(url)` 辅助函数
- [x] 5.2 在 `onBeforeRequest` 监听器入口添加 `if (isExcludedUrl(details.url)) return;`
- [x] 5.3 在 `onBeforeSendHeaders` 监听器入口添加 `if (isExcludedUrl(details.url)) return;`
- [x] 5.4 在 `onCompleted` 监听器入口添加 `if (isExcludedUrl(details.url)) return;`
- [x] 5.5 修改 `injectInterceptor(tabId)` 函数，在调用 `executeScript` 前检查标签页 URL 是否为飞书域名，是则跳过注入

## 6. 同步与验证

- [x] 6.1 运行 `bash sync.sh` 将 content script 修改同步到 Firefox
- [ ] 6.2 手动在飞书文档页面验证扩展不拦截飞书请求
- [ ] 6.3 验证非飞书页面的请求拦截功能正常
