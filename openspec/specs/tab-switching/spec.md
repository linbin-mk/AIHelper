## Requirements
### Requirement: AI 可导航当前标签页到指定 URL

系统 SHALL 提供一个 `navigate_to_url` 工具，允许 AI 将当前活跃标签页导航到指定 URL。工具必须接受一个 URL 参数，成功时返回目标 tab 的 tabId、URL 和标题。

#### Scenario: 导航到有效 URL
- **WHEN** AI 调用 `navigate_to_url` 并传入 `url: "https://www.github.com"`
- **THEN** 当前标签页导航到 `https://www.github.com`，返回 `{ success: true, tabId, url, title }`

#### Scenario: 导航到无效 URL 格式
- **WHEN** AI 调用 `navigate_to_url` 并传入 `url: "not-a-valid-url"`
- **THEN** 返回 `{ success: false, error: "无效的 URL 格式" }`

### Requirement: AI 可打开新标签页

系统 SHALL 提供一个 `open_new_tab` 工具，允许 AI 在当前窗口中打开新标签页并导航到指定 URL。工具必须接受一个 URL 参数，返回新标签页的 tabId、URL 和标题。

#### Scenario: 打开新标签页
- **WHEN** AI 调用 `open_new_tab` 并传入 `url: "https://www.google.com"`
- **THEN** 系统在当前窗口打开新标签页并导航到该 URL，返回 `{ success: true, tabId, url, title }`，新标签页成为活跃标签页

#### Scenario: 打开新标签页不指定 URL
- **WHEN** AI 调用 `open_new_tab` 并传入 `url: ""`
- **THEN** 系统打开新标签页（显示新标签页默认内容），返回 `{ success: true, tabId, url: "", title: "" }`

### Requirement: AI 可切换到指定标签页

系统 SHALL 提供一个 `switch_to_tab` 工具，允许 AI 切换到指定标签页。工具必须接受 `tabId` 或 `urlPattern` 参数（至少提供一个）。如果通过 `urlPattern` 匹配到多个标签页，应切换到第一个匹配的标签页。

#### Scenario: 通过 tabId 切换
- **WHEN** AI 调用 `switch_to_tab` 并传入 `tabId: 123`
- **THEN** 浏览器激活 tabId 为 123 的标签页，返回 `{ success: true, tabId, url, title }`

#### Scenario: 通过 URL 匹配切换
- **WHEN** AI 调用 `switch_to_tab` 并传入 `urlPattern: "github.com"`
- **THEN** 浏览器切换到第一个 URL 包含 "github.com" 的标签页，返回 `{ success: true, tabId, url, title }`

#### Scenario: 未找到匹配标签页
- **WHEN** AI 调用 `switch_to_tab` 并传入 `tabId: 99999`（不存在的 tabId）
- **THEN** 返回 `{ success: false, error: "未找到指定标签页" }`

### Requirement: AI 可关闭指定标签页

系统 SHALL 提供一个 `close_tab` 工具，允许 AI 关闭指定标签页。工具必须接受 `tabId` 参数。系统不得关闭窗口中的最后一个标签页，以防止浏览器窗口关闭。

#### Scenario: 关闭指定标签页
- **WHEN** AI 调用 `close_tab` 并传入 `tabId: 123`
- **THEN** 系统关闭该标签页，返回 `{ success: true, message: "标签页已关闭" }`

#### Scenario: 尝试关闭唯一标签页
- **WHEN** AI 调用 `close_tab` 并传入当前窗口中唯一标签页的 tabId
- **THEN** 返回 `{ success: false, error: "不能关闭唯一的标签页" }`，标签页未被关闭

### Requirement: AI 可列出所有打开的标签页

系统 SHALL 提供一个 `list_tabs` 工具，允许 AI 获取当前窗口中所有标签页的信息。工具无必需参数，返回标签页数组，每个元素包含 `tabId`、`url`、`title`、`active`（是否为当前活跃标签页）。

#### Scenario: 列出当前窗口所有标签页
- **WHEN** AI 调用 `list_tabs` 不传入参数
- **THEN** 返回 `{ success: true, tabs: [{ tabId, url, title, active }, ...] }`，其中 `tabs` 是当前窗口所有标签页的数组

### Requirement: 切换到聊天 Tab 时保护运行中的 Agent Loop
当用户通过 Tab 切换回到聊天面板时，系统 SHALL 检查 Agent Loop 是否正在运行。如果 Agent Loop 正在运行，SHALL 跳过 DOM 清空重建以保护进行中的交互卡片；否则按正常流程刷新聊天视图。

#### Scenario: Agent Loop 运行中切回聊天 Tab 保留 DOM
- **WHEN** Agent Loop 运行中且 `_isSending === true`
- **AND** 用户点击聊天 Tab 按钮
- **THEN** `switchTab('chat')` 正常执行，显示聊天面板
- **AND** `refreshChatView` 检测到 `_isSending === true`，不调用 `renderChatMessages`
- **AND** 聊天面板中先前的 DOM 保持不变

#### Scenario: Agent Loop 空闲时切回聊天 Tab 正常刷新
- **WHEN** Agent Loop 未运行且 `_isSending === false`
- **AND** 用户点击聊天 Tab 按钮
- **THEN** `switchTab('chat')` 正常执行，显示聊天面板
- **AND** `refreshChatView` 正常调用 `renderChatMessages` 从消息数据重建视图

