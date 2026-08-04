## Context

当前 AI 聊天面板在 Agent Loop 运行期间使用 9 种交互卡片。`renderChatMessages` 清空 DOM 后能正确恢复前 4 种（思考气泡、技能激活、工具调用单/分组），但后 5 种（询问、授权、表格、文件、产物集合）无法恢复——它们在消息数组中有对应的 `tool_calls` 数据，但被当作通用工具卡片处理或直接跳过。

### 关键代码路径

| 函数 | 文件 | 行号 | 作用 |
|---|---|---|---|
| `refreshChatView()` | panel.js | 88 | Tab 切回聊天时的刷新入口，无 `_isSending` 保护 |
| `renderChatMessages()` | chat.js | 729 | 清空 DOM 并重建消息；当前仅处理普通 tool_calls |
| `executeToolCall()` (ask_user) | chat.js | 2898 | 创建询问卡片 + await Promise |
| `executeToolCall()` (request_auth) | chat.js | 2914 | 创建授权卡片 + await Promise |
| `executeToolCall()` (display_table) | chat.js | 2936 | 创建表格卡片 + await Promise（clickable 模式）|
| `executeToolCall()` (provide_file) | chat.js | 2951 | 创建文件卡片（非阻塞） |
| `executeToolCall()` (present_output_files) | chat.js | 2964 | 创建产物集合卡片（非阻塞，异步查询 IndexedDB）|

### 9 种卡片分类

| # | 类型 | 是否阻塞 | 当前 renderChatMessages 行为 | 需要修改 |
|---|------|---------|---------------------------|---------|
| 1 | 思考气泡 | 否 | ✓ 正确恢复 | 不需要 |
| 2 | 技能激活卡片 | 否 | ✓ 正确恢复 | 不需要 |
| 3 | 工具调用卡片（单） | 否 | ✓ 正确恢复 | 不需要 |
| 4 | 工具调用卡片（分组） | 否 | ✓ 正确恢复 | 不需要 |
| 5 | 询问卡片 | **是** | ✗ 显示为通用工具卡片 | **需要** |
| 6 | 授权卡片 | **是** | ✗ 显示为通用工具卡片 | **需要** |
| 7 | 表格卡片 | 可选 | ✗ 显示为通用工具卡片 | **需要** |
| 8 | 文件卡片 | 否 | ✗ 完全丢失 | **需要** |
| 9 | 产物集合卡片 | 否 | ✗ 完全丢失 | **需要** |

## Goals / Non-Goals

**Goals:**
- 全部 9 种交互卡片在切换会话/Tab 后均能正确重新渲染
- 历史会话中已完成的交互卡片以只读模式展示（可看到当时的问题/选项/文件/表格）
- 进行中的阻塞式交互卡片在 DOM 重建后能重新绑定 Promise，Agent Loop 恢复正常
- `refreshChatView` 在 Agent Loop 运行期间跳过 DOM 清空（作为第一道防线）

**Non-Goals:**
- 不改变持久化存储结构（`chrome.storage.local` 消息格式不变）
- 不改变浏览器扩展关闭/重开后的 Agent Loop 恢复（已丢失的 Promise 无法恢复）
- 文件卡片下载功能在只读历史卡片中保留（文件内容从 tool_calls args 恢复）
- `present_output_files` 重新查询 IndexedDB（文件可能已变化/删除，展示当前实际状态）

## Decisions

### 决策 1：Agent Loop 运行期间跳过 DOM 清空重建（第一道防线）

**选择**：在 `refreshChatView` 中增加 `_isSending` 检查，当 Agent Loop 正在运行时直接跳过 `renderChatMessages` 调用。

**理由**：最小改动，零风险；此时 DOM 中交互卡片完整存在，仅被 CSS `display:none` 隐藏。

### 决策 2：全局待处理交互状态存储（第二道防线，阻塞式卡片专用）

**选择**：新增 `window._pendingInteraction` 对象，在 `executeToolCall` 处理阻塞式工具（`ask_user`/`request_auth`/`display_table` clickable）时写入，Promise resolve/reject 后清除。

