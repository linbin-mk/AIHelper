## 1. 保护运行中的 Agent Loop — refreshChatView

- [x] 1.1 在 `chrome-extension/src/panel/panel.js` 的 `refreshChatView` 函数开头增加 `_isSending` 检查：若 `_isSending === true`，直接 return 不调用 `renderChatMessages`
- [x] 1.2 在 `firefox-extension/src/popup/popup.js` 的 `refreshChatView` 函数中做相同修改

## 2. 全局待处理交互状态 — _pendingInteraction

- [x] 2.1 在 `shared/chat.js` 顶部新增 `window._pendingInteraction = null` 全局变量
- [x] 2.2 在 `executeToolCall` 的 `ask_user` 分支（行 2898）：创建卡片前，将 `{ type, toolCallId, args, resolve, reject }` 写入 `window._pendingInteraction`；Promise resolve/reject 后清除
- [x] 2.3 在 `executeToolCall` 的 `request_auth` 分支（行 2914）：同上
- [x] 2.4 在 `executeToolCall` 的 `display_table` 分支（行 2936）：当 `clickable === true` 时，同上
- [x] 2.5 在 `currentAbortController.signal` 的 abort 事件处理中清除 `window._pendingInteraction = null`

## 3. 只读模式卡片函数

- [x] 3.1 新增 `createReadonlyQuestionCard(question, options, allowFreeInput, placeholder, multiSelect)` — 外观与 `createQuestionCard` 一致，但按钮/复选框/输入框全部 `disabled`
- [x] 3.2 新增 `createReadonlyAuthCard(action, detail, riskLevel)` — 外观与 `createAuthCard` 一致，但"同意"/"拒绝"按钮 `disabled`
- [x] 3.3 新增 `createReadonlyTableCard(title, columns, rows)` — 外观与 `createTableCard` 一致，但行不可点击（无 `clickable` 样式）

## 4. renderChatMessages 交互工具调用分发

- [x] 4.1 将 `renderChatMessages` 改为 `async function`
- [x] 4.2 在处理 `tool_calls` 时，增加 `function.name` 检测：定义交互工具名集合 `['ask_user', 'request_auth', 'display_table', 'provide_file', 'present_output_files']`
- [x] 4.3 检测到 `ask_user`：有 `_pendingInteraction` 时调用 `createQuestionCard` + `handleQuestionCard`；否则调用 `createReadonlyQuestionCard`
- [x] 4.4 检测到 `request_auth`：有 `_pendingInteraction` 时调用 `createAuthCard` + `handleAuthCard`；否则调用 `createReadonlyAuthCard`
- [x] 4.5 检测到 `display_table`：有 `_pendingInteraction` 且 clickable 时调用 `createTableCard` + `handleTableCard`；否则调用 `createReadonlyTableCard`
- [x] 4.6 检测到 `provide_file`：从 `tool_call.function.arguments` 提取 `fileName`、`content`、`mimeType`，调用 `createFileCard`
- [x] 4.7 检测到 `present_output_files`：从 `tool_call.function.arguments` 提取 `pathPrefix`、`showTree`、`emptyMessage`，`await createOutputCollectionCard(...)`
- [x] 4.8 确保交互工具调用不被当作普通工具调用再次创建通用工具卡片（跳过原有的 `createCollapsibleToolCard` / `createGroupedToolCard` 逻辑）

## 5. 同步与验证

- [x] 5.1 运行 `bash sync.sh` 将 shared/ 修改同步到 chrome-extension/ 和 firefox-extension/
- [x] 5.2 验证阻塞式卡片恢复：Agent Loop 触发 ask_user → 切换技能 Tab → 切回聊天 → 卡片可见且可交互
- [x] 5.3 验证阻塞式卡片恢复：Agent Loop 触发 request_auth → 切换设置 Tab → 切回聊天 → 卡片可见且可交互
- [x] 5.4 验证历史 ask_user 只读卡片：加载包含已完成 ask_user 的历史会话 → 卡片以只读模式展示，按钮 disabled
- [x] 5.5 验证历史 request_auth 只读卡片：加载包含已完成 request_auth 的历史会话 → 卡片以只读模式展示，按钮 disabled
- [x] 5.6 验证历史 provide_file 卡片：加载包含文件卡片的历史会话 → 文件卡片正常展示，下载按钮可用
- [x] 5.7 验证历史 display_table 卡片：加载包含表格卡片的历史会话 → 表格数据完整展示，只读模式
- [x] 5.8 验证历史 present_output_files 卡片：加载包含产物集合卡片的历史会话 → 卡片展示 IndexedDB 中当前实际文件
- [x] 5.9 验证普通 Tab 切换不受影响：Agent Loop 空闲时切换 Tab → 聊天正常刷新
