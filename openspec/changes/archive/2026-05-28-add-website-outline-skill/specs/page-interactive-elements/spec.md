## ADDED Requirements

### Requirement: 提取页面可交互元素
系统 SHALL 提供 `get_page_interactive_elements` 工具，通过注入 Content Script 到活跃标签页，提取所有可见可交互元素并返回结构化 JSON 数组。

#### Scenario: 成功提取页面元素
- **WHEN** AI 调用 `get_page_interactive_elements` 且当前活跃标签页 URL 为 `https://example.com/admin`
- **THEN** 系统在标签页中注入脚本，使用 `document.querySelectorAll` 查询所有 `a, button, [role="button"], [role="menuitem"], [role="tab"], [role="link"], [onclick], input[type="submit"], input[type="button"], .nav-item, .menu-item, [class*="nav"], [class*="menu"], [class*="tab"], [class*="sidebar"]` 元素
- **AND** 过滤掉 `display:none`、`visibility:hidden`、`rect` 尺寸为 0 的元素
- **AND** 返回每个元素的 `{tagName, text, selector, rect: {x,y,width,height}, role, href, type, isVisible}`

#### Scenario: 生成唯一选择器
- **WHEN** 提取的元素具有 `id` 属性
- **THEN** `selector` 使用 `#id` 格式作为选择器
- **AND** 当元素无 `id` 时，使用 tagName + 唯一属性组合（如 `button[data-testid="save"]`、`a[href="/users"]` 等）生成选择器

#### Scenario: 限制返回元素数量
- **WHEN** 页面可交互元素超过 100 个
- **THEN** 系统仅返回前 100 个元素（按 DOM 顺序），优先保留 `role` 为 `navigation`、`menubar`、`tablist`、`tab`、`menuitem` 等语义化元素

#### Scenario: 页面无可见交互元素
- **WHEN** 页面没有任何可见的交互元素（所有元素被隐藏或页面为空）
- **THEN** 返回 `{elements: [], count: 0, url: "<当前 URL>", title: "<页面标题>"}`

#### Scenario: 页面加载中或错误
- **WHEN** Content Script 注入失败（如 CSP 限制）
- **THEN** 返回 `{error: "inject_failed", message: "<错误详情>"}`

### Requirement: 元素信息格式
每个提取的元素 SHALL 包含以下字段：`tagName`（标签名）、`text`（可见文本内容，截断至 80 字符）、`selector`（CSS 选择器）、`rect`（`{x, y, width, height}` 坐标）、`role`（ARIA role 或空字符串）、`href`（仅链接有，截断至 200 字符）、`type`（按钮类型）、`isVisible`（布尔值）。元素列表含 URL 和 title 元信息。

#### Scenario: 元素含全量字段
- **WHEN** 系统提取一个 `<a href="/users" role="menuitem">用户管理</a>` 元素
- **THEN** 返回 `{tagName: "a", text: "用户管理", selector: "a[href='/users']", rect: {x:0, y:100, width:200, height:40}, role: "menuitem", href: "/users", type: "", isVisible: true}`

#### Scenario: 文本内容截断
- **WHEN** 元素文本内容超过 80 个字符
- **THEN** `text` 字段截断至 80 字符并追加 "..."

### Requirement: Content Script 执行方式
系统 SHALL 使用 `chrome.scripting.executeScript` 以 `func` 参数形式执行元素提取逻辑，而非注入持久 Content Script 文件。错误时返回友好错误信息。

#### Scenario: 通过 executeScript 即时注入
- **WHEN** background.js 收到 `GET_PAGE_INTERACTIVE_ELEMENTS` 消息
- **THEN** 调用 `chrome.scripting.executeScript({target: {tabId}, func: extractInteractiveElements})`，在 MAIN world 执行
- **AND** 将结果通过 `sendResponse` 返回给 panel

#### Scenario: 注入失败时的回退
- **WHEN** `chrome.scripting.executeScript` 因 CSP 或其他错误失败
- **THEN** 系统返回 `{error: "inject_failed", message: chrome.runtime.lastError.message}`