```js
window._pendingInteraction = {
  type: 'ask_user' | 'request_auth' | 'display_table',
  toolCallId: '<tool_call.id>',
  args: { /* 工具调用参数 */ },
  resolve: function,
  reject: function,
};
```

**理由**：当 DOM 确实需要重建（扩展热更新等边界情况）时，`renderChatMessages` 可通过此状态重新创建交互卡片并绑回 Promise。

### 决策 3：renderChatMessages 中按工具名分发卡片渲染

**选择**：在 `renderChatMessages` 的消息遍历中，检查 `tool_calls` 中每个工具调用的 `function.name`。根据工具名选择对应卡片类型：

| 工具名 | 有 _pendingInteraction | 无 _pendingInteraction（历史）|
|--------|----------------------|--------------------------|
| `ask_user` | 调用 `createQuestionCard` + `handleQuestionCard` | 调用 `createReadonlyQuestionCard` |
| `request_auth` | 调用 `createAuthCard` + `handleAuthCard` | 调用 `createReadonlyAuthCard` |
| `display_table` | clickable 时创建可交互卡片 | 调用 `createReadonlyTableCard` |
| `provide_file` | 直接从 args 调用 `createFileCard` | 同上（非阻塞，无区别）|
| `present_output_files` | 调用 `createOutputCollectionCard` | 同上（重新查询 IndexedDB）|
| 其他 | 按现有逻辑创建通用工具卡片 | 同上 |

**理由**：
- 历史会话中所有交互卡片都能正确展示，用户可清晰看到 AI 问了什么、提供了什么文件/表格
- `provide_file` 和 `present_output_files` 为非阻塞卡片，无需 Promise 绑定，直接从 tool_calls args 重建即可
- `present_output_files` 重新查询 IndexedDB——如果文件仍存在则展示，不存在则显示空状态，这是最诚实的展示方式

### 决策 4：只读模式卡片函数

**选择**：新增 3 个只读卡片函数，外观与交互版一致但所有交互元素设为 `disabled`：
- `createReadonlyQuestionCard(question, options, allowFreeInput, placeholder, multiSelect)`
- `createReadonlyAuthCard(action, detail, riskLevel)`
- `createReadonlyTableCard(title, columns, rows)`

`provide_file` 和 `present_output_files` 不需要只读版本——它们的下载/预览功能在历史中仍然可用。

**理由**：历史卡片的下载按钮仍可用（用户可能想重新下载之前的文件）；询问/授权/表格卡片交互已过期，禁用即可。

### 决策 5：renderChatMessages 支持异步

**选择**：将 `renderChatMessages` 改为 `async function`，以支持 `present_output_files` 的 `createOutputCollectionCard` await 调用。

**理由**：`createOutputCollectionCard` 需要异步查询 IndexedDB。`renderChatMessages` 的调用方不依赖其返回值，改为 async 不影响调用链。

## Risks / Trade-offs

- **[低风险] 历史 present_output_files 卡片重新查询 IndexedDB**：如果原始文件已被删除，卡片显示空状态 → 缓解：空状态已明确提示"暂无产物文件"，这是合理的行为
- **[低风险] 卡片参数解析失败**：tool_calls arguments 损坏或缺少必填字段时 → 缓解：try-catch 包裹每个卡片重建，解析失败降级为通用工具卡片，不中断后续消息渲染
- **[低风险] IndexedDB 查询异常**：`createOutputCollectionCard` 内部查询抛出异常时 → 缓解：捕获异常降级为通用工具卡片，不中断 renderChatMessages
- **[低风险] provide_file 内容存储在 tool_calls args 中**：大文件内容会使存储消息变大 → 缓解：现有的 `session-manager.js` 已处理存储大小问题，不新增风险
- **[低风险] `_isSending` 状态未正确重置**：如果 Agent Loop 异常终止但 `_isSending` 未重置 → 缓解：所有退出路径均有 `setSending(false)`，风险可控
- **[无新增依赖]** 不引入新库或 API
