## Context

当前请求监控页面仅展示 method/path/status 三列扁平列表，缺少请求详情展开和请求重放能力。`background.js` 通过 `webRequest` API 已捕获请求头（`onBeforeSendHeaders`），但 `webRequest` 不提供请求体/响应体访问。需要注入 content script 拦截页面上的 `fetch`/`XMLHttpRequest` 调用来获取 body 内容。

项目为 Chrome 插件（Manifest V3），UI 使用纯原生 HTML/CSS/JS，采用 Catppuccin 主题系统。

## Goals / Non-Goals

**Goals:**
- 请求列表行点击后展开，显示请求头、请求体、响应体的详情面板
- 通过 content script 拦截 fetch/XHR 调用，提取请求体和响应体
- 详情面板底部提供"再次发起"按钮，重新发送请求
- 重放的请求自动进入请求列表，可在列表中查看新请求详情
- 所有 UI 遵循现有 Catppuccin 主题系统，支持暗色/亮色模式

**Non-Goals:**
- 不捕获 WebSocket 流量
- 不支持批量重放多个请求
- 不编辑/修改请求内容后重新发送（仅原样重放）
- 不持久化捕获的请求详情到存储
- 不支持重放二进制请求体（如文件上传）

## Decisions

### 1. Body 捕获：Content Script 拦截 fetch/XHR

**决策**：新增 `content/request-interceptor.js`，注入到活跃标签页中，在页面运行时拦截 `window.fetch` 和 `XMLHttpRequest` 以捕获请求体和响应体。

**理由**：Chrome 的 `webRequest` API 无法提供请求体/响应体内容 —— 这是 Manifest V3 的明确限制。唯一获取 body 内容的方式是在页面上下文中拦截实际的 fetch/XHR 调用。通过 `chrome.scripting.executeScript` 注入到 `MAIN` 世界可访问页面的 `fetch` 和 `XMLHttpRequest`。

**备选方案**：
- `chrome.debugger` API：可在 Network.requestWillBeSent 和 Network.responseReceived 中捕获 body。但会显示"调试器已连接"横幅，用户体验差。已排除。
- DevTools Panel：需要 DevTools 打开且 `Network.getResponseBody` 可用。不满足"持久化侧边栏"需求。已排除。

**权衡**：Content script 注入到 `MAIN` 世界意味着它可以被页面的 CSP 阻止，也可能与页面上其他拦截 fetch 的脚本冲突。通过使用 `chrome.scripting.executeScript` 的 `world: 'MAIN'` 选项，我们可以注入到页面主世界；但如果页面有严格的 CSP（`script-src` 不包含扩展脚本），注入可能会失败。

### 2. 数据流：Content Script → Service Worker → Panel

**决策**：拦截器捕获 body 后，通过 `chrome.runtime.sendMessage` 发送到 service worker，worker 匹配 requestId 并将 body 数据存储到缓冲区中。panel 通过 `QUERY_REQUESTS` 获取完整数据（含 headers 和 body）。

**理由**：保持现有架构的单向数据流：content → background → panel。Service worker 仍然是数据中枢，panel 从 worker 获取数据。

**备选方案**：Content script 直接发送到 panel（通过 `chrome.tabs.sendMessage` 到 side panel）。但这绕过了 service worker 的数据聚合，且 side panel 没有 tabId，无法直接通信。已排除。

### 3. 请求重放：通过 Content Script 在页面上下文中发起

**决策**：在详情面板中点击"再次发起"时，panel 通过 `chrome.tabs.sendMessage` 将请求参数（method、url、headers、body）发送到 content script，由 content script 在页面上下文中执行 `fetch`。新请求会被 `webRequest` 监听器自动捕获并追加到列表中。

**理由**：页面上下文发起 fetch 使用页面的 origin，天然无跨域限制，可重放所有类型的 API 请求。Panel 扩展 origin（`chrome-extension://`）的 fetch 会遇到 CORS 限制，service worker fetch 则可能因 worker 生命周期导致请求中断。

**备选方案**：
- Panel 直接 fetch：简单但受 CORS 限制，大部分内部 API 无 CORS header。已排除。
- Service worker fetch：无跨域限制但 worker 可能随时终止。已排除。

**选择**：统一通过 content script 在页面上下文中重放，无跨域限制且可靠。

### 4. 详情面板 UI：内联展开 + 折叠动画

**决策**：请求行下方内联展开详情面板，使用 CSS `max-height` 过渡实现展开/折叠动画。详情区域使用标签页切换显示请求头、请求体、响应体。

**理由**：与项目现有 UI 模式（thinking-collapsed、file-tree-collapsed）保持一致。内联展开（而非模态框）让用户可以同时看到请求列表和详情，更符合实用工具的使用习惯。

## Risks / Trade-offs

| 风险 | 缓解措施 |
|------|----------|
| CSP 阻止 content script 注入到 MAIN 世界 | 尝试注入，失败时静默降级 —— body 区域显示"无法捕获（受页面 CSP 限制）" |
| content script 与其他拦截器冲突 | 使用 `Proxy` 包装原生 fetch，保持向后兼容；仅在拦截器未加载时安装 |
| 大响应体（>1MB）导致内存溢出 | 响应体大小限制为 100KB（可配置）；超出部分截断并显示"...（已截断）" |
| 重放请求携带过期 token/cookie | 默认使用"再次发起此请求"时，带上原始请求头；添加提示"注意：Token 可能已过期" |
| Service worker 重启导致 body 数据丢失 | 接受此为已知限制；body 捕获与请求捕获同步，重新打开面板时重新捕获 |

## Open Questions

- 请求头中是否应屏蔽敏感字段（如 Authorization、Cookie）的默认显示？（默认：显示所有头，敏感值不做特殊处理——开发工具可以透明展示）
- "再次发起"是否需要修改请求体/请求头的编辑模式？（默认：v1 仅原样重放，编辑模式留待后续迭代）
