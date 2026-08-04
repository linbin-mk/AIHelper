## Context

当前 `executeBatch()` 在 Service Worker 中执行，需手动注入 Origin/Referer/Cookie。改为全量复制捕获请求的 header 后，还需将 `fetch()` 移到页面 Content Script 中，让浏览器上下文自然提供来源和鉴权。

## Goals / Non-Goals

**Goals:**
- 捕获请求时存全部 header
- `fetch()` 在页面 Content Script 中执行，Origin/Referer/Cookie 浏览器自动带
- Service Worker 只负责匹配 header + 注入脚本 + 转发消息

**Non-Goals:**
- 不改变 body 替换、并发控制、taskCard UI

## Decisions

### 1. 执行位置：Content Script

`fetch()` 从 Service Worker 移到页面 Content Script 中执行。

优势：
- Origin、Referer 浏览器自动设置（基于页面 origin）
- Cookie 浏览器自动携带（同源请求时）
- 无需 `chrome.cookies` API、`getCookieHeader()`、`storedAuthToken`

约束：跨域请求需要服务端支持 CORS。

### 2. 新增 Content Script: batch-executor.js

`Background` 通过 `chrome.scripting.executeScript` 动态注入。接收配置参数，执行批量 fetch，通过 `chrome.runtime.sendMessage` 回报进度。

```
Background                              Content Script (页面内)
    │                                         │
    ├─ 匹配捕获请求, 组装 headers               │
    ├─ chrome.scripting.executeScript(         │
    │     { files: ['batch-executor.js'] },    │
    │     callback                              │
    │   )                                      │
    │                                         │
    │  ←── sendMessage({ type: 'BATCH_PROGRESS' }) ──┤
    │  ←── sendMessage({ type: 'BATCH_COMPLETE' }) ──┤
```

### 3. Header 组装：Background 负责

Background 从 buffer 中取任意一个有 header 的捕获请求（buffer 已限定当前 Tab），全量复制其 header。同一页面的请求 header 一致，无需按 method+path 精确匹配。

```javascript
const anyReq = recentRequests.find(r => r.headers && Object.keys(r.headers).length > 0);
const headers = anyReq?.headers ? { ...anyReq.headers } : {};

chrome.scripting.executeScript({
  target: { tabId },
  func: batchExecutor,
  args: [{ url, method, headers, bodyTemplate, count, concurrency: 5, taskId }]
});
```

### 4. 并发控制：Content Script 内实现

Concurrency control 从 `Background.runWithConcurrency` 移到 Content Script 内，逻辑相同（Promise.race 池，max 5）。

### 5. 取消机制

Panel → `BATCH_CANCEL` → Background → 发送取消消息给 Content Script（通过 tab 消息），或 Content Script 监听 `AbortController`。

## Risks / Trade-offs

- **跨域请求需要 CORS** → 大多数管理后台 API 与页面同源，跨域场景需服务端配置 `Access-Control-Allow-Origin`
- **Content Script 注入时机** → 动态注入，执行完即销毁
