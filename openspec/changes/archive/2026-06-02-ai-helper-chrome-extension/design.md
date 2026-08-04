## 背景

这是一个全新的 Chrome 插件（Manifest V3）项目。插件提供一个持久化的侧边栏面板，用于捕获和展示当前标签页的网络请求、监控 Cookie、支持请求头注入。用户安装插件后，点击工具栏图标即可在当前页面上打开侧边栏面板。

Chrome Manifest V2 已弃用；所有新插件必须使用 V3，采用 service worker（而非 background page）和 declarativeNetRequest（而非阻塞式 webRequest）。

## 目标 / 非目标

**目标：**
- 持久化的侧边栏面板 UI，切换标签页时保持打开状态
- 实时捕获当前标签页的所有 XHR/fetch 请求（方法、URL 路径、状态码）
- 在面板中显示当前页面 URL
- 显示当前页面的 Cookie 数量
- 显示已配置的请求头挟持规则（Authorization、X-Token）
- 配置要注入到发出请求中的自定义请求头

**非目标：**
- 请求/响应体内容检查（初始版本不做）
- 修改响应头或响应体
- 捕获 WebSocket 流量
- 跨域 Cookie 管理
- 导出/导入捕获的请求
- 支持非 Chrome 浏览器（Firefox、Safari）

## 设计决策

### 1. 架构：Service Worker + 侧边栏面板

**决策**：使用 service worker 作为请求监控和状态管理的中心枢纽，侧边栏面板作为纯视图层。

**理由**：Manifest V3 强制使用 service worker，它是短暂的。所有请求捕获逻辑放在 worker 中。侧边栏面板通过 `chrome.runtime` 消息通信来查询状态和订阅更新。这种分离使面板保持无状态，简化调试。

**备选方案**：
- **DevTools 面板**：仅当 DevTools 打开时可用 —— 不满足"持久化控制面板"的需求。
- **Popup + content script 注入**：Popup 失去焦点即关闭。Content script 可以拦截 fetch/XHR，但无法使用 `webRequest`。已排除。

### 2. 请求捕获：webRequest API + 内存缓冲区

**决策**：使用 `chrome.webRequest.onBeforeRequest` 和 `chrome.webRequest.onCompleted` 捕获当前标签页的请求。在 service worker 中维护一个环形缓冲区（最多 200 条），以 `requestId` 为键。

**理由**：`webRequest` 是 Manifest V3 中唯一能为所有请求类型（XHR、fetch、导航）提供实时请求/响应生命周期事件的 API。`declarativeNetRequest` 是基于规则的，不发出事件。

**权衡**：需要 `host_permissions: ["<all_urls>"]`，这会触发 Chrome 网上应用店的审查警告。通过在商店提交时的权限说明中列出面向用户的正当理由来缓解。

### 3. 请求头注入：declarativeNetRequest 动态规则

**决策**：使用 `chrome.declarativeNetRequest.updateDynamicRules` 来添加/修改请求头。用户在侧边栏面板中配置请求头名称和值，持久化到 `chrome.storage.local` 并同步到 DNR 规则。

**理由**：这是 Manifest V3 的正确做法。旧的 `webRequest.onBeforeSendHeaders` 阻塞模式已弃用，在 V3 中不可用。DNR 规则高效且声明式。

### 4. 面板布局：纯 HTML/CSS/JS

**决策**：使用原生 HTML/CSS/JS 构建侧边栏面板。使用固定头部显示当前 URL，可滚动的请求列表表格，以及底部的 Cookie 和请求头信息区域。

**理由**：约 200 行 UI 无需框架。Chrome 插件体积小 —— 引入 React/Vue 会不必要地增加包体积和构建复杂度。

### 5. Cookie 监控：chrome.cookies API

**决策**：在当前标签页变化或面板打开时，轮询 `chrome.cookies.getAll({url: activeTabUrl})`。按 Cookie 类型（会话 vs 持久）显示数量。

**理由**：`cookies` API 需要 `cookies` 权限。轮询已足够，因为面板用户可以手动请求刷新。通过 `chrome.cookies.onChanged` 进行事件驱动的监控过于嘈杂，初始版本不需要。

## 风险 / 权衡

| 风险 | 缓解措施 |
|------|----------|
| `<all_urls>` 权限触发 Chrome 网上应用店扩展审查 | 编写清晰面向用户的正当理由说明；考虑仅限制为 `https://*/*` |
| Service worker 可能被终止，丢失内存中的请求缓冲区 | 暂时接受；面板打开时请求会重新累积。未来：将环形缓冲区持久化到 `storage.session` |
| `declarativeNetRequest` 规则是浏览器级别的，非按标签页的 | 通过规则的 `condition.tabIds` 添加基于 tabId 的条件。无活跃标签页时清除规则，避免请求头跨标签页泄漏 |
| 侧边栏面板有 2-3px 边框无法完全消除 | 接受此为 Chrome 限制 |

## 待定问题

- 请求头注入应作用于所有标签页还是仅当前标签页？（默认：仅当前标签页，基于用户描述的"当前页面"场景）
- 捕获的请求是否应在同一标签页的页面导航之间保留？（默认：是，缓冲区仅在用户显式操作时清除）
