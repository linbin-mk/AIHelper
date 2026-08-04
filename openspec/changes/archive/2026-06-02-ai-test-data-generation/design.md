## Context

aiHelper 是一个 Chrome 扩展（Side Panel），提供 AI 聊天、请求监控、资源管理（Git 项目代码同步）等功能。当前 AI 聊天已支持通过 `search_project_code`、`get_project_file`、`list_project_files` 三个工具分析已缓存的项目代码，但仅限于代码搜索和查看，无法执行实际操作。

用户在测试场景中频繁需要在管理页面造测试数据，当前流程需要手动打开 API 工具（如 Postman）构造请求，效率低。利用已有的代码分析能力 + 页面上下文 + 鉴权信息，可以实现 AI 自动生成并执行测试数据创建。

### 现有架构

- **无 Content Scripts**：页面交互完全通过 Service Worker (`background.js`) 的 `webRequest` API 捕获请求
- **工具系统**：`TOOLS` 常规定义 + `executeToolCall()` switch 分发，无动态注册
- **消息气泡**：固定类型（user/assistant/error/info/thinking/tool/tool-result），不支持交互式组件
- **Agent Loop**：`startAgentLoop()` 循环调用 LLM → 执行工具 → 继续，最终渲染 Markdown 回复
- **Auth 能力**：`chrome.cookies.getAll()` 可获取当前页面 Cookie（目前仅统计数量）
- **请求捕获**：`webRequest.onBeforeRequest` 可捕获页面发出的 HTTP 请求（含请求头和 body）

## Goals / Non-Goals

**Goals:**
- AI 自动分析当前页面 + 项目代码，推断创建数据的 API 接口和参数结构
- 聊天框中渲染交互式"任务卡片"，展示操作摘要和数据预览，包含"执行"按钮
- 点击执行后，自动提取页面鉴权信息并发起批量 API 请求创建测试数据
- 执行过程中任务卡片实时更新进度（已创建数/成功/失败），完成后展示结果

**Non-Goals:**
- 不处理复杂的前端表单验证逻辑（如联动下拉框校验）
- 不支持修改已有数据的"编辑/删除"场景（仅创建）
- 不处理文件上传类接口（如头像上传）
- 不持久化任务卡片到历史记录（刷新后过期）

## Decisions

### Decision 1: 任务卡片通过消息类型扩展实现

**方案**: 扩展现有 `window.chatMessages` 数据结构，新增 `task_card` 消息类型。任务卡片作为特殊类型的 assistant 消息存储和渲染。

```javascript
{
  type: 'task_card',
  role: 'assistant',
  content: '批量创建 10 个用户',
  taskCard: {
    id: 'task_xxx',
    status: 'pending' | 'running' | 'done' | 'failed',
    apiConfig: { url, method, headers, bodyTemplate },
    batchConfig: { count, currentIndex, results: [] },
    templatePreview: [...],
  }
}
```

**替代方案考虑**: 使用 Markdown 内嵌 JSON code block 标记任务卡片，在渲染时解析。被拒绝原因：解析不可靠、数据量大时 Markdown 渲染异常、难以复用 LLM 结构化输出。

**理由**: 结构化数据直接存储在 chatMessages 中，渲染函数根据 `type` 字段分支创建不同的 DOM 结构。

### Decision 2: 鉴权信息通过 Content Script 注入获取

**方案**: 新增 Content Script，注入到用户当前页面，通过 `window.localStorage`、`document.cookie`、`XMLHttpRequest.prototype` 拦截等方式提取鉴权 token。

Content Script 通过 `chrome.runtime.sendMessage` 将 token 返回给 panel。

**替代方案考虑**: 仅使用 `chrome.cookies.getAll()` 获取 Cookie。被拒绝原因：现代 Web 应用常用 `Authorization: Bearer <token>` header 认证，token 存储在 localStorage 中，仅 Cookie 不足。

**理由**: Content Script 能访问页面 DOM/JS 上下文，可获取 localStorage 中的 token、拦截 XHR 请求中的 Authorization header。Cookie 作为补充手段。

### Decision 3: 批量请求通过 Background Service Worker 代理

**方案**: 任务卡片的执行逻辑由 Background Service Worker 完成。Panel 通过消息通知 Background 要执行的请求配置（URL、方法、headers、body 模板），Background 使用 `fetch()` 批量发起请求，将结果通过消息推回 Panel 更新进度。

```
Panel (chat.js)                     Background (background.js)
     │                                      │
     ├─ BATCH_EXECUTE(taskConfig) ──────────►│
     │                                      ├─ fetch() x N
     │◄─ BATCH_PROGRESS({ current, result })─┤
     │◄─ BATCH_COMPLETE({ results })─────────┤
```

**替代方案考虑**: 在 Panel 中直接用 `fetch()` 调用。被拒绝原因：Panel 页面与目标 API 存在跨域限制，Service Worker 无此限制（manifest 中已声明 `host_permissions: ["<all_urls>"]`）。

**理由**: Service Worker 环境天然不受 CORS 限制，且已有的 `background.js` 已经处理了请求捕获和消息路由，扩展成本低。

### Decision 4: 执行按钮触发新的 Agent Loop

**方案**: 点击"执行"按钮后，生成一条合成用户消息（如"执行任务 task_xxx: 请开始批量创建数据"），调用 `startAgentLoop()` 启动新的 Agent 对话。Agent 在 Loop 中调用 `batch_create_data` 工具（每次创建一条），Panel 根据工具返回结果更新任务卡片进度。

**替代方案考虑**: 直接在前端 JS 中解析 taskConfig 并调用 Background 执行，不经过 AI Agent。被拒绝原因：AI 在执行过程中可能需要根据失败响应动态调整参数（如处理重复数据错误），通过 Agent Loop 更灵活。

**理由**: 保留 AI 的推理能力处理执行过程中的异常情况，同时利用 Agent Loop 的轮次控制（`MAX_TOOL_ROUNDS`）避免无限循环。

## Risks / Trade-offs

- **[安全风险] Content Script 访问页面 localStorage** → 只在用户主动点击"执行"按钮后才通过 `chrome.scripting.executeScript` 注入鉴权提取脚本，不在页面加载时自动注入；提取的 token 仅用于当次任务执行。
- **[隐私风险] Token 通过消息通道传输** → token 仅在 Service Worker 内存中使用，不持久化到 storage；任务执行完成后立即清除。
- **[准确性风险] AI 对 API 接口的判断可能不准确** → 任务卡片展示完整的请求预览供用户确认后再执行；用户可手动修改请求参数模板。
- **[性能风险] 大批量创建（100+条）可能阻塞** → 设置默认批量上限（100条），超过需用户确认；Background 使用并发控制（最大并发 5 个请求）。
- **[兼容性风险] 部分网站禁止 Content Script 注入（如 chrome:// 页面）** → 检测注入失败后回退到 Cookie-only 鉴权模式，并在任务卡片上提示可能鉴权不完整。
