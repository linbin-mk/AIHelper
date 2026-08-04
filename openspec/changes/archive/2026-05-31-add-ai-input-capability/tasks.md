## 1. Content Script 实现

- [x] 1.1 创建 `chrome-extension/src/content/element-input.js`：实现从 storage.local 读取参数、定位目标元素、写入文本并触发事件的逻辑
- [x] 1.2 支持 input/textarea 元素：设置 `.value` 后 dispatchEvent(input) + dispatchEvent(change)，并校验值是否写入成功
- [x] 1.3 支持 contenteditable 元素：设置 `.textContent` 后 dispatchEvent(new InputEvent('input', {inputType:'insertText', bubbles:true}))
- [x] 1.4 参数校验：检查元素是否为可输入元素，非输入元素返回 `not_input_element` 错误
- [x] 1.5 结果返回：通过 `chrome.runtime.sendMessage({ type: 'INPUT_TEXT_RESULT', data })` 返回操作结果

## 2. Background 消息路由

- [x] 2.1 在 `chrome-extension/src/background.js` 的 `onMessage` 路由中添加 `case 'INPUT_TEXT'` 分支
- [x] 2.2 实现 storage.local 参数传递：生成 `input_elem_*` 唯一 key，存储 selector 和 text
- [x] 2.3 注入 Content Script 后发送 ACK：`sendResponse({ type: 'INPUT_TEXT_SENT' })`
- [x] 2.4 添加 `case 'INPUT_TEXT_RESULT'` 转发到 Panel：`sendToPanel('INPUT_TEXT_RESULT', message.data)`

## 3. chat.js 工具注册与执行

- [x] 3.1 在 `shared/chat.js` 的 `TOOLS` 数组中添加 `input_text` 工具定义（在 `click_element` 之后）
- [x] 3.2 实现 `executeToolCall` 中的 `input_text` 执行分支：解析 selector 和 text 参数，采用异步监听模式等待 INPUT_TEXT_RESULT

## 4. Skill 更新

- [x] 4.1 更新 `skills/website-outline/skill.cn.md`：在 AI 指令中增加 `input_text` 工具的说明，指导 AI 在表单填充场景下使用该工具

## 5. 跨平台同步

- [x] 5.1 运行 `bash sync.sh` 同步 Content Script 和 shared/ 代码到 Firefox 扩展目录

## 6. 验证

- [x] 6.1 手动测试：在测试页面上验证 input_text 能否正确写入 input/textarea/contenteditable
- [x] 6.2 手动测试：验证 React/Vue 框架组件的事件绑定被正确触发
- [x] 6.3 手动测试：验证选择器未匹配、非输入元素等错误场景的正确报错
