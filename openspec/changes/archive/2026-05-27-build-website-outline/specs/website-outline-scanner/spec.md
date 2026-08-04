## ADDED Requirements

### Requirement: Content Script 双模式注入
系统 SHALL 提供一个 `chrome-extension/src/content/outline-scanner.js` Content Script，支持两种运行模式：`scan`（导航扫描）和 `capture`（页面功能捕获），通过 Background 调用 `chrome.scripting.executeScript` 时注入。

#### Scenario: Background 注入 Scan 模式
- **WHEN** Background 接收到 `SCAN_NAVIGATION` 消息类型
- **THEN** 调用 `handleInjectScript(activeTabId, 'src/content/outline-scanner.js')` 注入脚本
- **AND** Content Script 以 `scan` 模式运行

#### Scenario: Background 注入 Capture 模式
- **WHEN** Background 接收到 `CAPTURE_PAGE_SECTION` 消息类型
- **THEN** 调用 `handleInjectScript(activeTabId, 'src/content/outline-scanner.js')` 注入脚本
- **AND** Content Script 以 `capture` 模式运行

### Requirement: 导航菜单识别（Scan 模式）
Content Script 在 `scan` 模式下 SHALL 通过优先级链识别页面主导航菜单，返回结构化的导航项列表。

识别优先级：
1. `<nav>` 标签内的链接（`<a href>`）
2. `[role="navigation"]` 内的链接
3. 常见导航 CSS class 内的链接：`.nav`, `.navbar`, `.sidebar-nav`, `.sidebar`, `.menu`, `.el-menu`, `.ant-menu`, `.arco-menu`
4. 页面上方密度最高的链接区域（回退策略）

每个导航项 MUST 包含 `text`（链接显示文本）、`href`（可选）、`selector`（CSS 路径）、`type`（`nav`/`tab`/`sidebar`）。

#### Scenario: 识别语义化 <nav>
- **WHEN** 页面 DOM 包含 `<nav><a href="/home">首页</a><a href="/about">关于</a></nav>`
- **THEN** 返回 `{items: [{text: "首页", href: "/home", selector: "...", type: "nav"}, {text: "关于", href: "/about", selector: "...", type: "nav"}]}`

#### Scenario: 识别 Element UI 导航
- **WHEN** 页面 DOM 包含 `<ul class="el-menu"><li class="el-menu-item"><a>仪表盘</a></li></ul>`
- **THEN** 由 `.el-menu` class 匹配识别到导航容器，返回对应导航项

#### Scenario: 识别侧边栏导航
- **WHEN** 页面 DOM 包含 `<div class="sidebar-nav"><a href="/users">用户</a></div>`
- **THEN** 返回 `type: "sidebar"` 标记的导航项

#### Scenario: 回退策略 - 无已知导航容器
- **WHEN** 页面 DOM 中不存在语义标签、ARIA role 或已知 CSS class 的导航容器
- **THEN** Content Script 在页面顶部 200px 高度范围内查找链接密度最高的区域作为候选导航
- **AND** 如果候选区域链接数 >= 3 则返回该区域内的链接作为导航项
- **AND** 如果候选区域链接数 < 3 则返回 `{items: [], message: "未检测到导航菜单"}`

#### Scenario: 过滤非功能导航链接
- **WHEN** 导航区域内包含"登录"、"注册"、"退出"、"首页"/"Home"、"Logo" 链接
- **THEN** 这些通用导航链接被自动过滤，不出现在返回的导航项列表中

#### Scenario: 导航项数量限制
- **WHEN** 扫描到的导航项超过 30 个
- **THEN** 仅返回前 30 个导航项
- **AND** 返回结果中包含 `truncated: true` 标记

### Requirement: 页面功能捕获（Capture 模式）
Content Script 在 `capture` 模式下 SHALL 提取当前页面的功能摘要信息。

提取内容包括：
- `title`：`document.title`
- `url`：`window.location.href`
- `headings`：页面上所有 `h1`-`h3` 标签的文本（去重，最多 10 个）
- `actions`：页面上可见的功能性按钮/链接，提取其文本和内联 `href`（过滤导航类元素，最多 15 个），每个包含 `text` 和 `href`（可选）
- `forms`：页面上可见表单的概要描述，每个描述由表单内 label 文本组合而成（最多 5 个表单）

#### Scenario: 捕获有明确标题和操作按钮的页面
- **WHEN** Content Script 注入到一个包含标题"用户管理"和按钮"新增用户"、"导出"的页面
- **THEN** 返回 `{title: "用户管理", headings: ["用户管理"], actions: [{text: "新增用户"}, {text: "导出"}], forms: [], url: "..."}`

#### Scenario: 捕获包含表单的页面
- **WHEN** 页面包含表单，内有 label 为"用户名"、"邮箱"的输入框
- **THEN** 返回 `forms: ["包含字段: 用户名, 邮箱"]`

#### Scenario: 过滤副作用元素
- **WHEN** 页面包含导航栏、页脚、社交分享、评论区等非功能元素
- **THEN** 这些区域的按钮/链接不出现在 `actions` 中

### Requirement: 消息通信规范
Content Script `outline-scanner.js` SHALL 通过 `chrome.runtime.sendMessage` 将扫描或捕获结果发送到 Background，而后由 Background 转发到 Panel。消息类型定义如下：

- Scan 结果消息类型：`OUTLINE_SCAN_RESULT`，data 包含 `{items: [...], truncated: false}`
- Capture 结果消息类型：`OUTLINE_CAPTURE_RESULT`，data 包含 `{title, url, headings, actions, forms}`
- 错误消息类型：`OUTLINE_SCAN_ERROR` / `OUTLINE_CAPTURE_ERROR`，data 包含 `{error, message}`

#### Scenario: Scan 结果通过 Background 转发
- **WHEN** Content Script 完成导航扫描后调用 `sendMessage({type: 'OUTLINE_SCAN_RESULT', data: {...}})`
- **THEN** Background 收到消息后通过 `sendToPanel('OUTLINE_SCAN_RESULT', data)` 转发给 Panel

#### Scenario: Capture 超时错误
- **WHEN** Content Script 注入后 3 秒内未完成 DOM 提取
- **THEN** 返回 `{error: "timeout", message: "页面内容提取超时"}` 对应的错误消息
