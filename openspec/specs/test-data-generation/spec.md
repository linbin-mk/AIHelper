# test-data-generation Specification

## Purpose
TBD - created by archiving change ai-test-data-generation. Update Purpose after archive.
## Requirements
### Requirement: AI tool - get page context
系统 SHALL 提供 `get_page_context` 工具函数供 AI Agent 调用，获取用户当前所在页面的上下文信息，包括：页面 URL、页面标题（document.title）、页面上可见的表单字段及标签（input/select/textarea 的 name 和 label 文本）、已捕获的该页面 HTTP 请求摘要（最近 20 条请求的 URL 和方法）。该工具无需参数。

#### Scenario: AI gets page context successfully
- **WHEN** AI Agent 调用 `get_page_context` 工具
- **THEN** 系统通过 Content Script 或 `chrome.tabs.sendMessage` 获取当前页面的 URL、标题、可见表单字段列表
- **AND** 通过 Background Service Worker (`QUERY_REQUESTS_FOR_AI`) 获取该页面已捕获的 HTTP 请求摘要
- **AND** 将所有信息合并为结构化 JSON 返回给 AI

#### Scenario: Page context extraction fails
- **WHEN** 页面不可访问或 Content Script 注入失败（如 chrome://、about: 页面）
- **THEN** 系统返回部分可用信息（至少包含 URL 和标题）
- **AND** 在返回结果中标注 `formFields: null` 和 `error: "Content script injection failed"`

#### Scenario: No captured requests available
- **WHEN** 当前页面尚未发出任何 HTTP 请求或请求尚未被捕获
- **THEN** 系统在 `capturedRequests` 字段返回空数组 `[]`
- **AND** 不影响 URL、标题、表单字段等其他信息的返回

### Requirement: AI tool - extract auth token
系统 SHALL 提供 `extract_auth_token` 工具函数供 AI Agent 调用，从用户当前页面提取鉴权信息。提取来源包括：`document.cookie` 中的 Cookie 字符串、`window.localStorage` 中常见 token key（如 token、accessToken、Authorization 等）、最近捕获请求中的 Authorization/Cookie header。该工具无需参数。

#### Scenario: Extract token from localStorage
- **WHEN** AI Agent 调用 `extract_auth_token` 工具
- **AND** 当前页面 `localStorage` 中存在 key 为 `token` 或 `access_token` 的值
- **THEN** 系统返回 `{ source: "localStorage", tokenType: "Bearer", tokenValue: "<extracted_value>" }`
- **AND** 标注是否找到 `Authorization` header 格式的 token

#### Scenario: Extract token from cookies
- **WHEN** localStorage 中未找到 token，但页面 Cookie 中包含鉴权相关的 cookie（如 `JSESSIONID`、`auth_token` 等）
- **THEN** 系统返回 `{ source: "cookie", cookieString: "key1=value1; key2=value2" }`
- **AND** 过滤掉明显非鉴权的 Cookie（如 `_ga`、`_gid` 等分析类 cookie）

#### Scenario: No token found
- **WHEN** localStorage 和 Cookie 中均未找到可能的鉴权信息
- **THEN** 系统返回 `{ source: "none", hint: "未检测到鉴权信息，请检查登录状态" }`

#### Scenario: Token extraction security constraint
- **WHEN** 提取的 token 即将返回给 AI
- **THEN** 系统 MUST 对 token 值做脱敏处理，仅显示前 8 位和后 4 位，中间字符替换为 `****`
- **AND** 完整 token 仅保存在 Background Service Worker 内存中，不暴露给前端渲染和 LLM

### Requirement: AI tool - batch create data
系统 SHALL 提供 `batch_create_data` 工具函数供 AI Agent 调用，根据指定的 API 配置和批量参数创建测试数据。工具参数包括：`url`（必填，请求目标 URL）、`method`（必填，HTTP 方法，如 POST/PUT）、`headers`（可选，自定义请求头对象）、`bodyTemplate`（必填，请求体模板，其中可用 `{{index}}` 占位符表示当前批次序号）、`count`（必填，要创建的记录总数，最大 100）、`startIndex`（可选，起始序号，默认为 1）。

#### Scenario: Batch create data successfully
- **WHEN** AI Agent 调用 `batch_create_data`，参数为 `{url: "https://api.example.com/users", method: "POST", headers: {"Content-Type": "application/json"}, bodyTemplate: "{\"name\": \"测试用户{{index}}\"}", count: 10}`
- **THEN** 系统通过 Background Service Worker 代理发起 10 次 POST 请求，每次请求 body 中 `{{index}}` 替换为当前序号（1 到 10）
- **AND** 每次请求携带从页面提取的鉴权信息（Cookie/Authorization header）
- **AND** 每条请求完成后立即通过 `BATCH_PROGRESS` 消息通知 Panel 更新任务卡片进度
- **AND** 全部完成后返回 `{total: 10, success: 10, failed: 0, results: [...]}`

