## Context

AIHelper 使用三层架构（Panel ↔ Background ↔ Content Script）来让 AI 与浏览器页面交互。当前 Page 类工具包括 `get_page_context`（URL+表单字段）、`get_page_interactive_elements`（可交互元素列表）、`click_element`（点击元素）。这些工具均为动态注入内容脚本模式：Panel 发送消息到 Background，Background 调用 `chrome.scripting.executeScript` 注入脚本到当前 tab，脚本执行后通过回调或 `chrome.runtime.sendMessage` 返回结果。

缺失能力：AI 无法获取页面的 CSS 样式信息和 HTML 源码，导致 UI 分析、样式复刻、DOM 结构理解等任务只能基于猜测。

## Goals / Non-Goals

**Goals:**
- 提供 `get_page_css` 工具，支持获取指定元素的计算样式（computed style）或页面全部样式表（stylesheet）原始内容
- 提供 `get_page_source` 工具，支持获取完整页面或指定选择器元素的 HTML 源码（DOM 序列化）
- 遵循现有动态注入模式，与现有工具体系保持一致
- 支持截断输出，防止单次返回数据过大

**Non-Goals:**
- 不修改现有内容脚本或消息路由逻辑
- 不实现 CSS 变更/DOM 修改（只读操作）
- 不处理 iframe 内部内容
- 不支持 Shadow DOM 穿透（初期可后续扩展）

## Decisions

### Decision 1: 动态注入，非静态注册

**选择**: 采用动态注入（`chrome.scripting.executeScript`），与 `page-context.js`、`page-interactive-elements.js` 模式一致。

**理由**:
- 不需要在所有页面上持续运行，按需注入减少资源消耗
- 与现有 6 个动态注入脚本的模式保持一致
- manifest.json 已包含 `scripting` 权限，无需额外配置

**替代方案**: 静态注册在 manifest.json 中 —— 不需要，CSS/源码提取仅在 AI 需要时调用。

### Decision 2: Background 通过 callback 获取返回值

**选择**: 在 Background 的 `handleInjectScript` 中注入脚本，脚本通过函数返回值（return）传递结果，Background 的 callback 接收后转发给 Panel。

**理由**:
- `page-context.js` 和 `page-interactive-elements.js` 均使用此模式
- `chrome.scripting.executeScript` 的 callback 直接接收脚本返回值 `result[0].result`
- 无需 `chrome.runtime.sendMessage` 间接转发，减少中间步骤

**替代方案**: 通过 `chrome.storage.local` 传参 + `sendMessage` 返回 —— 更复杂，适用于需要参数传递的场景（如 `element-click.js`），但 CSS/Source 工具无需从外部传入复杂参数，目标选择器可通过参数注入。

### Decision 3: CSS 工具使用参数注入选择器

**选择**: 通过 `chrome.scripting.executeScript` 的 `args` 参数将 `selector`（CSS选择器）和 `mode`（`computed` 或 `stylesheet`）注入到脚本中。

**理由**:
- `executeScript` 原生支持 `args` 参数，比 `chrome.storage.local` 更简洁
- `page-context.js` 实际上也是通过脚本直接访问 DOM，无需外部传参；但 CSS 工具需要接收用户指定的选择器，`args` 是最自然的方式

### Decision 4: CSS 输出格式

**选择**: 两种模式：
- **`computed` 模式**: 返回指定元素的所有计算样式（`getComputedStyle`），格式为 `{ selector, computedStyle: { property: value, ... }, elementInfo: { tagName, text } }`。属性数量可能很多（200+），但仅包含非默认值的属性（通过比较空元素的计算样式过滤）。
- **`stylesheet` 模式**: 返回页面所有 `<style>` 和 `<link rel="stylesheet">` 中可访问的 CSS 规则文本，格式为 `{ stylesheets: [{ type: 'inline'|'external', href?: string, cssText: string }], count, truncated }`。

**理由**:
- Computed style 对 UI 复刻场景最直接有效（AI 需要知道"这个按钮是什么颜色/字体/边距"）
- Stylesheet 原文对分析样式组织、变量定义、响应式断点等场景有用
- 过滤默认值可减少 80%+ 的无关数据

**替代方案**: 同时返回两种模式 —— 会导致单次返回过大，分开调用更灵活。

### Decision 5: Source 工具使用参数注入选择器和截断

**选择**: 
- `selector` 参数: CSS 选择器，默认为 `body`（获取完整页面）
- `maxLength` 参数: 最大返回字符数，默认 50000
- 输出格式: `{ url, title, selector, html: string, truncated: boolean, totalLength: number }`

**理由**:
- `outerHTML` 序列化直接获取 HTML 字符串
- 默认截断防止单次返回超过 LLM 上下文限制
- 返回 `totalLength` 和 `truncated` 标志让 AI 知道是否还有更多内容

### Decision 6: 内容脚本文件结构

**选择**: 创建两个独立文件 `chrome-extension/src/content/page-css.js` 和 `chrome-extension/src/content/page-source.js`。

**理由**:
- 与现有内容脚本的命名和组织方式一致
- 独立文件便于维护和调试
- 单一职责：每个脚本只做一件事

## Risks / Trade-offs

- **[风险] 大型页面 HTML 序列化可能耗时/耗内存** → 通过 `maxLength` 截断 + 超时保护（5秒）缓解
- **[风险] 跨域样式表无法通过 `cssRules` 访问（CORS 限制）** → 捕获异常，标记为 `accessible: false`，返回 `href` 让 AI 知道存在但不可读
- **[风险] `getComputedStyle` 返回 200+ 属性，数据量大** → 过滤默认值，只保留与默认值不同的属性
- **[风险] 内容脚本注入失败（如 chrome:// 页面）** → Background 已有错误处理模式，返回 `INJECT_FAILED` 状态
- **[权衡] Computed style 不包含伪元素样式** → 初期不处理伪元素，AI 可通过 stylesheet 模式获取伪元素规则

## Open Questions

- 无待解决问题 —— 设计方案已足够明确，可进入实施阶段
