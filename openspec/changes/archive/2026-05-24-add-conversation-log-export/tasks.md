## 1. UI - 添加导出按钮

- [x] 1.1 在 `panel.html` 聊天工具栏中，于清空按钮左侧添加「导出日志」按钮，id 为 `exportChatBtn`，class 为 `toolbar-btn`

## 2. 导出逻辑实现

- [x] 2.1 在 `chat.js` 中实现 `exportChatLog()` 函数：读取 `window.chatMessages`，构建包含 `meta`（exportedAt、messageCount、modelConfig）和 `messages` 的导出对象
- [x] 2.2 将导出对象序列化为 JSON，通过 Blob + `URL.createObjectURL` + 隐藏 `<a>` 点击触发浏览器下载
- [x] 2.3 文件名格式为 `ai-helper-chat-YYYYMMDD-HHmmss.json`

## 3. 事件绑定

- [x] 3.1 在 `chat.js` 中为 `exportChatBtn` 绑定 click 事件，调用 `exportChatLog()` 函数

## 4. 验证

- [x] 4.1 手动测试：发送几条消息后点击导出，验证 JSON 文件内容完整（含 reasoning_content、tool_calls 等字段）
- [x] 4.2 手动测试：空聊天记录时导出，验证 meta.messageCount 为 0 且 messages 为空数组
