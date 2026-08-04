# chat-interaction-card-recovery Specification

## Purpose
TBD - created by archiving change persist-chat-interaction-cards. Update Purpose after archive.
## Requirements
### Requirement: 系统在 Agent Loop 运行期间跳过聊天视图 DOM 清空重建
当 Agent Loop 正在运行（`_isSending === true`）时，`refreshChatView` SHALL 不调用 `renderChatMessages`，以避免清空进行中的交互卡片 DOM 导致 Promise 永久挂起。

#### Scenario: Agent Loop 运行中切换 Tab 后回到聊天
- **WHEN** Agent Loop 正在运行且等待用户响应（如 ask_user 卡片展示中）
- **AND** 用户切换到其他 Tab（技能/监控/知识/设置）
- **AND** 用户点回聊天 Tab
- **THEN** 聊天视图保留原有 DOM（不清空不重建）
- **AND** 交互卡片保持原样，用户可正常点击响应
- **AND** Agent Loop 恢复执行

#### Scenario: Agent Loop 空闲时切换 Tab 后回到聊天正常刷新
- **WHEN** Agent Loop 未运行（`_isSending === false`）
- **AND** 用户切换到其他 Tab 再点回聊天 Tab
- **THEN** `refreshChatView` 正常调用 `renderChatMessages` 重建视图
- **AND** 聊天内容从存储的消息数据中正确渲染

### Requirement: 全局待处理交互状态存储
当 `executeToolCall` 处理阻塞式交互工具调用（`ask_user`、`request_auth`、`display_table` 可点击模式）时，系统 SHALL 将交互状态存储到 `window._pendingInteraction`，并在交互完成或中止时清除。

#### Scenario: ask_user 工具调用时存储状态
- **WHEN** `executeToolCall` 接收到 `name === 'ask_user'` 的工具调用
- **AND** 解析 `argsStr` 获得 `question`、`options`、`allowFreeInput`、`placeholder`、`multiSelect`
- **THEN** 系统在创建卡片前写入 `window._pendingInteraction = { type: 'ask_user', toolCallId, args, resolve, reject }`
- **AND** 在 `handleQuestionCard` Promise resolve 或 reject 后清除 `window._pendingInteraction = null`

#### Scenario: request_auth 工具调用时存储状态
- **WHEN** `executeToolCall` 接收到 `name === 'request_auth'` 的工具调用
- **THEN** 系统写入 `window._pendingInteraction = { type: 'request_auth', toolCallId, args, resolve, reject }`
- **AND** 在 `handleAuthCard` Promise resolve 或 reject 后清除

#### Scenario: Agent Loop 被中止时清除待处理状态
- **WHEN** `currentAbortController` 触发 abort 事件
- **AND** `_pendingInteraction` 存在
- **THEN** 系统清除 `window._pendingInteraction = null`
- **AND** 已渲染的交互卡片中所有按钮/输入框变为禁用状态

### Requirement: renderChatMessages 按工具名分发卡片渲染
`renderChatMessages` 遍历消息数组时，遇到 `tool_calls` 中的工具调用 SHALL 根据 `function.name` 选择对应卡片类型创建，而非全部使用通用工具卡片。

#### Scenario: 普通工具调用使用通用工具卡片
- **WHEN** `renderChatMessages` 遇到 tool_calls 中 `function.name` 为 `read_file`、`execute_js` 等非交互工具
- **THEN** 按现有逻辑创建通用工具卡片（单卡片或分组卡片）

#### Scenario: 交互工具调用跳过通用工具卡片
- **WHEN** `renderChatMessages` 遇到 tool_calls 中 `function.name` 为 `ask_user`、`request_auth`、`display_table`、`provide_file`、`present_output_files`
- **THEN** 不创建通用工具卡片
- **AND** 创建对应的专用交互卡片

### Requirement: ask_user 工具调用的卡片恢复
`renderChatMessages` 遇到 `ask_user` 工具调用时 SHALL 根据运行状态渲染为可交互卡片或只读卡片。

#### Scenario: 重建 ask_user 卡片（Agent Loop 运行中）
- **WHEN** `renderChatMessages` 遇到 tool_calls 中包含 `function.name === 'ask_user'` 的助手消息
- **AND** `_isSending === true` 且 `_pendingInteraction.type === 'ask_user'` 且 `toolCallId` 匹配
- **THEN** 调用 `createQuestionCard(question, options, allowFreeInput, placeholder, multiSelect)` 创建 DOM
- **AND** 调用 `handleQuestionCard(cardWrapper, options, allowFreeInput, multiSelect)` 绑定交互回调

#### Scenario: 展示历史 ask_user 卡片（只读模式）
- **WHEN** `renderChatMessages` 遇到包含 `ask_user` 工具调用的助手消息
- **AND** `_isSending === false` 或 `_pendingInteraction` 不匹配（历史会话）
- **THEN** 调用 `createReadonlyQuestionCard(question, options, allowFreeInput, placeholder, multiSelect)` 创建只读卡片
- **AND** 所有交互元素（按钮、复选框、输入框）设为禁用状态
- **AND** 用户可清楚看到 AI 当时问的问题和提供的选项

### Requirement: request_auth 工具调用的卡片恢复
`renderChatMessages` 遇到 `request_auth` 工具调用时 SHALL 根据运行状态渲染为可交互卡片或只读卡片。

