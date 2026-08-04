## Why

当前请求监控在 webRequest 回调中按 `activeTabId` 过滤请求，非活跃 tab 的请求事件被直接丢弃。用户切换到新 tab 时，该 tab 的历史请求已经丢失，无法回溯查看。这导致请求监控只能看到"当前 tab 从此刻开始"的请求，违背了监控工具的直觉预期。

## What Changes

- **移除 activeTabId 过滤**：所有 tab 的 webRequest 事件全部捕获，不再在回调中丢弃非活跃 tab 的请求
- **按 tabId 分组缓冲**：将单一的 `requestBuffer` 改为 `Map<tabId, PerTabBuffer>` 结构，每个 tab 独立维护自己的请求缓冲区
- **每个 tab 缓存最近 50 条请求**：超过 50 条时销毁最早的请求（FIFO 淘汰）
- **Tab 切换仅切换显示**：不再清空 buffer，切换 tab 时只通知面板切换数据源，保留所有 tab 的请求历史
- **Tab 关闭时清理**：监听 `tabs.onRemoved`，及时释放已关闭 tab 的缓冲区内存

## Capabilities

### New Capabilities
- `per-tab-request-buffering`: 按 tabId 分组缓存请求，每个 tab 独立维护最多 50 条请求记录，支持 tab 切换时保留历史请求数据

### Modified Capabilities
<!-- 无现有 spec 需要修改 -->

## Impact

- **`background.js`**：核心改动区域。修改 webRequest 监听器（移除 `details.tabId !== activeTabId` 过滤）、重构缓冲区结构（`Map<tabId, Map<requestId, entry>>`）、修改 tab 切换逻辑（不再清空 buffer，仅通知面板切换 tabId）、新增 `tabs.onRemoved` 处理器、修改 `getBufferedRequests()` 支持按 tabId 查询
- **`panel.js`**：适配新的消息格式。`REQUEST_CAPTURED`/`REQUEST_COMPLETED` 消息需要携带 `tabId`，面板根据当前选中的监控 tabId 决定哪些请求行可见，切换 tab 时无需清空列表而是切换数据源
- **消息协议**：`REQUESTS_CLEARED` 消息改为 `TAB_REQUESTS_SWITCH`，携带目标 `tabId`；面板不再需要清空 DOM 后重建
