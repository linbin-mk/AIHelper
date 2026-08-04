## Why

AI 聊天中通过 9 种基础交互卡片与用户交互。但用户切换到其他 Tab（技能/监控/知识/设置）再切回聊天，或切换历史会话时，`renderChatMessages` 清空 DOM 后只能正确恢复 4 种卡片（思考、技能激活、工具调用）。询问卡片（`ask_user`）、授权卡片（`request_auth`）、表格卡片（`display_table`）、文件卡片（`provide_file`）、产物集合卡片（`present_output_files`）这 5 种卡片均无法正确渲染——历史会话中只能看到折叠的通用工具卡片或完全丢失，进行中的阻塞式交互卡片（`ask_user`/`request_auth`）Promise 永久挂起导致聊天卡死。

## What Changes

- 在 `renderChatMessages` 中识别消息数组中的 5 种交互工具调用（`ask_user`、`request_auth`、`display_table`、`provide_file`、`present_output_files`），创建对应的专用卡片而非通用工具卡片
- 新增只读模式卡片函数（`createReadonlyQuestionCard`、`createReadonlyAuthCard`、`createReadonlyTableCard`），用于历史会话中已完成的交互卡片展示
- 为进行中的阻塞式交互卡片（`ask_user`/`request_auth`/`display_table` clickable）建立 `_pendingInteraction` 全局状态，支持 DOM 重建后重新绑定 Promise
- 在 `refreshChatView` 和 `switchToSession` 中正确处理 Agent Loop 运行中的状态，优先保证交互卡片能被恢复而非简单清空 DOM 重建
- `renderChatMessages` 支持异步处理（`present_output_files` 需查询 IndexedDB）

## Capabilities

### New Capabilities
- `chat-interaction-card-recovery`: 全部 9 种交互卡片在页面切换/会话切换后的恢复渲染机制

### Modified Capabilities
- `ai-chat-panel`: `renderChatMessages` 需支持检测并正确渲染全部交互工具调用类型
- `ai-question-card`: 新增只读模式 + 从 `_pendingInteraction` 恢复绑定 Promise
- `ai-auth-card`: 同上
- `ai-table-card`: 新增只读模式 + 从 tool_calls 参数恢复表格渲染
- `ai-file-card`: 从 tool_calls 参数恢复文件卡片渲染（含下载功能）
- `output-collection-card`: 从 tool_calls 参数恢复产物集合卡片（重新查询 IndexedDB）
- `tab-switching`: 切换到聊天 Tab 时需传递 Agent Loop 运行状态

## Impact

- `shared/chat.js`: 核心修改区域 — `renderChatMessages`、`createQuestionCard`、`createAuthCard`、`createTableCard`、`createFileCard`、`createOutputCollectionCard` 及相关 handle 函数；新增只读卡片函数；新增 `_pendingInteraction` 状态管理
- `chrome-extension/src/panel/panel.js`: `refreshChatView` 加 `_isSending` 保护
- `firefox-extension/src/popup/popup.js`: 同上（通过 sync.sh 同步）
- 不影响持久化存储结构和 API 协议
