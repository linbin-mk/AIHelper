## Context

AI Helper 是一个 Chrome 扩展（Manifest V3），当前通过 Service Worker 捕获当前标签页的 XHR 请求并在 Side Panel 中展示。项目为纯原生 JS（无构建工具），使用 chrome.storage.local 持久化 Header 配置。

本次变更需要新增 AI 对话功能：在 Side Panel 中集成聊天界面，用户可以与 AI 对话，AI 能基于捕获的请求数据回答用户问题。需支持配置大模型 API 地址、Key、模型名称等参数。

## Goals / Non-Goals

**Goals:**
- 在 Side Panel 中新增 AI 聊天 Tab，用户可在"请求监控"和"AI 聊天"间切换
- 支持配置大模型 API（Base URL、API Key、模型名称），配置持久化到 chrome.storage.local
- 聊天时自动将当前捕获的请求列表作为系统上下文注入，AI 可以回答关于请求的问题
- 采用 OpenAI 兼容协议调用大模型 API，兼容 OpenAI、DeepSeek、通义千问等主流模型
- 支持简单的 Agent 工具调用：AI 可通过工具函数获取最新请求数据
- 支持流式输出（SSE），使用 `ReadableStream` 读取 OpenAI 兼容的 `stream: true` 响应，AI 回复逐 token 展示
- 聊天记录持久化到 chrome.storage.local，保留最近 200 条消息

**Non-Goals:**
- 不实现多会话管理，仅支持单个对话线程
- 不实现模型切换热更新（修改配置后需刷新面板生效）
- 不将 API Key 上传到第三方服务器，所有配置仅存本地
- 不集成 Kilo Code CLI 本身（CLI 工具无法在浏览器中运行），而是基于 Kilo Code 的 Agent 设计理念实现轻量 Agent 模式

## Decisions

### 1. Agent 架构：轻量 ReAct Agent（OpenAI 兼容协议）

**选择**：基于 OpenAI Function Calling 实现 ReAct 风格的轻量 Agent，而非集成完整的 Kilo Code CLI。

**理由**：
- Kilo Code 是一个终端 CLI 工具，依赖 Node.js 运行时，无法直接在 Chrome 扩展（浏览器沙箱）中运行
- 采用 Function Calling 协议可达到类似的 Agent 效果：AI 能调用工具函数（如获取请求列表），形成观察-思考-行动的循环
- OpenAI 兼容协议被广泛支持，用户可接入任意兼容的大模型服务

**备选方案**：
- 纯聊天模式（无工具调用）：AI 只能看到预设的上下文，缺乏实时交互能力 → 放弃
- WebSocket 连接本地 Kilo Code 进程：强依赖用户本地环境，配置复杂，受众窄 → 放弃

### 2. UI 布局：Tab 切换模式

**选择**：面板顶部使用 Tab 栏切换"请求监控"和"AI 聊天"两个视图。

**理由**：
- Side Panel 宽度有限（~400px），Tab 切换比同屏分栏更节省空间
- 当前项目已是纯原生 DOM 操作，Tab 切换实现成本低
- 用户在两种模式之间切换时，状态各自保持独立

**备选方案**：
- 上下拆分视图：空间不足，聊天体验差 → 放弃
- 使用 chrome.sidePanel.setOptions 动态切换 path：切换开销大，无法保持两边的状态 → 放弃

### 3. API 通信：直接从 Panel 调用 LLM API

**选择**：Panel JS 直接使用 `fetch()` 调用 OpenAI 兼容 API，不经过 Background Service Worker。

**理由**：
- Service Worker 可能因不活跃被浏览器回收，长耗时 API 调用在 SW 中不可靠
- Panel 页面常驻可见，fetch 请求不会被中断
- 减少消息传递层级，简化实现

**备选方案**：
- 通过 Background Worker 代理 API 调用：SW 生命周期不可控，请求可能在等待中丢失 → 放弃

### 4. 流式输出：ReadableStream + SSE 解析

**选择**：调用 LLM API 时设置 `stream: true`，使用 `fetch` 返回的 `response.body`（`ReadableStream`）逐行读取 SSE 事件流，解析每个 `data:` 行中的 JSON chunk，实时更新 UI 中的 AI 消息气泡。

**理由**：
- OpenAI 兼容协议（`/v1/chat/completions`）支持 `stream: true` 参数，返回 SSE 格式的 token 流
- Chrome 浏览器原生支持 `ReadableStream` API，无需额外 polyfill
- fetch 的 `response.body.getReader()` 可逐块读取数据，与 SSE 协议天然匹配
- 流式输出显著降低用户体感延迟：用户可在 AI 生成第一个 token 后立即看到内容，而非等待完整回复

**备选方案**：
- EventSource API：不支持 POST 请求，无法传递 messages body → 放弃
- WebSocket：大部分 LLM API 不提供 WebSocket 接口，增加适配层复杂度 → 放弃

**流式响应处理流程**：
1. `fetch()` 发送 POST 请求，body 含 `"stream": true`
2. 获取 `response.body.getReader()`
3. 循环调用 `reader.read()`，将 `Uint8Array` 解码为文本
4. 按行分割，解析 `data: ` 前缀的行
5. `data: [DONE]` 表示流结束
6. 每个非空 chunk 解析 JSON，提取 `choices[0].delta.content`，追加到 AI 消息气泡

**Agent 工具调用与流式输出的兼容性**：
- 工具调用（Function Calling）场景下，LLM 返回的 chunk 中 `delta.tool_calls` 包含工具调用信息
- 当检测到 `tool_calls` 时，停止流式渲染，切换到工具执行→追加 result→重新发起流式请求的模式
- 普通文本回复场景下持续流式渲染

### 5. Key 安全：chrome.storage.local 明文存储

**选择**：API Key 明文存储在 chrome.storage.local 中。

**理由**：
- chrome.storage.local 数据仅存在于用户本地，不会同步到云端
- Manifest V3 中 Service Worker 不能使用 WebCrypto 的非 extractable key，加密意义有限
- 当前项目无构建工具，引入加密库增加复杂度
- 在后续版本中可考虑使用 chrome.storage.session 存储敏感信息

### 6. 聊天记录存储：chrome.storage.local

**选择**：聊天记录持久化到 chrome.storage.local，以 JSON 数组存储最近 200 条消息。页面加载时恢复历史，提供清空按钮。

**理由**：
- 复用已有的存储基础设施，无需引入 IndexedDB
- 200 条消息的 JSON 体积可控（约 20-50KB），在 storage.local 的 10MB 配额内绰绰有余
- 保持项目零外部依赖

## Risks / Trade-offs

- **[安全性] API Key 明文存储** → 在配置页面添加安全提示文案，告知用户 Key 存储在本地。后续版本可评估使用 chrome.storage.session + 内存加密方案
- **[性能] 流式输出兼容性** → 若用户配置的模型服务不支持 `stream: true`，降级为普通非流式请求（`stream: false`），并提示用户当前服务不支持流式输出
- **[稳定性] LLM API 跨域请求** → manifest.json 需添加 `host_permissions` 允许跨域 fetch；用户可能配置无法访问的 API 地址，需做好错误提示
- **[兼容性] 不同模型服务 API 差异** → 仅保证 OpenAI 兼容协议（`/v1/chat/completions`）的兼容性，用户需自行确认所选服务兼容
- **[数据丢失] chrome.storage.local 可能在用户手动清理时被清空** → 这是预期行为，聊天记录为会话辅助用途，非关键数据
