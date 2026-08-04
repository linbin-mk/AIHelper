## 1. 新模块：用户提交卡片（shared/user-files.js）

- [x] 1.1 创建 `shared/user-files.js`，参照 `shared/output-files.js` 模式：
  - storage key: `'ai_helper_user_submit_item'`
  - 卡片 displayName: `'用户提交'`，type: `'user_submit'`
  - 提供 `saveUserFile(filePath, content)`、`getUserFile(path)`、`searchUserFiles(pathPrefix)` 三个导出函数
  - 文件路径格式：`<sessionId>/<文件名>`（无需域名前缀）

## 2. UI 结构（HTML）

- [x] 2.1 在 `panel.html` 中引入 `<script src="../shared/user-files.js"></script>`（跟在 `output-files.js` 之后）
- [x] 2.2 在 `chat-input-area` 中新增隐藏的 `<input type="file" multiple>` 元素和附件按钮 `<button id="attachBtn">`
- [x] 2.3 在 `chat-input-area` 中新增文件标签容器 `<div class="chat-file-tags">`，位于 `<textarea>` 上方

## 3. 样式（CSS）

- [x] 3.1 新增附件按钮样式（`.attach-btn`）：圆形/方形小按钮，与输入区域风格一致，发送中禁用态
- [x] 3.2 新增文件标签容器样式（`.chat-file-tags`）：flex 布局，支持换行，无文件时隐藏
- [x] 3.3 新增单个文件标签样式（`.file-tag`）：显示文件名、大小、× 移除按钮，hover 效果

## 4. 核心逻辑（shared/chat.js）

- [x] 4.1 定义文件类型白名单 `allowedExtensions` 和 `allowedMimeTypes` 常量
- [x] 4.2 实现文件选择变更处理函数 `handleFileSelect(event)`：
  - 先校验当前已选 + 新选数量 ≤ 5，超限则 toast 提示并拒绝全部新文件
  - 遍历 `event.target.files`
  - 校验扩展名和 MIME 类型，不合法则 toast 提示并跳过
  - 用 `FileReader.readAsText()` 读取文件内容到 `window.pendingFiles` 数组（每项 `{name, size, content}`）
  - 调用 `renderFileTags()` 刷新标签 UI
- [x] 4.3 实现 `renderFileTags()` 函数：
  - 根据 `window.pendingFiles` 数组动态创建/更新 `.file-tag` 元素
  - 每个标签显示文件名 + 格式化的大小（B/KB）
  - 点击 × 按钮从数组中移除对应文件并重新渲染
  - 无文件时隐藏 `.chat-file-tags` 容器
- [x] 4.4 实现文件大小格式化工具函数 `formatFileSize(bytes)`
- [x] 4.5 修改 `sendChatMessage()` → `doSendMessage()` 函数：
  - 如果有 `pendingFiles`，对每个文件调用 `saveUserFile(window.currentSessionId + '/' + item.name, item.content)` 保存到「用户提交」卡片
  - 构建包含文件路径提示的消息文本（格式见 design.md），指引 AI 使用 `get_user_file` 工具
  - 发送后清空 `window.pendingFiles` 数组并调用 `renderFileTags()`
- [x] 4.6 在 TOOLS 数组中新增两个工具定义：
  - `search_user_files`：查询「用户提交」卡片中的文件列表，支持 `pathPrefix` 参数
  - `get_user_file`：读取「用户提交」卡片中指定文件的完整内容，参数 `filePath`
- [x] 4.7 在 `executeToolCall()` 函数中新增 `search_user_files` 和 `get_user_file` 的处理分支，调用 `user-files.js` 中的对应函数
- [x] 4.8 修改 `setSending(isSending)` 函数，发送中状态同步禁用附件按钮
- [x] 4.9 绑定事件：附件按钮 → 触发隐藏 file input 的 click；file input 的 change → `handleFileSelect`

## 5. 国际化（shared/i18n.js）

- [x] 5.1 新增翻译键：`chat.attachFile`、`chat.fileTagRemove`、`chat.fileUnsupportedType`、`chat.fileTooMany`
- [x] 5.2 新增工具显示名翻译键：`chat.tool_search_user_files`、`chat.tool_get_user_file`

## 6. 同步与验证

- [x] 6.1 运行 `bash sync.sh` 将 shared 变更同步到 chrome-extension 和 firefox-extension
- [ ] 6.2 在 Chrome 扩展中手动验证：选择文本文件 → 查看标签 → 发送消息 → AI 调用 `search_user_files` / `get_user_file` 读取文件
- [ ] 6.3 验证边界情况：非文本文件拒绝、超过 5 个文件拒绝、逐个移除、发送失败保留文件
