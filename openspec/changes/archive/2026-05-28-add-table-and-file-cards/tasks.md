## 1. i18n 翻译

- [x] 1.1 在 `i18n.js` 的 `zh-CN.chat` 中新增表格卡片相关翻译键：`tableCardTitle`（表格数据）、`tableCardClickHint`（点击行选择）、`tableCardSelected`（已选择）
- [x] 1.2 在 `i18n.js` 的 `en`（英文区）中新增对应的英文翻译键
- [x] 1.3 在 `i18n.js` 的 `zh-CN.chat` 中新增文件卡片相关翻译键：`fileCardTitle`（文件下载）、`fileCardDownload`（下载）、`fileCardDownloaded`（已下载）、`fileCardPreview`（内容预览）
- [x] 1.4 在 `i18n.js` 的 `en`（英文区）中新增对应的英文翻译键

## 2. 表格卡片 - displayTable 工具定义

- [x] 2.1 在 `chat.js` 的 `TOOLS` 数组中新增 `display_table` 函数定义：`name: 'display_table'`，`description` 描述为"以表格形式展示结构化数据，可选是否允许用户点击选择行"，`parameters` 包含 `title`（必填 string）、`columns`（必填 string[]）、`rows`（必填 string[][]）、`clickable`（选填 boolean）

## 3. 表格卡片 - UI 构建

- [x] 3.1 在 `chat.js` 中实现 `createTableCard(title, columns, rows, clickable)` 函数：创建 `.chat-message-table-card` 容器，内含 `.chat-bubble-table-card`（左边框蓝色），表头显示 📊 + title，表格使用原生 `<table>` + `<thead>` + `<tbody>`，列头用 `columns`，行数据用 `rows`，使用 `textContent` 设置文本防 XSS
- [x] 3.2 实现表格行的 `clickable` 差异化渲染：`clickable` 为 `true` 时 `<tr>` 添加 `.table-card-row-clickable` 类（显示 pointer 和 hover 效果）；为 `false` 时使用默认行样式
- [x] 3.3 实现长表格滚动限制：表格容器最大高度 400px，`overflow-y: auto`

## 4. 表格卡片 - 交互处理

- [x] 4.1 在 `chat.js` 中实现 `handleTableCard(cardWrapper, clickable)` 函数：返回 `Promise`。若 `clickable` 为 `false`，立即 `resolve({displayed: true})`；若为 `true`，监听行 `click` 事件，解析 `data-row-index` 获取选中行，返回 `{selected: [rowData]}` 并禁用所有行
- [x] 4.2 在 `handleTableCard` 中实现 `AbortSignal` 支持：监听 `currentAbortController.signal`，中断时禁用所有行交互（`pointer-events: none`, `opacity: 0.5`），resolve `null`

## 5. 表格卡片 - executeToolCall 集成

- [x] 5.1 在 `chat.js` 的 `executeToolCall()` 函数中新增 `display_table` case 分支：解析 `title`、`columns`、`rows`、`clickable` 参数，调用 `createTableCard()` 和 `handleTableCard()`，返回 JSON 结果

## 6. 文件卡片 - provideFile 工具定义

- [x] 6.1 在 `chat.js` 的 `TOOLS` 数组中新增 `provide_file` 函数定义：`name: 'provide_file'`，`description` 描述为"提供文件供用户下载，如生成的代码文件、配置文件、报告等"，`parameters` 包含 `fileName`（必填 string）、`content`（必填 string）、`mimeType`（选填 string，默认 `text/plain`）

## 7. 文件卡片 - UI 构建

- [x] 7.1 在 `chat.js` 中实现 `createFileCard(fileName, content, mimeType)` 函数：创建 `.chat-message-file-card` 容器，内含 `.chat-bubble-file-card`（左边框绿色），头部显示 📁 + 文件名，下方显示 MIME 类型标签和内容预览（前 200 字符 + "..."），底部显示下载按钮（⬇ 图标 + 翻译文本 `chat.fileCardDownload`）
- [x] 7.2 实现内容预览区：使用 `<pre>` 标签保留原始格式，`textContent` 设置文本防 XSS，最大高度 120px，`overflow-y: auto`

## 8. 文件卡片 - 下载交互

- [x] 8.1 实现 `downloadFileContent(fileName, content, mimeType)` 辅助函数：创建 `Blob` → `URL.createObjectURL` → 隐藏 `<a>` 元素触发 `click()` → 500ms 后 `URL.revokeObjectURL()` 清理
- [x] 8.2 在文件卡片中绑定下载按钮 `click` 事件：调用 `downloadFileContent()` 触发下载，更新按钮文字为"已下载"（翻译键 `chat.fileCardDownloaded`），按钮禁用，无阻塞 Promise（Agent 继续执行）

## 9. 文件卡片 - executeToolCall 集成

- [x] 9.1 在 `chat.js` 的 `executeToolCall()` 函数中新增 `provide_file` case 分支：解析 `fileName`、`content`、`mimeType` 参数（`mimeType` 默认 `text/plain`），调用 `createFileCard()`，立即返回 `{displayed: true, fileName}` 不等待用户下载

## 10. CSS 样式

- [x] 10.1 在 `panel.css` 中新增 `/* ===== Table Card ===== */` 区块：定义 `.chat-message-table-card`、`.chat-bubble-table-card`、`.table-card-header`、`.table-card-table`、`.table-card-table th`、`.table-card-table td`、`.table-card-row-clickable`、`.table-card-row-clickable:hover`、`.table-card-row-clickable:disabled`、`.table-card-table-container` 样式，使用 Catppuccin 变量
- [x] 10.2 在 `panel.css` 中新增 `/* ===== File Card ===== */` 区块：定义 `.chat-message-file-card`、`.chat-bubble-file-card`、`.file-card-header`、`.file-card-meta`、`.file-card-preview`、`.file-card-download-btn`、`.file-card-download-btn:hover`、`.file-card-download-btn:disabled` 样式，使用 Catppuccin 变量，下载按钮使用绿色主题色

## 11. 验证

- [x] 11.1 在 Chrome 扩展中加载插件，验证 `display_table` 工具出现在 tools 数组中
- [x] 11.2 发送"用表格展示用户列表"消息，验证非 clickable 表格正确渲染，Agent 继续执行
- [x] 11.3 发送"选择要删除的接口"消息，验证 clickable 表格行可点击，选择后 Agent 恢复执行
- [x] 11.4 发送"生成一份 HTML 报告"消息，验证文件卡片正确渲染，点击下载后文件正确保存到本地
- [x] 11.5 验证深色/浅色主题下两种卡片的样式正确切换
- [x] 11.6 验证停止按钮：在 clickable 表格等待选择时点击停止，卡片正确禁用
