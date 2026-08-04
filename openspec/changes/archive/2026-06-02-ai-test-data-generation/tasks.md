## 1. Content Scripts - 页面上下文与鉴权提取

- [x] 1.1 创建 `chrome-extension/src/content/page-context.js`，实现页面 DOM 信息采集：document.title、可见表单字段（input/select/textarea 的 name/type/label/placeholder）、页面 URL
- [x] 1.2 创建 `chrome-extension/src/content/auth-extractor.js`，实现鉴权信息提取：localStorage 中的 token/accessToken/Authorization key、document.cookie
- [x] 1.3 在 `manifest.json` 中声明 Content Script 相关权限（`scripting`），配置 `host_permissions` 支持动态注入

## 2. Background Service Worker - 消息路由与批量请求代理

- [x] 2.1 在 `background.js` 中新增消息路由：`GET_PAGE_CONTEXT`（调用 chrome.scripting.executeScript 注入 page-context.js）、`EXTRACT_AUTH`（注入 auth-extractor.js）
- [x] 2.2 在 `background.js` 中新增 `BATCH_EXECUTE` 消息处理：接收任务配置（url/method/headers/bodyTemplate/count），用 fetch() 批量发起请求（最大并发 5）
- [x] 2.3 实现 `BATCH_PROGRESS` 回调推送：每条请求完成后通过 `chrome.runtime.sendMessage` 推送进度（index/status/result）给 Panel
- [x] 2.4 实现 `BATCH_CANCEL` 消息处理：通过 AbortController 取消进行中的批量请求

## 3. AI 工具注册 - 新的 Tool Definitions

- [x] 3.1 在 `chat.js` 的 `TOOLS` 数组中新增 `get_page_context` 工具定义（name/description/parameters），参数为空
- [x] 3.2 在 `chat.js` 的 `TOOLS` 数组中新增 `extract_auth_token` 工具定义，参数为空
- [x] 3.3 在 `chat.js` 的 `TOOLS` 数组中新增 `batch_create_data` 工具定义，参数包含 url/method/headers/bodyTemplate/count/startIndex
- [x] 3.4 在 `chat.js` 的 `executeToolCall()` 函数中新增三个工具的分发逻辑（switch case）

## 4. 任务卡片 UI - 渲染与交互

- [x] 4.1 在 `chat.js` 中实现 `renderTaskCard(taskCardData)` 函数：创建带标题、数据模板预览表格、操作按钮区域、状态指示器的卡片 DOM 结构
- [x] 4.2 在 `chat.js` 中实现 `updateTaskCard(taskId, updates)` 函数：更新指定任务卡片的进度条、状态文本和按钮状态
- [x] 4.3 在 `panel.css` 中新增 `.task-card` 系列样式：卡片边框/阴影、模板预览表格、进度条动画、状态颜色（pending=蓝/running=黄旋转/done=绿/failed=红）
- [x] 4.4 在 `panel.js` 的 `loadChatHistory()` 中支持 `task_card` 类型消息的重新渲染，已完成任务禁用执行按钮
- [x] 4.5 实现任务卡片\"取消\"按钮逻辑：发送 `BATCH_CANCEL` 消息到 Background，更新卡片状态为 `cancelled`
- [x] 5.1 实现任务卡片\"执行\"按钮点击处理：调用 `extract_auth_token` 获取最新鉴权信息
- [x] 5.2 构造合成消息（含 taskConfig 和鉴权信息），调用 `startAgentLoop()` 启动新 Agent Loop
- [x] 5.3 Agent 执行 `batch_create_data` 工具时，Background 返回的每条进度通过 `updateTaskCard()` 刷新卡片 UI
- [x] 5.4 同一时间只允许一个任务处于 `running` 状态，新任务执行前检查是否有进行中的任务
- [x] 6.1 实现鉴权信息脱敏：token 在返回给 AI/渲染到 UI 时仅显示前 8 位 + `****` + 后 4 位
- [x] 6.2 完整 token 仅保存在 Background Service Worker 内存中，任务执行完成后清除
- [x] 6.3 token 不写入 chrome.storage、不渲染到 DOM 完整文本、不发送给 LLM

## 7. 系统消息增强 - 页面上下文注入

- [x] 7.1 在 `chat.js` 的 `buildRequestContext()` 中，通过 `get_page_context` 获取当前页面信息并注入到系统消息中
- [x] 7.2 注入内容包含：当前页面 URL、标题、表单字段摘要，帮助 AI 理解用户所在页面

## 8. 端到端验证

- [x] 8.1 在真实测试管理页面（如"用户管理"）验证完整流程：发送"造10条测试数据" → AI 分析代码和页面 → 输出任务卡片 → 点击执行 → 数据创建成功
- [x] 8.2 验证异常场景：鉴权过期提示、请求失败部分成功、取消执行、批量上限 100 条
- [x] 8.3 验证任务卡片在聊天历史持久化后重新加载的表现
