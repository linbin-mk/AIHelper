## Context

当前系统架构：

```
panel/chat.js (AI 对话)         background.js (消息路由)       content scripts (页面注入)
─────────────────────       ──────────────────────       ────────────────────────────
TOOLS 数组 (14个工具)         GET_PAGE_CONTEXT ────────▶ page-context.js → return
executeToolCall(name,args)   GET_PAGE_INTERACTIVE ─────▶ page-interactive-elements.js → return
                             CLICK_ELEMENT ────────────▶ chrome.storage → element-click.js → sendMessage
                             REFRESH_PAGE ─────────────▶ chrome.tabs.reload
                             EXECUTE_REQUEST ──────────▶ chrome.storage → execute-request-inject.js → sendMessage
```

5 条路由的完整基础设施都已实现，但 `TOOLS` 数组中没有对应定义，`executeToolCall()` 中也没有对应处理分支。AI 调用这些工具名时会走到 `executeToolCall` 底部返回 `"未知工具"` 错误。

另外，`CLICK_ELEMENT` 和 `EXECUTE_REQUEST` 采用的是 fire-and-forget 模式：background.js 立即返回 ACK，实际结果通过独立的 `CLICK_ELEMENT_RESULT` / `EXECUTE_REQUEST_RESULT` 消息异步到达 panel。当前 panel.js 未监听这些结果消息。

## Goals / Non-Goals

**Goals:**
- 让 AI 能通过 function calling 调用 5 个已有基础设施
- 全部改动限定在 `chat.js`，不修改 background.js 和内容脚本
- 工具返回值格式与现有内容脚本输出一致

**Non-Goals:**
- 不新增页面数据采集能力（那是 `fetch-page-css-and-source` 的职责）
- 不在技能系统中为这些工具注册 handler（保持简单：直接硬编码在 executeToolCall）
- 不调整 `CLICK_ELEMENT` / `EXECUTE_REQUEST` 的 background.js 通信模式

## Decisions

### Decision 1: 工具注册方式 — 硬编码在 TOOLS 数组 + executeToolCall

**选择**: 沿用现有 14 个工具的模式，直接在 `chat.js` 中定义和实现。

**替代方案**: 通过技能系统 `getTools()` 注册，像 `browser-page-refresh` spec 描述的那样。

**理由**: 
- 当前所有技能 `getTools()` 都返回 `[]`（skill-registry.js:146），技能系统没有实际 tool 机制
- 引入技能 tool handler 需要改 skill-registry.js 和加载器，范围过大
- 先用简单方式让工具可用，后续可逐步迁移到技能系统

### Decision 2: 同步工具 (get_page_context, get_page_interactive_elements, refresh_page) 的实现方式

**方案**: sendMessage → 等待 response → 返回 JSON.stringify(response.data)

```
chat.js → {type: 'GET_PAGE_CONTEXT'} → background.js → inject → content script
chat.js ← {type: 'PAGE_CONTEXT_DATA', data: result} ← background.js ← return result
```

这三个工具是标准 request-response 模式，handler 只需 `sendMessage` + Promise 包装。

### Decision 3: 异步工具 (click_element, execute_request) 的实现方式

**方案**: sendMessage → 获取 ACK → 注册一次性 `chrome.runtime.onMessage` 监听器等待真实结果

```
chat.js → {type: 'CLICK_ELEMENT', data: {selector}} → background.js
         # background.js 写入 storage → 注入脚本 → 返回 SENT
chat.js ← {type: 'CLICK_ELEMENT_SENT'}               ← background.js (ACK)
         
         # 内容脚本执行...
         
background.js ← CLICK_ELEMENT_RESULT ← content script
background.js → sendToPanel(CLICK_ELEMENT_RESULT, data)
chat.js 监听 ← chrome.runtime.onMessage 捕获 → resolve Promise
```

**关键**: 需要通过唯一标识（requestId）将 ACK 之后的异步结果关联回正确的 Promise。方案是在请求时生成 `requestId = 'req_' + Date.now()`，在 storage key 和监听器匹配时使用。但由于 `CLICK_ELEMENT` 的 storage key 格式为 `click_elem_*` 且 background.js 不传回 requestId，简化做法为：如果同一时间只有一个 `click_element` 调用（顺序调用），可以直接捕获下一条 `CLICK_ELEMENT_RESULT` 消息。

**保守策略**: 使用 `new Promise` + 一次性 `onMessage` 监听器，匹配消息 type，超时 30s 兜底。

### Decision 4: click_element 点击后的页面变化等待

`element-click.js` 已内置 `pageChanged` 检测：点击后轮询 3s 检查 `window.location.href` 是否变化。工具返回的 `CLICK_ELEMENT_RESULT` 已包含 `pageChanged` 字段。不需要额外处理。

### Decision 5: execute_request 是否遵循两段式约束

`execute_request` 的 handler **不**添加两段式约束（必须用户先授权），因为：
- 约束由技能 prompt 层面控制（`test-data-generation` skill prompt 已有此规则）
- 工具 handler 层保持纯净：接收参数 → 执行 → 返回结果
- AI 对 `execute_request` 的使用频率由 LLM 的 system prompt 和 skill prompt 控制

## Risks / Trade-offs

| 风险 | 缓解措施 |
|------|---------|
| `click_element` 和 `execute_request` 的异步结果监听可能收不到 | 设置 30s 超时，超时返回 `{ error: "timeout", message: "未在30秒内收到结果" }` |
| 同时多次调用 `click_element` 导致结果错乱 | 当前 AI tool call 是串行执行的（每个 tool_call 等待完成后才发下一条消息），不存在并发问题 |
| `get_page_interactive_elements` 返回最多 100 个元素，可能超 token | content script 已做截断（MAX_ELEMENTS=100），无需额外处理 |
| execute_request 的 fetch 在页面上下文执行，受页面 CSP 限制 | 返回 network_error 给 AI，由 AI 决定下一步 |
| `refresh_page` 后页面内容变化，AI 上下文过期 | 工具返回刷新后的 URL，AI 可重新调用 `get_page_interactive_elements` 获取新页面状态 |

## Open Questions

- `get_captured_request_detail` 工具也有基础设施（`QUERY_REQUEST_DETAIL` 路由），是否一并暴露？（当前 scope 外，可在后续单独处理）
