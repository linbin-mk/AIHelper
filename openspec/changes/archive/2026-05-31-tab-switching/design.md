## Context

当前 AI 工具系统（`shared/chat.js`）已包含页面交互工具（点击元素、填写输入框、读取页面上下文等），这些工具通过 `chrome.runtime.sendMessage()` → `background.js` → content script 注入模式工作。但缺少 tab/page 导航能力。

Chrome Extension API 提供 `chrome.tabs.update/create/query/remove`，Firefox 对应的 `browser.tabs` API 结构一致。扩展已有 `activeTab` 权限（Chrome）和 `tabs` 权限（Firefox）。

## Goals / Non-Goals

**Goals:**
- AI 可通过工具导航当前标签页到指定 URL
- AI 可打开新标签页、切换到已有标签页、关闭标签页、列出所有标签页
- Chrome 和 Firefox 均支持相同功能
- 工具遵循现有消息传递模式（chat.js → sendMessage → background → tab API）

**Non-Goals:**
- 不在 Firefox 中关闭最后一个标签页（防止窗口关闭）
- 不操作其他窗口的标签页（仅限当前窗口）
- 不处理 iframe 导航或 history pushState
- 不新增浏览器权限声明

## Decisions

### Decision 1: 使用现有消息传递模式

通过 `chrome.runtime.sendMessage` 从 chat.js 发送消息到 background.js，在 background 中调用 tab API。

- **理由**: 与现有 `get_page_context`、`click_element`、`refresh_page` 等工具的模式一致，无需引入新机制。
- **替代方案**: 直接在 chat.js 调用 `chrome.tabs.*` API。不可行，因为 Side Panel / popup 页面的权限限制。

### Decision 2: 每个 tab 操作定义为独立工具

5 个独立工具（navigate_to_url、open_new_tab、switch_to_tab、close_tab、list_tabs），而非一个通用 `tab_control` 工具。

- **理由**: 独立工具更符合 OpenAI function-calling 规范，LLM 更准确地选择和调用，参数更明确。
- **替代方案**: 一个 `tab_action` 工具带 `action` 参数。增加 LLM 选择错误的概率。

### Decision 3: Tab 识别同时支持 tabId 和 URL 匹配

`switch_to_tab` 接受 `tabId`（精确）或 `urlPattern`（包含匹配），`close_tab` 仅接受 `tabId`。

- **理由**: `switch_to_tab` 的常见场景是"切换到 GitHub 的那个标签页"，URL 匹配更自然。关闭标签页涉及破坏性操作，要求显式 tabId 更安全。
- **替代方案**: 全部用 `tabId`。对 LLM 不友好，需要先调用 `list_tabs` 再切换。

### Decision 4: 工具结果返回结构化信息

每个工具返回至少包含 `success: boolean`、`tabId`（适用时）、`url`、`title`。`list_tabs` 返回完整标签页数组。

- **理由**: AI 可基于返回信息做后续决策（如切换到返回的 tabId）。

## Risks / Trade-offs

- **[风险] AI 可能导航到恶意 URL** → chat.js 的系统 prompt（AGENTS.md）中已包含安全约束，且浏览器自身有安全防护（CORS、XSS 过滤）。可在工具描述中强调"不要导航到非用户预期的 URL"。
- **[风险] 误关闭重要标签页** → `close_tab` 不关闭最后一个标签页，且要求显式 tabId。返回确认信息让 AI 知晓操作结果。
- **[风险] 页面加载等待** → `navigate_to_url` 和 `open_new_tab` 使用 `tabs.update`/`tabs.create` 的 callback 确认 tab 已更新，但不等待页面完全加载。AI 可后续调用 `get_page_context` 确认加载状态。
