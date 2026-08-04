## Why

当前 AI 工具只支持点击页面元素（`click_element`），但缺少向页面输入框（input、textarea、contenteditable）写入内容的能力。很多自动化场景需要 AI 先填充表单字段再点击提交按钮，缺少输入能力严重限制了自动化操作的完整性。

## What Changes

- 新增 `input_text` 工具：AI 可调用该工具向页面上的 input/textarea/富文本编辑器写入文本内容
- 新增 Content Script `element-input.js`：在目标页面中执行实际的文本输入操作，支持原生 input 事件和 contenteditable
- 新增 `INPUT_TEXT` / `INPUT_TEXT_RESULT` 消息类型：复用与 `click_element` 相同的异步通信模式（storage.local 传参 + onMessage 监听器）
- 在 `chat.js` 的 TOOLS 数组中注册 `input_text` 工具定义
- 更新 `website-outline` skill 以利用新的输入能力和点击能力组合执行完整表单操作
- 在 `background.js` 中添加 `INPUT_TEXT` 消息路由

## Capabilities

### New Capabilities
- `ai-input-tool`: AI 可通过 `input_text` 工具向页面输入框写入文本内容，支持 input/textarea/contenteditable 和富文本编辑器

### Modified Capabilities
- `click-element-tool`: 同步消息路由 `CLICK_ELEMENT` 的消息处理逻辑与 `INPUT_TEXT` 共享 storage.local 传参模式，不影响现有行为
- `website-outline-skill`: skill 指令需更新以包含使用 `input_text` 的说明

## Impact

- `shared/chat.js`: 新增 TOOLS 条目和 executeToolCall 分支 (2729 行附近)
- `chrome-extension/src/content/element-input.js`: 新建 Content Script
- `chrome-extension/src/background.js`: 新增 INPUT_TEXT 消息路由 (407 行附近)
- `skills/website-outline/skill.cn.md`: 更新 AI 指令
- `sync.sh`: 自动同步 Content Script 到 Firefox（无需修改脚本本身）
