## Context

AI Helper 是一个 Chrome 扩展（Manifest V3），聊天面板（Side Panel）已支持两种交互卡片：询问卡片（`ask_user` → `createQuestionCard`/`handleQuestionCard`）和授权卡片（`request_auth` → `createAuthCard`/`handleAuthCard`）。这些卡片作为 AI Tool Calling 的 UI 载体，遵循统一的模式：工具定义（TOOLS 数组） → 卡片创建函数（纯 DOM 构建） → 事件处理函数（Promise 包装） → 在 `executeToolCall()` 中分发调用。

现有卡片的样式使用 Catppuccin 配色变量，通过 CSS 变量（`--ctp-*`）支持深色/浅色主题自动切换。所有交互元素在对话被中断时（`AbortSignal`）会正确禁用。

本项目遵循无框架、纯原生 JS 的实现路径，不引入外部依赖。文件下载使用浏览器原生 `Blob` + `URL.createObjectURL` + 隐藏 `<a>` 点击。

## Goals / Non-Goals

**Goals:**
- 新增 `display_table` 工具，AI 调用后在聊天面板渲染结构化表格卡片
- 表格卡片支持列头定义和行数据展示，使用原生 `<table>` 渲染
- 表格卡片支持可选的行点击交互（`clickable: true`），用户点击某行后该行数据返回给 AI，Agent 继续执行
- 新增 `provide_file` 工具，AI 调用后在聊天面板渲染文件下载卡片
- 文件卡片显示文件名、MIME 类型、内容预览（前 200 字符），提供下载按钮
- 用户点击下载按钮后通过浏览器原生下载机制保存文件
- 两种卡片均符合现有 Catppuccin 配色风格，支持深色/浅色主题
- 遵循现有 i18n 翻译体系，新增中英文翻译键
- 支持对话中断（`AbortSignal`）时正确禁用卡片交互元素

**Non-Goals:**
- 不支持表格内嵌富文本、图片、超链接（仅纯文本）
- 不支持表格排序、筛选、分页等高级交互
- 不支持文件上传（仅下载方向）
- 不存在已上传到服务器的文件（仅本地生成 → 本地下载）
- 不修改现有卡片行为或 API

## Decisions

### 1. 表格卡片：原生 `<table>` + inline 样式

**选择**：使用原生 HTML `<table>` 渲染表格，结合 CSS 类控制样式，不使用 CSS-in-JS 或第三方表格组件。

**理由**：
- 项目零依赖约束，无法引入 ag-grid、DataTables 等库
- `<table>` 语义标签对无障碍友好，渲染性能优秀
- 表格数据量较小（AI 生成的展示数据，通常 <50 行 × <10 列），原生 table 完全胜任
- 与现有 `.task-card-table` 样式风格一致，复用 CSS 设计语言

**备选方案**：
- `<div>` + CSS Grid 模拟表格：结构不语义化，无障碍差 → 放弃
- 引入 markdown 渲染表格（marked）：marked 已存在于项目中但适合纯展示，无法交互 → 部分放弃（仅对非交互表格考虑 future 使用，本次不采用）

### 2. 表格交互模式：clickable 布尔参数

**选择**：`display_table` 工具增加可选布尔参数 `clickable`，为 `true` 时行可点击，用户点击行后返回该行数据（作为字符串数组）给 AI。

**理由**：
- 保持与询问卡片一致的设计模式：AI 工具调用 → UI 渲染 → 用户交互 → 返回值恢复 Agent 执行
- 布尔开关简单明确，AI 可根据场景自行决定是否要求用户选择行
- 非 `clickable` 模式为纯展示，执行立即返回确认信息，不阻塞 Agent 循环

**备选方案**：
- 始终可点击：不适合纯展示场景（如展示查询结果），会阻塞 Agent → 放弃
- 使用 `selectable` + `multiSelect` 类似询问卡片：增加了复杂度但使用场景极少 → 放弃

### 3. 文件卡片：Blob 下载

**选择**：通过 `Blob` 构造文件内容 → `URL.createObjectURL(blob)` → 创建隐藏 `<a>` → 编程式 `click()` → 定时 `URL.revokeObjectURL()` 清理。

**理由**：
- 纯浏览器原生 API，零依赖，完美兼容 Chrome 扩展环境
- 不需要 Service Worker 或 background.js 参与
- MIME 类型由 AI 提供（通过 `mimeType` 参数），默认 `text/plain`

**备选方案**：
- `Data URL` (base64)：对大文件编码开销大，URL 长度有限制 → 放弃
- `chrome.downloads.download()`：需要 `downloads` 权限（当前 Manifest 未声明且非必要），且 API 需要 URL 参数不能直接接受内容 → 放弃
- `FileReader.readAsDataURL` + download：绕过内容 → URL 转换，多一层开销 → 放弃

### 4. 工具参数设计

**`display_table` 参数**：
- `title`（必填，string）：表格标题，显示在卡片头部
- `columns`（必填，string[]）：列名数组，用作 `<th>` 内容
- `rows`（必填，string[][]）：行数据二维数组，内部元素为纯文本
- `clickable`（选填，boolean，默认 false）：行是否可点击。为 true 时行显示 hover 效果和指针样式

**`provide_file` 参数**：
- `fileName`（必填，string）：下载文件名，如 `config.json`、`report.html`
- `content`（必填，string）：文件完整内容（文本）
- `mimeType`（选填，string，默认 `text/plain`）：MIME 类型，如 `application/json`、`text/html`、`text/csv`

## Risks / Trade-offs

- **[大表格性能] AI 生成极大表格** → 表格数据作为聊天消息持久化到 chrome.storage.local，应限制在合理大小。可在渲染时设置最大高度 + overflow-y: scroll，避免面板被撑破。
- **[文件卡片内存] 大文件 Blob URL** → 在 `URL.revokeObjectURL()` 调用后释放内存。大文件下载依赖于浏览器能力，不做额外限制。
- **[XSS 风险] 表格数据含 HTML 标签** → 表格内容使用 `textContent` 设置（不使用 `innerHTML`），避免 XSS 注入。
- **[Agent 阻塞] clickable 表格需要用户交互** → 若用户在 clickable 表格展示时点击"停止"按钮，`AbortSignal` 触发后应正确禁用行点击，避免卡住 Promise。

## Open Questions

（无未解决问题 — 两种卡片模式已通过现有 question-card / auth-card 验证可行）
