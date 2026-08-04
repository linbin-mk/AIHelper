## Context

当前请求监控架构中，background.js 使用单一 `Map<requestId, entry>` 缓冲区（上限 200 条），并在 webRequest 回调中通过 `details.tabId !== activeTabId` 过滤非活跃 tab。Tab 切换时调用 `clearRequestsForPreviousTab()` 清空整个 buffer 并通知面板清空 DOM。panel.js 维护独立的 `requestDataMap` 来渲染请求列表。

核心缺陷：webRequest 是纯事件驱动的，没有历史回溯能力。非活跃 tab 的请求在回调中就被丢弃，切换到该 tab 后也无法恢复。

## Goals / Non-Goals

**Goals:**
- 捕获所有 tab 的 webRequest 事件，不再按 activeTabId 过滤
- 按 tabId 分组缓冲请求，每个 tab 独立维护最近 50 条记录
- Tab 切换时保留所有历史数据，仅切换面板显示的数据源
- Tab 关闭时自动清理对应缓冲区

**Non-Goals:**
- 不改变请求条目（entry）的数据结构
- 不改变 webRequest 监听器的过滤条件（仍过滤 `xmlhttprequest`/`other` 类型和 `tabId < 0`）
- 不改变请求体拦截（content script）的流程
- 不持久化请求数据（页面刷新后数据丢失仍可接受）

## Decisions

### 1. 缓冲区结构：`Map<tabId, PerTabBuffer>` 

**选择**：顶层 `Map<tabId, { buffer: Map<requestId, entry>, order: string[] }>`，每个 tab 独立维护自己的 buffer 和 order 数组。

**替代方案**：
- 扁平结构 + tabId 字段排序查询：结构简单但按 tab 查询和淘汰效率低，每次都需要遍历全局 order
- 嵌套 Map 无 order 数组：无法保证 FIFO 淘汰顺序，依赖 Map 的插入顺序在删除+重新插入场景下不可靠

**理由**：每 tab 独立 buffer + order 使得淘汰逻辑清晰（每个 tab 的 order 独立 FIFO），查询也高效（O(1) 定位 tab buffer）。

### 2. 淘汰策略：每 tab 50 条上限 + FIFO

**选择**：`addToBuffer` 写入时检查当前 tab 的 `order.length >= 50`，若超过则 `shift()` 最早记录并从 buffer 中删除。

**理由**：50 条足够覆盖近期交互，同时控制内存占用（假设每条请求含 body 最大 ~200KB，50 条约 10MB/tab，考虑实际场景中大部分请求不含大 body，实际内存占用更低）。

### 3. Tab 切换协议：`TAB_REQUESTS_SWITCH` 替代 `REQUESTS_CLEARED`

**选择**：Tab 切换时不再清空 buffer，改为发送 `TAB_REQUESTS_SWITCH { tabId }`。面板收到后切换到对应 tab 的请求列表视图，不清空 DOM。

**消息变化**：
- `REQUEST_CAPTURED` / `REQUEST_COMPLETED` 消息增加 `tabId` 字段
- 面板根据当前监控 `tabId` 决定请求行的显示/隐藏
- `QUERY_REQUESTS` 响应改为返回当前 tab 的请求列表

**理由**：避免 DOM 重建闪烁，切换 tab 时保留所有已渲染数据，用户感知上近乎即时切换。

### 4. Tab 关闭清理

**选择**：监听 `chrome.tabs.onRemoved`，删除 `tabRequestBuffers` 中对应的 entry，同时如果面板正在显示该 tab，通知面板切换。

**理由**：防止内存泄漏，已关闭的 tab 数据不再有价值。

### 5. Panel 数据管理

**选择**：panel.js 维护 `currentMonitoringTabId`，每个请求行携带 `data-tab-id` 属性。切换监控 tab 时，根据 `currentMonitoringTabId` 控制行的 CSS `display` 属性，而非清空重建。

**理由**：保持 DOM 状态（如展开的详情面板、滚动位置），切换流畅。

## Risks / Trade-offs

- **[内存增长]** → 每 tab 50 条上限 + tab 关闭即时清理。实际场景中用户通常只有少数几个活跃 tab 在发请求，内存可控。
- **[消息兼容性]** → `REQUEST_CAPTURED` / `REQUEST_COMPLETED` / `REQUEST_BODY_UPDATE` 消息增加 `tabId` 字段，不删除现有字段，向前兼容。
- **[Panel 初始化]** → 面板打开时通过 `QUERY_REQUESTS` 拉取当前 tab 的请求列表，与现有逻辑一致，无额外风险。
- **[非 tab 请求]** → `tabId < 0` 的请求（如 extension 自身请求）仍然过滤，但可考虑归入单独的 "extension" 缓冲区以便调试。当前版本暂不处理，保持原有过滤逻辑。
