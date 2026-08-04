## 1. Background - 缓冲区结构重构

- [x] 1.1 定义 `tabRequestBuffers`（`Map<tabId, { buffer: Map<requestId, entry>, order: string[] }>`）和 `TAB_BUFFER_MAX = 50` 常量，替换原有全局 `requestBuffer` + `requestOrder`
- [x] 1.2 实现 `getOrCreateTabBuffer(tabId)` 辅助函数，自动为不存在的 tabId 创建新的 buffer/order
- [x] 1.3 重写 `addToBuffer(tabId, requestId, data)`，按 tabId 定位 buffer，检查 order.length >= 50 时 FIFO 淘汰最旧条目
- [x] 1.4 重写 `getBufferedRequests(tabId)`，返回指定 tabId 的请求数组（按 order 顺序）

## 2. Background - webRequest 监听器修改

- [x] 2.1 修改 `onBeforeRequest` 监听器：移除 `details.tabId !== activeTabId` 过滤，保留 `tabId < 0` 和资源类型过滤；调用 `addToBuffer` 时传入 `details.tabId`
- [x] 2.2 修改 `onBeforeSendHeaders` 监听器：移除 `details.tabId !== activeTabId` 过滤
- [x] 2.3 修改 `onCompleted` 监听器：移除 `details.tabId !== activeTabId` 过滤；`sendToPanel('REQUEST_COMPLETED', ...)` 的消息 payload 中增加 `tabId` 字段

## 3. Background - Tab 生命周期与消息协议

- [x] 3.1 修改 `chrome.tabs.onActivated` 处理器：移除 `clearRequestsForPreviousTab()` 调用，改为 `sendToPanel('TAB_REQUESTS_SWITCH', { tabId: activeInfo.tabId })` 更新 activeTabId
- [x] 3.2 移除 `clearRequestsForPreviousTab()` 函数（或保留为空函数以兼容）
- [x] 3.3 新增 `chrome.tabs.onRemoved` 监听器，删除 `tabRequestBuffers` 中的对应 buffer，若被关闭的 tab 是当前 activeTabId 则通知面板
- [x] 3.4 修改 `QUERY_REQUESTS` 消息处理：根据当前 activeTabId 返回对应 tab 的缓冲请求列表
- [x] 3.5 修改 `REQUEST_CAPTURED` 消息发送：payload 中增加 `tabId` 字段

## 4. Panel - 适配新消息协议与数据源切换

- [x] 4.1 添加 `currentMonitoringTabId` 全局变量，面板打开时通过 `QUERY_TAB_URL` 或初始化消息获取当前监控 tabId
- [x] 4.2 修改 `handlePanelMessage`：处理 `TAB_REQUESTS_SWITCH` 消息，更新 `currentMonitoringTabId`，重新过滤请求行的显示/隐藏
- [x] 4.3 修改 `appendRequestRow`：每个请求行 DOM 元素添加 `data-tab-id` 属性，渲染时根据 `currentMonitoringTabId` 控制 `display` 样式
- [x] 4.4 修改 `REQUEST_CAPTURED` / `REQUEST_COMPLETED` / `REQUEST_BODY_UPDATE` 消息处理：提取 `tabId`，非当前监控 tab 的请求行设为隐藏
- [x] 4.5 移除 `REQUESTS_CLEARED` 消息处理逻辑（切换时不再清空 DOM），保留 `clearRequestsList()` 函数供 tab 关闭场景使用
