## ADDED Requirements

### Requirement: AI 可调用 click_element 工具
系统 SHALL 在 `TOOLS` 数组中注册 `click_element` 工具，AI 调用后通过 `CLICK_ELEMENT` 消息路由点击页面上的指定元素。

工具定义 SHALL 包含参数：
- `selector`（string，必填）：目标元素的 CSS 选择器
- `timeout`（number，可选）：等待页面变化的超时毫秒数，默认 3000

#### Scenario: 工具注册
- **WHEN** AI 获取工具列表
- **THEN** 工具列表包含 `click_element`，必填参数为 `selector`，可选参数为 `timeout`

#### Scenario: 成功点击元素
- **WHEN** AI 调用 `click_element({ selector: ".nav-item > a" })` 且选择器匹配到可见元素
- **THEN** 系统注入 `element-click.js` 执行点击，返回 `{ success: true, elementText, pageChanged: true/false, selector, matchedCount }`

#### Scenario: 选择器未匹配元素
- **WHEN** AI 调用 `click_element({ selector: ".non-existent" })` 且选择器不匹配任何元素
- **THEN** 返回 `{ success: false, error: "selector_not_found", message: "未找到匹配元素: .non-existent", selector }`

#### Scenario: 危险操作拒绝
- **WHEN** 目标元素文本包含危险关键词（删除、注销、退出、清空等）
- **THEN** 系统拒绝点击，返回 `{ success: false, warning: "dangerous_action", message: "元素文本包含危险关键词，已拒绝执行" }`

#### Scenario: 无活动标签页
- **WHEN** AI 调用 `click_element` 但无活动标签页
- **THEN** 返回错误 `{ error: "no_active_tab", message: "没有活跃标签页" }`

#### Scenario: 等待超时未收到结果
- **WHEN** 点击指令已注入页面但 30 秒内未收到 `CLICK_ELEMENT_RESULT`
- **THEN** 工具返回 `{ error: "timeout", message: "未在30秒内收到点击结果" }`

### Requirement: click_element 通过异步监听获取结果
`click_element` 工具 SHALL 采用两阶段通信模式：先通过 `sendMessage({ type: 'CLICK_ELEMENT' })` 发送点击指令并接收 ACK，然后通过一次性 `chrome.runtime.onMessage` 监听器捕获 `CLICK_ELEMENT_RESULT` 的结果。

#### Scenario: 异步结果等待
- **WHEN** `click_element` handler 发送 CLICK_ELEMENT 消息并收到 ACK
- **THEN** handler 注册一次性 onMessage 监听器等待 CLICK_ELEMENT_RESULT，超时 30s 后 resolve 或 reject
