## 为什么

AI 调试和 API 测试工作流需要能看清当前页面发出了哪些 HTTP 请求。开发者需要一个 Chrome 插件，可以实时捕获所有网络请求，在持久化的控制面板中展示，并支持请求头挟持 —— 无需在 DevTools 各标签页之间来回切换。

## 变更内容

- 新建 Chrome 插件（Manifest V3），提供持久化的侧边栏面板 UI
- 实时捕获当前页面的所有 XHR/fetch 网络请求
- 面板展示：当前页面 URL、请求列表（方法、路径、状态码）、Cookie 数量、已挟持的请求头
- 请求头挟持能力 —— 向发出的请求中注入自定义请求头（如 Authorization、X-Token）

## 功能模块

### 新增模块
- `control-panel`：持久化的侧边栏面板 UI，展示当前页面 URL、捕获的请求、Cookie 信息、请求头挟持状态
- `request-capture`：实时监控并捕获当前页面发出的所有网络请求（XHR、fetch），包括请求方法、URL 路径和 HTTP 状态码
- `header-management`：拦截并修改请求头 —— 通过 declarativeNetRequest 规则向发出的请求中注入自定义请求头（如 Authorization、X-Token）

### 修改的模块
<!-- 无需修改已有模块 -->

## 影响范围

- 新建 `chrome-extension/` 目录，包含 manifest.json、background service worker、侧边栏 HTML/JS/CSS
- 需要 Chrome 插件权限：`sidePanel`、`webRequest`、`declarativeNetRequest`、`storage`、`activeTab`、`cookies`
- 通过 `webRequest` API 实时跟踪捕获请求
- 开发依赖：无（纯 JS + Chrome Extension API，无需打包工具）