#### Scenario: Batch with partial failures
- **WHEN** 批量创建过程中部分请求失败（如网络错误、业务校验失败）
- **THEN** 系统继续执行剩余请求，不因单条失败而中断
- **AND** 失败记录在 `results` 数组中标注 `{index: N, status: "failed", error: "<message>"}`
- **AND** 最终统计准确反映成功数和失败数

#### Scenario: Count exceeds maximum
- **WHEN** `count` 参数超过 100
- **THEN** 系统返回错误提示 `"单次批量创建最多支持 100 条记录，请分批执行"`
- **AND** 不发起任何请求

#### Scenario: Execution cancelled by user
- **WHEN** 批量执行过程中用户点击任务卡片的"取消"按钮
- **THEN** 系统停止后续请求，返回已完成的记录统计
- **AND** 返回结果中 `cancelled: true` 和 `total: <已完成数>`

#### Scenario: Concurrency control
- **WHEN** 批量创建请求超过 5 条
- **THEN** 系统 MUST 控制并发数不超过 5 个，使用队列依次发送
- **AND** 已完成的结果按序号顺序排列

### Requirement: Task card message type
系统 SHALL 支持在聊天消息中渲染 `task_card` 类型的消息气泡。任务卡片 MUST 包含以下元素：卡片标题（任务摘要）、数据模板预览（表格或列表形式展示 bodyTemplate 中的字段和示例值）、创建数量、操作按钮区域（"执行"和"取消"按钮）、执行状态指示器（pending/running/done/failed）。当任务状态为 `running` 时，"执行"按钮替换为进度条（"已创建 X/N，成功 S，失败 F"）。

#### Scenario: Task card rendered in chat
- **WHEN** AI Agent 完成 API 分析后输出任务卡片
- **THEN** 系统在聊天区域渲染一张带边框和阴影的卡片组件
- **AND** 卡片展示：标题"批量创建 N 条 <资源名>"、数据模板预览表格、auto-extracted auth source 标识、"执行"和"取消"两个按钮

#### Scenario: Task card status transitions
- **WHEN** 任务卡片初始渲染
- **THEN** 状态为 `pending`，显示"执行"按钮
- **WHEN** 用户点击"执行"
- **THEN** 状态变更为 `running`，"执行"按钮替换为进度条和"取消"按钮
- **WHEN** 执行完成
- **THEN** 状态变更为 `done`，进度条替换为结果摘要（绿色对勾 + 成功/失败统计）

#### Scenario: Task card in chat history
- **WHEN** 聊天历史中保存了 `task_card` 类型的消息
- **THEN** 重新加载聊天历史时，任务卡片 MUST 重新渲染
- **AND** 已完成（`done`/`failed`）的任务卡片"执行"按钮 MUST 禁用，显示为"已执行"
- **AND** 未完成（`pending`/`running`）的任务卡片"执行"按钮仍可点击，但 `running` 状态的任务即使点击也不重复执行

#### Scenario: Multiple task cards
- **WHEN** 同一聊天中有多个任务卡片
- **THEN** 每个卡片独立管理自己的状态
- **AND** 同一时间只允许一个任务处于 `running` 状态

### Requirement: Task card execution trigger
系统 SHALL 在用户点击任务卡片"执行"按钮时，启动新的 AI Agent Loop 执行批量数据创建。执行前 MUST 再次提取页面鉴权信息（token 可能过期），然后将任务配置作为系统指令注入到 Agent 的上下文消息中。

#### Scenario: Execute task via agent loop
- **WHEN** 用户点击任务卡片的"执行"按钮
- **THEN** 系统调用 `extract_auth_token` 获取最新鉴权信息
- **AND** 系统构造合成用户消息 "执行任务 <taskId>: 使用 batch_create_data 工具，参数为 <taskConfig>"
- **AND** 调用 `startAgentLoop(syntheticMessage, signal)` 启动新 Agent Loop
- **AND** Agent 在 Loop 中调用 `batch_create_data` 工具执行批量创建

#### Scenario: Execution with auth expired
- **WHEN** 点击执行后提取鉴权信息失败
- **THEN** 任务卡片状态变更为 `failed`
- **AND** 显示错误提示 "鉴权信息获取失败，请刷新页面后重试"

### Requirement: Content script for page context extraction
系统 SHALL 注册一个 Content Script，在用户触发测试数据生成时通过 `chrome.scripting.executeScript` 动态注入到当前活跃 Tab。该脚本 MUST 收集页面 DOM 上下文信息并通过 `chrome.runtime.sendMessage` 返回。该脚本 SHOULD NOT 在页面加载时自动注入。

#### Scenario: Inject content script on demand
- **WHEN** `get_page_context` 工具被调用且当前 tab 尚未注入 content script
- **THEN** 系统使用 `chrome.scripting.executeScript` 注入 `page-context.js` 到当前 tab
- **AND** Content Script 收集 DOM 信息后通过消息通道返回
- **AND** 完成后不维持常驻注入（脚本执行完即结束）

#### Scenario: Re-inject for token extraction
- **WHEN** `extract_auth_token` 工具被调用
- **THEN** 系统使用 `chrome.scripting.executeScript` 注入 `auth-extractor.js` 到当前 tab
- **AND** 该脚本执行 token 提取后返回，不修改页面 DOM

