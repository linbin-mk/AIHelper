## 1. 项目脚手架

- [x] 1.1 创建 `chrome-extension/` 目录及子目录：`icons/`、`src/`、`src/panel/`
- [x] 1.2 创建 `manifest.json`（Manifest V3），配置所需权限：`sidePanel`、`webRequest`、`declarativeNetRequest`、`storage`、`activeTab`、`cookies`，host_permissions `["<all_urls>"]`
- [x] 1.3 生成 16x16、48x48、128x128 扩展图标（简易 AI/齿轮占位 PNG）

## 2. Background Service Worker

- [x] 2.1 创建 `src/background.js` —— 初始化 service worker，设置 `chrome.sidePanel.setPanelBehavior({openPanelOnActionClick: true})`
- [x] 2.2 实现请求环形缓冲区（最多 200 条），数据结构 `Map<requestId, {method, url, path, status?, timestamp}>`
- [x] 2.3 添加 `webRequest.onBeforeRequest` 监听器 —— 捕获方法 + URL 路径 + requestId，仅过滤活跃标签页
- [x] 2.4 添加 `webRequest.onCompleted` 监听器 —— 按 requestId 匹配缓冲区条目，附加状态码
- [x] 2.5 实现消息路由：处理 `QUERY_REQUESTS`（返回完整缓冲区）、`REQUEST_COMPLETED`（推送到面板）、`QUERY_TAB_URL`、`QUERY_COOKIES`、`ADD_HEADER`、`REMOVE_HEADER`、`GET_HEADERS`
- [x] 2.6 实现 `tabs.onActivated` 监听器 —— 响应标签页切换 (a) 清除/推送新标签页上下文到面板，(b) 更新 declarativeNetRequest 规则到新 tabId

## 3. 请求头管理（declarativeNetRequest）

- [x] 3.1 创建 `src/headerManager.js` —— 管理 DNR 动态规则的模块（添加、更新、删除）
- [x] 3.2 实现 `applyHeaders(tabId, headers)` —— 生成带 `condition.tabIds: [tabId]` 的 DNR 规则，调用 `updateDynamicRules`
- [x] 3.3 实现 `clearHeadersForTab(tabId)` —— 移除与指定 tabId 关联的所有 DNR 规则
- [x] 3.4 实现 `persistHeaders(headers)` / `loadHeaders()` —— 读写 header 配置到 `chrome.storage.local`
- [x] 3.5 将 header 管理器接入 background service worker 的消息处理

## 4. Cookie 监控

- [x] 4.1 实现 `getCookiesForUrl(url)` 辅助函数 —— 调用 `chrome.cookies.getAll({url})`，返回数量及类型分类
- [x] 4.2 将 cookie 查询接入 service worker 中的 `QUERY_COOKIES` 消息处理
- [x] 4.3 在标签页激活和面板打开时触发 cookie 刷新

## 5. 侧边栏面板 UI

- [x] 5.1 创建 `src/panel/panel.html` —— HTML 结构：头部（关闭按钮 + URL 栏）、请求列表表格、Cookie 区域、请求头管理表单
- [x] 5.2 创建 `src/panel/panel.css` —— 样式：固定宽度面板（~400px）、等宽字体列表、状态码颜色编码（200=绿色、3xx=蓝色、4xx=橙色、5xx=红色）、可滚动请求区域
- [x] 5.3 创建 `src/panel/panel.js` —— 连接 service worker，加载时发送 `QUERY_REQUESTS`，监听 `REQUEST_COMPLETED` 推送消息
- [x] 5.4 实现请求列表渲染 —— 追加新行，新请求时滚动到底部
- [x] 5.5 实现 cookie 展示更新，区分类型（Session vs Persistent）
- [x] 5.6 实现请求头管理 UI —— 输入框（名称 + 值）配"添加"按钮，请求头列表每项带"删除"按钮
- [x] 5.7 实现关闭按钮行为 —— `window.close()`

## 6. 集成与打磨

- [x] 6.1 在 manifest.json 中将侧边栏 `side_panel` 入口指向 `src/panel/panel.html`
- [ ] 6.2 端到端测试：安装插件，点击工具栏图标，导航到测试页面，验证请求出现在面板中
- [ ] 6.3 测试请求头注入：添加 `X-Test: hello`，验证请求头在发出的请求中（通过测试页面或浏览器 DevTools）
- [ ] 6.4 测试 Cookie 展示：导航到有 Cookie 的网站，验证数量与 DevTools Cookie 面板一致
- [ ] 6.5 测试标签页切换：打开面板，切换标签页，验证面板更新 URL 并清除旧标签页的请求
