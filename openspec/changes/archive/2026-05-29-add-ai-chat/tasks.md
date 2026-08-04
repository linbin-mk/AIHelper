## 1. 基础设置

- [x] 1.1 更新 manifest.json，确保 `host_permissions` 包含 `<all_urls>`，支持跨域 fetch 调用 LLM API
- [x] 1.2 创建 `src/panel/chat.js` 和 `src/panel/config.js` 空文件
- [x] 1.3 在 `panel.html` 中引入新的 JS 文件（chat.js、config.js）

## 2. Tab 切换 UI

- [x] 2.1 重构 `panel.html`，添加 Tab 栏（"请求监控" / "AI 聊天"两个按钮）
- [x] 2.2 将现有请求监控内容包裹在 `#tab-monitor` 容器中
- [x] 2.3 新增 `#tab-chat` 容器（聊天面板，默认隐藏）
- [x] 2.4 新增 `#tab-config` 容器（配置面板，默认隐藏）
- [x] 2.5 在 `panel.js` 中实现 Tab 切换逻辑（点击 Tab 时切换显示对应容器，高亮当前 Tab）
- [x] 2.6 添加 Tab 切换相关的 CSS 样式

## 3. 模型配置

- [x] 3.1 在 `#tab-config` 中构建配置表单（API Base URL、API Key（密码字段）、Model Name、Model Type 输入框，保存/返回按钮）
- [x] 3.2 在 `config.js` 中实现配置读取逻辑：从 chrome.storage.local 加载 `ai_helper_model_config`
- [x] 3.3 在 `config.js` 中实现配置保存逻辑：表单校验（必填项非空，URL 以 http:// 或 https:// 开头），写入 chrome.storage.local
- [x] 3.4 实现首次使用检测：无配置时自动跳转到配置页面，显示引导提示
- [x] 3.5 API Key 输入框添加安全提示文案："API Key 仅存储在本地"
- [x] 3.6 添加配置页面的 CSS 样式

## 4. 聊天记录存储

- [x] 4.1 在 `panel.js` 中实现 `loadChatHistory()` 函数：从 chrome.storage.local 读取 `ai_helper_chat_history`，返回消息数组（缺省为空数组）
- [x] 4.2 在 `panel.js` 中实现 `saveChatHistory(messages)` 函数：将消息数组写入 chrome.storage.local，自动截断到最近 200 条
- [x] 4.3 在 `panel.js` 中实现 `clearChatHistory()` 函数：清空 storage 中的聊天记录并刷新 UI
- [x] 4.4 页面加载时调用 `loadChatHistory()` 恢复聊天记录到 UI

## 5. 聊天 UI 构建

- [x] 5.1 在 `#tab-chat` 中构建聊天区域结构：消息列表容器（`#chatMessages`）、输入区域（`#chatInput` + `#sendBtn` + `#stopBtn`）、加载指示器
- [x] 5.2 在 `#tab-chat` 中添加工具栏：清空聊天按钮、配置入口按钮
- [x] 5.3 在 `chat.js` 中实现消息渲染函数：用户消息气泡（右对齐）和 AI 消息气泡（左对齐），支持增量更新（`updateAIBubble(element, newText)`）
- [x] 5.4 实现错误/超时消息气泡样式（红色背景）
- [x] 5.5 实现空状态提示："开始和 AI 聊聊吧"（无聊天记录时显示）
- [x] 5.6 实现聊天区域自动滚动到底部（新消息到达时和流式输出过程中）
- [x] 5.7 实现"用户手动滚动时不再强制滚动"逻辑（检测是否在底部附近）
- [x] 5.8 添加聊天面板的 CSS 样式

## 6. LLM API 调用（流式 + 非流式）

- [x] 6.1 在 `chat.js` 中实现 `buildMessages(userMessage)` 函数：构建 messages 数组（system 消息含请求上下文 + 历史消息 + 当前用户消息）
- [x] 6.2 在 `chat.js` 中实现 `streamLLM(messages, onToken, signal)` 函数：使用 `fetch()` 调用 OpenAI 兼容 API（POST `{baseUrl}/v1/chat/completions`，`stream: true`），通过 `response.body.getReader()` 逐块读取 SSE 数据
- [x] 6.3 在 `chat.js` 中实现 SSE 解析器：按行分割 `Uint8Array` 数据，识别 `data: ` 前缀，解析 JSON chunk，提取 `choices[0].delta.content`，检测 `data: [DONE]` 流结束标记
- [x] 6.4 实现 `callLLMFallback(messages)` 非流式降级函数：当流式请求失败（API 返回非流式响应）时，自动降级为 `stream: false` 的普通请求
- [x] 6.5 实现 API 错误处理：网络错误、401/403（Key 无效）、404、超时（120s AbortController），每种错误返回中文友好提示
- [x] 6.6 实现发送/停止按钮状态管理：请求中显示停止按钮（替代发送按钮），点击停止调用 `AbortController.abort()`；完成后恢复发送按钮

## 7. Agent 工具调用（Function Calling）

- [x] 7.1 在 `chat.js` 中定义 tools 数组，包含 `get_captured_requests` 工具（无参数，返回当前请求列表）
- [x] 7.2 在 `chat.js` 中实现 Agent 循环逻辑（兼容流式输出）：流式接收 LLM 响应 → 检测 `delta.tool_calls` → 如有工具调用则中止当前流 → 执行工具 → 将结果追加到 messages → 重新发起流式请求 → 直到获得纯文本回复
- [x] 7.3 添加最大循环次数限制（最多 3 轮工具调用），防止死循环
- [x] 7.4 在 `background.js` 中新增 `QUERY_REQUESTS_FOR_AI` 消息路由，返回请求数据的 JSON 数组（含 method、path、status、timestamp）
- [x] 7.5 实现工具调用超时处理（10 秒未收到 Background 响应则返回失败信息）

## 8. 请求上下文注入

- [x] 8.1 在 `chat.js` 的 `buildMessages()` 中实现上下文注入逻辑：通过消息查询 Background 获取当前请求数据
- [x] 8.2 构建 system 消息，包含当前页面 URL 和请求列表摘要（JSON 格式）
- [x] 8.3 实现上下文截断：请求数据超过 5000 字符时只保留最近的数据
- [x] 8.4 在 `background.js` 中新增 `QUERY_TAB_URL_FOR_AI` 消息路由，返回当前标签页 URL

## 9. 集成测试

- [ ] 9.1 测试 Tab 切换：监控 Tab ↔ 聊天 Tab 切换正常，状态保持
- [ ] 9.2 测试模型配置：保存配置 → 刷新面板 → 配置正确恢复
- [ ] 9.3 测试流式聊天功能：发送消息 → AI 逐字流式输出 → 刷新面板 → 完整聊天记录恢复
- [ ] 9.4 测试中断生成：发送消息 → AI 流式输出中点击停止 → 已生成内容保留 → 输入框恢复
- [ ] 9.5 测试错误场景：错误 Key → 401 提示；无效 URL → 网络错误提示；断开网络 → 友好提示
- [ ] 9.6 测试 Agent 工具调用：询问 AI "当前有哪些请求"→ AI 调用 get_captured_requests 工具 → 返回请求数据
- [ ] 9.7 测试清空聊天记录：点击清空 → 确认 → 记录被清除
- [ ] 9.8 在 Chrome 扩展管理页面加载扩展，验证所有功能正常
