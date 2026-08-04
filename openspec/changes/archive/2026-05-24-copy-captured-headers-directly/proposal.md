## Why

当前批量请求的 header 组装采用"逐层填空"策略，且 `fetch()` 在 Service Worker 中执行，需要手动注入 Origin、Referer、Cookie。改为全量复制捕获请求的 header 后，再将 `fetch()` 移到页面内 Content Script 执行，让 Origin、Referer、Cookie 由浏览器上下文自然提供，彻底消除手动组装鉴权和来源信息的逻辑。

## What Changes

- `onBeforeSendHeaders` 存储全部 header（移除名称过滤）
- 批量请求的 `fetch()` 从 Service Worker 移到页面内注入的 Content Script 中执行
- Service Worker 只负责：匹配捕获请求 header → 注入执行脚本 → 转发进度消息
- 删除 `storedAuthToken`、`getCookieHeader()`、Origin/Referer/Cookie 手动设置等逻辑

## Capabilities

### New Capabilities

- `captured-header-copy`: 批量请求 header 从捕获请求全量复制
- `content-script-batch-executor`: 页面内 Content Script 执行批量 fetch，自动携带浏览器上下文

### Modified Capabilities

- `test-data-generation`: `batch_create_data` 的 header 组装和执行方式变更

## Impact

- `chrome-extension/src/background.js`: `onBeforeSendHeaders`、`executeBatch()` 重构，删除鉴权和来源注入逻辑
- `chrome-extension/src/content/batch-executor.js`: 新建，页面内批量请求执行脚本
- `chrome-extension/manifest.json`: 可能需要注册新 Content Script 或保持动态注入
