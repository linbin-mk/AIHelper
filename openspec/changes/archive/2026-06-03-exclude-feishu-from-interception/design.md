## Context

AI Helper 扩展通过三层机制拦截和捕获页面网络请求：
1. **Content Script (MAIN world)**：`request-interceptor.js` 在页面主执行环境中 monkey-patch `window.fetch` 和 `XMLHttpRequest`，捕获请求/响应体并发送给扩展
2. **Content Script (ISOLATED world)**：`request-interceptor-bridge.js` 作为桥接，将消息从 MAIN 环境转发到 background
3. **webRequest 监听**：`background.js` 中注册的 `onBeforeRequest`、`onBeforeSendHeaders`、`onCompleted` 监听器，捕获请求元数据和状态

飞书页面有严格的 CSRF/XSRF 安全机制，扩展的 monkey-patching 会触发其安全防护，导致页面白屏、接口调用失败等问题。用户无法正常使用飞书文档。

当前代码对所有 URL（`<all_urls>`）注入拦截脚本，无任何域名排除逻辑。

## Goals / Non-Goals

**Goals:**
- 排除 `*.feishu.cn` 域名下的所有页面，使其不受扩展拦截影响
- 三层防御：manifest 层、webRequest 层、content script 内部守卫
- 同时覆盖 Chrome 和 Firefox 扩展

**Non-Goals:**
- 不添加飞书文档内容解析/提取功能（本变更仅解决"不干扰"问题）
- 不改变其他域名的拦截行为
- 不提供可配置的域名排除列表（保持硬编码飞书域名）

## Decisions

### 决策 1：三层排除机制

| 层级 | 文件 | 作用 | 失败影响 |
|------|------|------|----------|
| Manifest | `manifest.json` | `exclude_matches` 阻止 Chrome 注入 content scripts | 这是最干净的方式，manifest 排除后脚本根本不会被注入 |
| webRequest | `background.js` | `isExcludedUrl()` 在三个监听器中过滤 | 即使 content script 某种方式被注入，background 也不会记录请求 |
| Content Script | `request-interceptor.js` | 入口处检查 `location.hostname` 并提前返回 | 终极防线——即使前两层失效，脚本自身也拒绝执行拦截 |

**理由**：防御纵深。飞书的稳定性是第一优先级，必须确保在任何异常情况下都不会拦截飞书请求。

### 决策 2：使用 manifest `exclude_matches` 而非仅运行时过滤

**方案 A**（选用）：manifest 添加 `exclude_matches` + background 过滤 + content script 守卫
**方案 B**（弃用）：仅在 background 和 content script 中运行时过滤

选择方案 A 因为：
- Manifest `exclude_matches` 是 Chromium 原生机制，在脚本注入阶段就排除，性能最优
- 但同时保留 background 和 content script 的运行时守卫，作为防御纵深
- 实际上，Firefox 支持 `exclude_matches`（WebExtensions 标准），兼容性无问题

### 决策 3：硬编码飞书域名

不使用可配置的域名列表，直接硬编码 `feishu.cn`。理由：
- 飞书域名的排除是安全机制，不应由用户随意更改
- 简化实现，减少配置管理和 UI 复杂度
- 如果后续有其他类似需求（如 Lark 国际版 `larksuite.com`），可以再扩展

### 决策 4：平台各自编辑，content script 通过 sync.sh 同步

根据项目 AGENTS.md 规范：
- `chrome-extension/src/content/request-interceptor.js` 是 content script 的真相源
- Chrome 的 `manifest.json` 和 `background.js` 直接编辑 `chrome-extension/`
- Firefox 的 `manifest.json` 和 `background.js` 直接编辑 `firefox-extension/`
- `request-interceptor.js` 的修改会自动通过 `sync.sh` 同步到 Firefox

## Risks / Trade-offs

| 风险 | 缓解措施 |
|------|----------|
| 用户在飞书页面打开扩展后，无法查看飞书的网络请求 | 用户一开始也无法正常查看（扩展干扰导致飞书功能异常）。排除后至少飞书能正常使用，这是净收益 |
| 如果有其他类似安全机制的服务（如 Lark 国际版）也需要排除 | 本变更加 `EXCLUDED_HOSTS` 数组结构，后续添加域名只需追加一行 |
| Content script 即使被 manifest 排除，也可能通过 `injectInterceptor()` 动态注入 | `injectInterceptor()` 中已添加 `isExcludedUrl()` 检查，阻止动态注入 |
