## Requirements

### Requirement: AI 可调用 input_text 工具
系统 SHALL 在 `TOOLS` 数组中注册 `input_text` 工具，AI 调用后通过 `INPUT_TEXT` 消息路由向页面上的输入元素写入文本内容。

工具定义 SHALL 包含参数：
- `selector`（string，必填）：目标输入元素的 CSS 选择器
- `text`（string，必填）：要写入的文本内容

#### Scenario: 工具注册
- **WHEN** AI 获取工具列表
- **THEN** 工具列表包含 `input_text`，必填参数为 `selector` 和 `text`

#### Scenario: 成功向 input 元素输入文本
- **WHEN** AI 调用 `input_text({ selector: "#username", text: "admin" })` 且选择器匹配到一个 input 元素
- **THEN** 系统注入 `element-input.js`，将元素 value 设置为 "admin"，触发 input 和 change 事件，返回 `{ success: true, elementTag: "input", valueCheck: "matched", matchedCount: 1 }`

#### Scenario: 成功向 textarea 元素输入文本
- **WHEN** AI 调用 `input_text({ selector: "textarea.comment", text: "Hello" })` 且选择器匹配到一个 textarea 元素
- **THEN** 系统注入 `element-input.js`，将元素 value 设置为 "Hello"，触发 input 和 change 事件，返回 `{ success: true, elementTag: "textarea", valueCheck: "matched", matchedCount: 1 }`

#### Scenario: 成功向 contenteditable 元素输入文本
- **WHEN** AI 调用 `input_text({ selector: "[contenteditable='true']", text: "Hello" })` 且选择器匹配到一个 contenteditable 元素
- **THEN** 系统注入 `element-input.js`，将元素 textContent 设置为 "Hello"，触发 InputEvent('input')，返回 `{ success: true, elementTag: "div", inputMode: "contenteditable", valueCheck: "matched" }`

#### Scenario: 选择器未匹配元素
- **WHEN** AI 调用 `input_text({ selector: ".non-existent", text: "test" })` 且选择器不匹配任何元素
- **THEN** 返回 `{ success: false, error: "selector_not_found", message: "未找到匹配元素: .non-existent", selector: ".non-existent" }`

#### Scenario: 选择器匹配到非输入元素
- **WHEN** AI 调用 `input_text({ selector: "div.plain", text: "test" })` 且选择器匹配到的元素不是 input/textarea/contenteditable
- **THEN** 返回 `{ success: false, error: "not_input_element", message: "目标元素不是可输入元素", elementTag: "div" }`

#### Scenario: 无活动标签页
- **WHEN** AI 调用 `input_text` 但无活动标签页
- **THEN** 返回错误 `{ error: "no_active_tab", message: "没有活跃标签页" }`

#### Scenario: 等待超时未收到结果
- **WHEN** 输入指令已注入页面但 30 秒内未收到 `INPUT_TEXT_RESULT`
- **THEN** 工具返回 `{ error: "timeout", message: "未在30秒内收到输入结果" }`

#### Scenario: 值检查不匹配
- **WHEN** AI 调用 `input_text({ selector: ".ant-input", text: "test" })` 写入成功但读取回的值与写入值不一致（框架可能覆盖了值）
- **THEN** 返回 `{ success: true, elementTag: "input", valueCheck: "mismatch", actualValue: "<实际值>", message: "值已设置但读取不匹配，目标元素可能被框架控制" }`

### Requirement: input_text 通过异步监听获取结果
`input_text` 工具 SHALL 采用两阶段通信模式：先通过 `sendMessage({ type: 'INPUT_TEXT' })` 发送输入指令并接收 ACK，然后通过一次性 `chrome.runtime.onMessage` 监听器捕获 `INPUT_TEXT_RESULT` 的结果。

#### Scenario: 异步结果等待
- **WHEN** `input_text` handler 发送 INPUT_TEXT 消息并收到 ACK
- **THEN** handler 注册一次性 onMessage 监听器等待 INPUT_TEXT_RESULT，超时 30s 后 resolve 或 reject

### Requirement: input_text 触发原生 DOM 事件
`element-input.js` 在设置文本值后 SHALL 触发原生 `input` 事件（`Event` 类型，`bubbles: true`）和 `change` 事件（`Event` 类型，`bubbles: true`），以确保 React、Vue 等前端框架的响应式绑定被正确触发。

对于 contenteditable 元素，SHALL 使用 `InputEvent` 类型（`inputType: 'insertText'`）。

#### Scenario: input 元素事件触发
- **WHEN** `element-input.js` 向 input 元素写入文本
- **THEN** 元素触发 `input` 事件（bubbles: true）和 `change` 事件（bubbles: true）

#### Scenario: contenteditable 元素事件触发
- **WHEN** `element-input.js` 向 contenteditable 元素写入文本
- **THEN** 元素触发 `InputEvent('input', { inputType: 'insertText', bubbles: true })`
