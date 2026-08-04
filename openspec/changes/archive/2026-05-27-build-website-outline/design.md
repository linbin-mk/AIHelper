## Context

AIHelper 是 Chrome 浏览器扩展（Manifest V3），目前具备网络请求监控、AI 对话、Skill 系统、会话管理和记忆系统。Skill 系统通过 `window.__registerSkill()` 自注册浏览器扩展技能，每个 Skill 可提供 AI 工具（OpenAI function calling 格式）。页面交互通过 `chrome.scripting.executeScript` 注入 Content Script 实现。

记忆系统已支持按域名分类存储 Markdown 文件到 IndexedDB，路径格式为 `{hostname}/{文件名}.md`，并暴露了 `search_memories(domain)` 和 `get_memory_file(path)` 工具给 AI。

当前缺失的能力是：主动遍历网站导航结构、自动收集每个功能页面的描述信息、生成结构化的系统功能地图。

## Goals / Non-Goals

**Goals:**
- 提供 AI 工具自动识别页面主导航菜单结构（导航栏、侧边栏、Tab 栏等）
- 支持依次访问每个导航入口并提取页面功能摘要（标题、主要功能描述、可见操作按钮）
- 生成结构化 Markdown 系统功能地图，存入记忆文件夹按域名归档
- 与现有 Skill 注册机制、Content Script 注入机制、记忆系统无缝集成

**Non-Goals:**
- 不支持多级深层菜单递归遍历（仅遍历一级导航入口）
- 不支持需要登录认证才能访问的页面
- 不处理 iframe 内的导航
- 不生成非 Markdown 格式（如 JSON/YAML）
- 不支持动态加载（infinite scroll）页面的全量内容提取

## Decisions

### 1. Content Script 采用单一脚本 + 命令参数模式
**选择**: 一个 `outline-scanner.js`，通过 `window.__OUTLINE_MODE` 控制扫描 vs 捕获模式。

**替代方案**: 两个独立 Content Script（`nav-scanner.js` + `page-capture.js`）。
**理由**: 两种模式共享导航识别逻辑（DOM 选择器策略），合并为单一脚本减少文件数和注入开销。

### 2. 页面功能摘要提取策略：基于 DOM 语义元素而非全文截断
**选择**: 从目标页面提取以下结构化信息：
- 页面标题/主标题（`<h1>`）
- 可见的功能按钮/链接（`button`, `a[href]` 中非导航的语义元素）
- 表单区域描述（label 文本）
- 主要内容区域的文本摘要（取前 300 字符）
- 页面 URL

**替代方案**: 截取整个 `<body>` innerText 前 N 字符。
**理由**: 原始文本噪音大（包含导航、页脚等重复内容），结构化提取能更精准反映页面功能。

### 3. 导航识别策略：优先级链
**选择**: 按以下优先级识别导航容器：
1. `<nav>` 标签
2. `[role="navigation"]`
3. 常见导航 class（`.nav`, `.navbar`, `.sidebar-nav`, `.menu`, `.el-menu`, `.ant-menu`）
4. 页面顶部区域中的链接列表（取当前视口上方 100px 内密度最高的链接区域）

**理由**: 覆盖主流 UI 框架（Bootstrap, Element UI, Ant Design）和语义化 HTML。

### 4. 页面切换策略：URL 直接跳转为主，DOM 点击为备
**选择**: 优先使用 `chrome.tabs.update` 直接导航到导航项的 `href` 目标 URL；当导航项无 `href`（SPA 路由）时，注入 Content Script 执行 `el.click()` 触发路由切换。

**理由**: URL 跳转更可靠（页面完整加载），避免 SPA 路由切换的时序问题（需等待异步渲染）。同时保留 DOM 点击能力以支持无 href 的 SPA。

### 5. 系统功能地图 MD 的生成由 AI 负责，工具仅负责保存
**选择**: `build_outline_map` 工具接收 AI 已格式化好的 Markdown 内容，仅负责写入记忆系统。格式化逻辑不放在 Content Script 或 Background 中。

**理由**: AI 具备更强的自然语言总结能力，可根据扫描结果生成更精准的功能描述；工具层保持简单，专注 IO 操作。

### 6. 工具数量：3 个
**选择**: `scan_navigation_menu`（扫描导航）、`navigate_to_section`（访问页面+捕获）、`build_outline_map`（保存到记忆）。

**替代方案**: 4 个工具（拆分为独立导航和独立捕获）；2 个工具（合并扫描和捕获）。
**理由**: 3 个工具的粒度合理：扫描和访问是独立的原子操作，AI 可在扫描后让用户确认再执行访问，提升可控性。

### 7. 最大探索次数限制
**选择**: `scan_navigation_menu` 工具返回的导航项数量由 `maxItems` 参数控制（默认 30，上限 40）。AI 在 Prompt 规则中被引导，探索实际页面时不超过此数量，并在探测完成后明确告知用户已探测项数。

**替代方案**: 无上限，由 AI 自主决定。
**理由**: 无上限可能导致 AI 长时间循环调用工具消耗大量 token，且很多后台系统的导航项数量差异大（5～50+）。设上限提供可控性，用户可通过调整参数扩大范围。

### 8. 探索过程 Tab 切换与用户提示策略
**选择**: `navigate_to_section` 每访问一个目标页面后，自动切回原始起始页面（记录起始 URL）。在 Panel 聊天区域显示进度提示（如"正在探索第 3/12 项：用户管理"）。用户点击"停止"按钮会触发 `AbortController.abort()`，终止当前探索。

**替代方案**: 不切回原始页面，始终停留在最后访问的页面。
**理由**: 用户需要在探索完成后回到原始页面继续工作，自动切回减少用户手动操作。进度提示让用户感知系统状态，避免误以为卡死。

## Risks / Trade-offs

- **[导航识别不准确]** 部分网站使用非标准导航结构（如 Canvas 渲染的菜单），`scan_navigation_menu` 可能漏掉或误判 → 工具返回结果中包含置信度标记，AI 可要求用户手动补充
- **[页面加载时序]** 导航到新 URL 后，页面可能加载较慢，`navigate_to_section` 注入 Content Script 时 DOM 尚未渲染完成 → 使用 `chrome.tabs.onUpdated` 监听 `complete` 状态后再注入，并设置 10 秒超时
- **[跨域限制]** Content Script 仅在匹配 `<all_urls>` 的 host_permissions 下注入，某些受限页面（chrome://、extension pages）无法扫描 → 工具返回明确错误信息，AI 告知用户跳过
- **[大导航菜单超时]** 如果导航栏有 50+ 个一级入口，逐一访问耗时过长 → 工具限制单次调用最多返回 30 个导航项，AI 可分批处理；页面访问超时 15 秒/个
- **[频繁切回页面影响体验]** 每完成一次 `navigate_to_section` 都需要切回原始页面，频繁切换可能导致页面闪烁 → 已知限制，用户可在探索期间不操作页面；在 Panel 中通过进度提示（"正在探索..."）明确告知状态
- **[探索被用户中断后的状态恢复]** 用户点击停止后，部分导航项可能已完成捕获并传给 AI，部分未完成 → 停止信号通过 `AbortController` 传播，已完成的工具调用结果保留在对话消息中，AI 应根据已有结果生成不完整的网站大纲（标注"探索被中断"）

## Open Questions

- 暂无
