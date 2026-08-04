## Context

当前系统通过 `click_element` 工具支持 AI 点击页面元素（`element-click.js`），采用异步通信模式（`storage.local` 传参 + `onMessage` 监听结果）。现需新增 `input_text` 工具，让 AI 可向页面的 input/textarea/contenteditable 元素输入文本。该工具将复用 `click_element` 相同的两阶段异步通信架构。

## Goals / Non-Goals

**Goals:**
- AI 可调用 `input_text` 工具，通过 CSS 选择器定位页面上的 input/textarea/contenteditable 元素并写入文本
- 输入操作触发原生 `input` 和 `change` 事件，确保 React/Vue 等框架的响应式绑定被触发
- 复用现有的异步通信模式，最小化架构改动

**Non-Goals:**
- 不实现模拟逐字符打字的延迟输入
- 不处理非标准自定义组件（如 Monaco Editor、CodeMirror 等代码编辑器）
- 不支持文件上传（`input[type=file]`）
- 不支持下拉选择（`<select>`）

## Decisions

### 1. 通信模式：复用 click_element 的异步两阶段模式

**决策**：通过 `storage.local` 传递参数给 Content Script，通过 `onMessage` 监听器获取结果。

**理由**：`click_element` 的异步模式已被证明稳定可靠。`input_text` 的操作同样可能耗时（等待元素出现、焦点获取等），使用异步模式更合适。

**备选方案**：同步 `sendMessage` 回调模式（如 `get_page_context`）。不可行，因为 Content Script 需要在页面 DOM 中执行焦点设置、事件触发等操作，执行时间不固定。

### 2. 工具命名：`input_text`

**决策**：工具命名为 `input_text`，参数为 `selector`（必填）和 `text`（必填）。

**理由**：语义清晰，与 `click_element` 风格一致。`type_text` 暗示逐字符输入，`fill_input` 含义偏窄。

### 3. Content Script 输入策略

**决策**：对 input/textarea 使用 `.value = text` + `dispatchEvent(new Event('input', {bubbles:true}))` + `dispatchEvent(new Event('change', {bubbles:true}))`；对 contenteditable 使用 `element.textContent = text` + `dispatchEvent(new InputEvent('input', {bubbles:true}))`。

**理由**：
- 直接设置 `.value` 再触发事件比 `document.execCommand` 更可靠且更简洁
- React 通过 value 属性代理监听 `input` 事件，直接 dispatchEvent 可触发
- Vue 通过 v-model 监听 `input` 事件，同样适用
- contenteditable 需要 InputEvent 类型以正确处理

### 4. 危险操作检测

**决策**：不实现危险操作检测。`input_text` 的操作风险低于 `click_element`（不会触发删除/注销等破坏性操作），当前阶段不需要。

**Risks / Trade-offs**

- [风险] 部分框架（如 Ant Design、Element UI）使用自定义组件封装 input，直接设置 value 可能不生效 → 缓解：返回 `{ success: true, valueCheck: "matched"/"mismatch" }` 让 AI 知晓写入是否被框架接受
- [风险] `contenteditable` 相关的富文本编辑器中，纯文本写入可能丢失格式 → 缓解：明确文档说明仅支持纯文本输入，格式要求由 AI 通过其他方式处理
- [权衡] 不支持逐字符输入 → AI 无法模拟真实用户打字，但对于大多数自动填充场景不是问题
