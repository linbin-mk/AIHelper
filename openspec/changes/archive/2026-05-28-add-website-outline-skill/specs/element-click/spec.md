## ADDED Requirements

### Requirement: 通用元素点击工具
系统 SHALL 提供 `click_element` 工具，接受 `selector`（CSS 选择器）参数，在活跃标签页的 MAIN world 中定位元素并执行点击，返回操作结果。

#### Scenario: 成功点击可见元素
- **WHEN** AI 调用 `click_element` 传入 `{selector: ".nav-item[data-key='users']"}`
- **THEN** 系统注入 Content Script 执行 `document.querySelector(".nav-item[data-key='users']")`
- **AND** 找到的元素调用 `scrollIntoView({block: 'center'})` 滚动到可见区域
- **AND** 调用 `element.click()` 触发点击
- **AND** 返回 `{success: true, elementText: "用户管理", pageChanged: true, selector: ".nav-item[data-key='users']"}`

### Requirement: 点击结果检测
`click_element` 的返回结果 SHALL 包含 `pageChanged` 布尔值字段，指示点击后页面是否发生了导航变化（URL 变化、DOM 显著变化或 `window.onbeforeunload` 触发）。

#### Scenario: 检测到页面导航变化
- **WHEN** 点击导航链接后页面 URL 发生变化（通过比较点击前后的 `window.location.href`）
- **THEN** `pageChanged` 返回 `true`，AI 应等待页面加载完成后重新获取元素列表

#### Scenario: 未检测到导航变化
- **WHEN** 点击按钮后页面 URL 未变且 2 秒内无 DOM 显著变化
- **THEN** `pageChanged` 返回 `false`，AI 继续当前页面的探索（可能是展开的子菜单或模态框）

### Requirement: 点击等待与超时
系统 SHALL 在点击后等待最多 `timeout` 毫秒（默认 3000ms）以检测页面变化，超时后返回当前结果。

#### Scenario: 点击后页面在超时时间内加载完成
- **WHEN** 点击导航链接后 1500ms 内检测到 URL 变化
- **THEN** 系统在 1500ms 时返回结果，不等待完整 `timeout`

#### Scenario: 点击后超时未检测到变化
- **WHEN** 点击按钮后 `timeout`（3000ms）内无任何变化
- **THEN** 返回 `{success: true, elementText: "...", pageChanged: false}`

### Requirement: 选择器匹配失败处理
当 `document.querySelector(selector)` 返回 `null` 时，系统 SHALL 返回明确的错误信息。

#### Scenario: 选择器未匹配任何元素
- **WHEN** 传入的 `selector` 在当前页面 DOM 中无匹配元素
- **THEN** 返回 `{success: false, error: "selector_not_found", message: "未找到匹配元素: <selector>", selector: "<selector>"}`

#### Scenario: 选择器匹配多个元素
- **WHEN** 传入的 `selector` 匹配多个元素（如 `.nav-item` 匹配 10 个元素）
- **THEN** 系统点击第一个匹配元素（`querySelector` 默认行为），并在结果中标注 `matchedCount: 10`

### Requirement: Content Script 注入方式
系统 SHALL 使用 `chrome.scripting.executeScript` 注入点击逻辑函数，在标签页的 MAIN world 执行以确保 `click()` 能触发页面的事件处理器。

#### Scenario: 通过 executeScript 注入点击逻辑
- **WHEN** background.js 收到 `CLICK_ELEMENT` 消息且 `tabId` 有效
- **THEN** 调用 `chrome.scripting.executeScript({target: {tabId}, func: clickElementFunc, args: [selector, timeout]})`
- **AND** 将执行结果通过 `sendResponse` 返回

#### Scenario: 注入失败
- **WHEN** `chrome.scripting.executeScript` 失败（如活跃标签页不可用）
- **THEN** 返回 `{success: false, error: "inject_failed", message: "<错误详情>"}`

### Requirement: 安全约束
`click_element` SHALL 在注入脚本中可选地检查目标元素文本是否匹配危险操作关键词，并拒绝执行。此检查可在 AI 侧的 Skill Prompt 中处理，也可由 Content Script 辅助检查。

#### Scenario: AI 侧安全过滤
- **WHEN** AI 判断元素 `text` 包含"删除"、"登出"、"退出"等危险关键词
- **THEN** AI 不调用 `click_element`，在探索记录中标记"已跳过危险按钮"

#### Scenario: Content Script 辅助检查
- **WHEN** Content Script 检测到目标元素的 `textContent` 匹配危险关键词正则
- **THEN** 返回 `{success: false, warning: "dangerous_action", message: "元素文本包含危险关键词，已拒绝执行: <text>"}`
