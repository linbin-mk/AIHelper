## Requirements
### Requirement: AI 可以调用 displayTable 工具展示表格数据
系统 SHALL 提供一个 `displayTable` 工具，AI 模型可通过 function calling 调用此工具，在前端聊天面板中渲染一张表格卡片。卡片使用 `<table>` 展示列头和行数据，支持纯展示模式和可点击行模式。

#### Scenario: AI 调用 displayTable 展示纯表格数据
- **WHEN** AI 调用 `displayTable` 工具，参数为 `{title: "测试结果汇总", columns: ["用例名称", "状态", "耗时"], rows: [["登录测试", "通过", "120ms"], ["注册测试", "通过", "85ms"], ["搜索测试", "失败", "超时"]]}`
- **THEN** 聊天面板中插入一张表格卡片，表头显示"📊 测试结果汇总"，下方为三列（用例名称、状态、耗时）三行的表格，可滚动查看

#### Scenario: 表格卡片自动标记长内容
- **WHEN** 表格行数超过 20 行
- **THEN** 表格容器设置 `max-height: 400px` 和 `overflow-y: auto`，内容可垂直滚动而不撑破面板

#### Scenario: 表格内容纯文本渲染防止 XSS
- **WHEN** AI 调用 `displayTable` 且表格数据中包含 HTML 标签（如 `"<script>alert(1)</script>"`）
- **THEN** 表格内容以纯文本 `textContent` 渲染，不执行脚本，标签文字原样显示

#### Scenario: AI 调用 displayTable 展示可点击行表格
- **WHEN** AI 调用 `displayTable` 工具，参数为 `{title: "选择接口", columns: ["方法", "路径", "描述"], rows: [["GET", "/api/users", "用户列表"], ["POST", "/api/users", "创建用户"], ["GET", "/api/orders", "订单列表"]], clickable: true}`
- **THEN** 聊天面板中插入一张表格卡片，三行数据均有 hover 高亮效果（`cursor: pointer`），行边缘有 `--ctp-blue` 边框提示可点击

#### Scenario: 用户点击可点击表格的行
- **WHEN** 用户在 `clickable` 表格中点击第三行（"GET"、"/api/orders"、"订单列表"）
- **THEN** 卡片进入锁定状态（所有行变灰不可点击），Agent Loop 恢复执行，`executeToolCall` 返回 `{selected: ["GET", "/api/orders", "订单列表"]}`

#### Scenario: 用户在非 clickable 表格中点击行
- **WHEN** 用户在非 `clickable` 表格中点击任意行
- **THEN** 无响应，行无 hover 效果，`executeToolCall` 在卡片渲染后立即返回 `{displayed: true}`，Agent 继续执行

#### Scenario: 可点击表格展示时停止按钮终止 Agent
- **WHEN** 可点击表格正在等待用户选择行，且用户点击聊天面板的"停止"按钮
- **THEN** Agent Loop 终止，表格中所有行变灰不可点击（`pointer-events: none`, `opacity: 0.5`），卡片保留在聊天界面中

### Requirement: 表格卡片应符合 Catppuccin 主题风格
表格卡片 SHALL 在视觉风格上与现有的询问卡片、授权卡片保持一致，使用 Catppuccin 配色变量，并支持深色/浅色主题自动切换。

#### Scenario: 深色主题下渲染表格卡片
- **WHEN** 当前主题为深色模式
- **THEN** 表格卡片使用深色背景 (`var(--ctp-mantle)`)、文字颜色 (`var(--ctp-text)`)，左边框为蓝色 (`3px solid var(--ctp-blue)`)，表头行背景 (`var(--ctp-crust)`)，表格行交替背景 (`var(--ctp-surface0)` / `var(--ctp-surface1)`) 用于斑马纹

#### Scenario: 浅色主题下渲染表格卡片
- **WHEN** 当前主题为浅色模式
- **THEN** 表格卡片使用浅色背景和对应 Catppuccin 浅色变量，文字对比度足够

### Requirement: displayTable 工具定义需发送给 AI 模型
系统 SHALL 在 TOOLS 数组中包含 `displayTable` 的工具定义。工具参数包含 `title`（必填，string）、`columns`（必填，string[]）、`rows`（必填，string[][]）、`clickable`（选填，boolean，默认 false）。

#### Scenario: AI 在系统提示中找到 displayTable 工具
- **WHEN** 构建 `/v1/chat/completions` 请求时
- **THEN** 请求的 `tools` 数组包含 `displayTable` 工具定义，其 `parameters` 包含 `title`（type: string, required）、`columns`（type: array of strings, required）、`rows`（type: array of arrays of strings, required）、`clickable`（type: boolean）

### Requirement: 历史会话中恢复表格卡片
当 `renderChatMessages` 重建聊天历史时，遇到 `display_table` 工具调用的消息 SHALL 从工具调用参数中提取表格数据并重建表格卡片，历史表格以只读模式展示（行不可点击选择）。

#### Scenario: 切换历史会话时看到之前的表格卡片
- **WHEN** 用户切换到包含 `display_table` 工具调用的历史会话
- **AND** `renderChatMessages` 处理该消息的 tool_calls
- **THEN** 渲染一张表格卡片，显示标题、列头和所有行数据
- **AND** 表格数据完整可读，可滚动查看
- **AND** 即使是可点击表格（`clickable: true`），历史恢复后行不可点击（只读模式）

#### Scenario: 历史表格卡片保持完整数据
- **WHEN** 历史消息中 `display_table` 包含 50 行数据
- **AND** `renderChatMessages` 重建表格卡片
- **THEN** 50 行数据全部渲染，表格容器设置 `max-height` 和滚动