#### Scenario: 重建 request_auth 卡片（Agent Loop 运行中）
- **WHEN** `renderChatMessages` 遇到 tool_calls 中包含 `function.name === 'request_auth'` 的助手消息
- **AND** `_isSending === true` 且 `_pendingInteraction.type === 'request_auth'` 且 `toolCallId` 匹配
- **THEN** 调用 `createAuthCard(action, detail, riskLevel)` 创建 DOM
- **AND** 调用 `handleAuthCard(cardWrapper)` 绑定交互回调

#### Scenario: 展示历史 request_auth 卡片（只读模式）
- **WHEN** `renderChatMessages` 遇到包含 `request_auth` 工具调用的助手消息
- **AND** `_isSending === false` 或 `_pendingInteraction` 不匹配
- **THEN** 调用 `createReadonlyAuthCard(action, detail, riskLevel)` 创建只读卡片
- **AND** "同意"和"拒绝"按钮设为禁用状态
- **AND** 用户可清楚看到 AI 当时请求的授权操作和详情

### Requirement: provide_file 工具调用的卡片恢复
`renderChatMessages` 遇到 `provide_file` 工具调用时 SHALL 从 `tool_calls` 参数中提取 `fileName`、`content`、`mimeType` 并调用 `createFileCard` 重建文件卡片。

#### Scenario: 从历史消息重建文件卡片
- **WHEN** `renderChatMessages` 遇到 tool_calls 中包含 `function.name === 'provide_file'` 的助手消息
- **AND** `tool_call.function.arguments` 包含 `{fileName: "config.json", content: "...", mimeType: "application/json"}`
- **THEN** 调用 `createFileCard("config.json", "...", "application/json")` 重建文件卡片
- **AND** 文件下载按钮可用（用户可重新下载）

#### Scenario: 文件内容参数缺失时降级处理
- **WHEN** `renderChatMessages` 遇到 `provide_file` 工具调用但 `arguments` 中缺少 `content` 字段
- **THEN** 传入空字符串作为 content，文件卡片正常展示但下载内容为空

### Requirement: present_output_files 工具调用的卡片恢复
`renderChatMessages` 遇到 `present_output_files` 工具调用时 SHALL 从 `tool_calls` 参数中提取 `pathPrefix`、`showTree`、`emptyMessage` 并重新调用 `createOutputCollectionCard` 重建产物集合卡片。

#### Scenario: 从历史消息重建产物集合卡片
- **WHEN** `renderChatMessages` 遇到 tool_calls 中包含 `function.name === 'present_output_files'` 的助手消息
- **AND** `tool_call.function.arguments` 包含 `{pathPrefix: "openspec/changes/", showTree: true, emptyMessage: null}`
- **THEN** 调用 `await createOutputCollectionCard({ pathPrefix: "openspec/changes/", showTree: true, emptyMessage: null })`
- **AND** 卡片展示 IndexedDB 中当前实际存在的匹配文件

#### Scenario: 历史产物文件已被删除时展示空状态
- **WHEN** `renderChatMessages` 重建 `present_output_files` 卡片
- **AND** IndexedDB 中已无匹配文件
- **THEN** 卡片展示空状态提示 "📭 暂无产物文件"
- **AND** 不显示下载按钮

### Requirement: display_table 工具调用的卡片恢复
`renderChatMessages` 遇到 `display_table` 工具调用时 SHALL 从 `tool_calls` 参数中提取 `title`、`columns`、`rows`，根据 `clickable` 参数决定渲染为可交互表格或只读表格。

#### Scenario: 从历史消息重建只读表格卡片
- **WHEN** `renderChatMessages` 遇到 tool_calls 中包含 `function.name === 'display_table'` 的助手消息
- **AND** `_isSending === false` 或 `_pendingInteraction` 不匹配
- **THEN** 调用 `createReadonlyTableCard(title, columns, rows)` 创建只读表格
- **AND** 表格数据完整展示，行不可点击

#### Scenario: 重建可点击表格卡片（Agent Loop 运行中）
- **WHEN** `renderChatMessages` 遇到 `display_table` 工具调用且 `clickable === true`
- **AND** `_isSending === true` 且 `_pendingInteraction.type === 'display_table'` 且 `toolCallId` 匹配
- **THEN** 调用 `createTableCard(title, columns, rows, true)` 创建可交互表格
- **AND** 调用 `handleTableCard(cardWrapper, true)` 绑定交互回调

### Requirement: 卡片恢复渲染的优雅降级
任何交互卡片的 `tool_calls` 参数解析失败或数据缺失时，系统 SHALL 不抛出异常导致整个 `renderChatMessages` 中断。降级为显示一个简化的通用工具卡片，包含工具名称和原始参数文本。

#### Scenario: tool_calls 参数 JSON 解析失败时降级
- **WHEN** `renderChatMessages` 尝试恢复交互卡片
- **AND** `tool_call.function.arguments` 不是有效的 JSON（损坏的数据）
- **THEN** 不抛出异常，不中断后续消息渲染
- **AND** 为该工具调用降级渲染一个通用工具卡片，标题显示工具名

#### Scenario: 交互卡片参数中缺少必填字段时降级
- **WHEN** `renderChatMessages` 尝试恢复 `ask_user` 卡片
- **AND** `tool_call.function.arguments` 中缺少 `question` 字段
- **THEN** 降级渲染为通用工具卡片，不创建询问卡片

#### Scenario: createOutputCollectionCard 异步查询 IndexedDB 失败时降级
- **WHEN** `renderChatMessages` 遇到 `present_output_files` 工具调用
- **AND** `createOutputCollectionCard` 内部查询 IndexedDB 抛出异常
- **THEN** `renderChatMessages` 捕获异常
- **AND** 降级渲染一个通用工具卡片，标题显示 "present_output_files"
- **AND** 不中断后续消息的渲染

