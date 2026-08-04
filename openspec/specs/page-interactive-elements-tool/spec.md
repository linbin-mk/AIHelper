## Requirements

### Requirement: AI 可调用 get_page_interactive_elements 工具
系统 SHALL 在 `TOOLS` 数组中注册 `get_page_interactive_elements` 工具，AI 调用后通过 `GET_PAGE_INTERACTIVE_ELEMENTS` 消息路由获取当前页面所有可见可交互元素。

工具定义 SHALL 包含描述："获取当前页面所有可见可交互元素（链接、按钮、菜单项等），返回元素列表，每项包含 tagName、文本、CSS选择器、坐标、角色、链接等信息，最多返回 100 个元素"。

#### Scenario: 工具注册
- **WHEN** AI 获取工具列表
- **THEN** 工具列表包含 `get_page_interactive_elements`，无必填参数

#### Scenario: 成功获取元素列表
- **WHEN** AI 调用 `get_page_interactive_elements` 且当前有活动标签页
- **THEN** 系统注入 `page-interactive-elements.js`，返回 `{ url, title, elements: [{tagName, text, selector, rect: {x,y,width,height}, role, href, type, isVisible}], count }`

#### Scenario: 无活动标签页
- **WHEN** AI 调用 `get_page_interactive_elements` 但无活动标签页
- **THEN** 返回错误 `{ error: "no_active_tab", message: "未找到活动标签页" }`

### Requirement: 工具通过 executeToolCall 分发
`get_page_interactive_elements` 工具 SHALL 在 `executeToolCall()` 函数中通过 `if (name === 'get_page_interactive_elements')` 分支处理。

#### Scenario: 工具调用路由
- **WHEN** AI 调用 `get_page_interactive_elements`
- **THEN** `executeToolCall` 匹配到对应分支，通过 `sendMessage` 发送 `GET_PAGE_INTERACTIVE_ELEMENTS` 到 background.js
