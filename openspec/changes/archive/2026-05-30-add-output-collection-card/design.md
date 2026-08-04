## Context

AI Helper 已有"工作产物"（output-files）系统：通过 `save_output_file` 工具将文件持久化到 IndexedDB，在"知识"面板的"📦 工作产物"卡片中管理。同时 `provide_file` 工具可在聊天中渲染单文件下载卡片。

当前二者分隔：AI 完成产出后需要分别调用 `save_output_file`（持久化）和 `provide_file`（展示下载），用户无法在聊天流中直接查看文件列表、预览内容、批量下载。

产物集合卡片的目标是在聊天流中提供工作产物的"聊天视图"，作为 `save_output_file` 的"结账台"——AI 完成一系列文件保存后，一次调用即可展示本次产出的文件集合。

项目约束：零外部依赖，纯原生 JS + DOM API 构建卡片，Catppuccin 配色方案。

## Goals / Non-Goals

**Goals:**
- 新增 `present_output_files` 工具，AI 调用后在聊天流中渲染产物集合卡片
- 卡片按目录树结构展示文件列表，支持点击预览单个文件
- 提供一键下载全部文件的按钮，通过浏览器 Blob API 触发下载
- 卡片不阻塞 Agent 循环（与文件卡一致，立即返回）
- 遵循现有 Catppuccin 配色风格和 i18n 体系

**Non-Goals:**
- 不修改 `provide_file` 或 `save_output_file` 的现有行为
- 不引入 JSZip 等打包库（批量下载采用逐个触发方式）
- 不在卡片内提供文件编辑、删除、重命名功能
- 不支持子路径增量下载（始终下载全部展示的文件）
- 不替换"知识"面板中的工作产物卡片（聊天视图与管理视图并存）

## Decisions

### 1. 新建独立卡片组件，不升级文件卡

**选择**：新建 `createOutputCollectionCard()` 组件，对应新工具 `present_output_files`。保持 `provide_file` 和 `createFileCard()` 不变。

**理由**：
- `provide_file` 语义是"即时提供一段内容供下载"，内容由 AI 直接传递；产物集合卡是"展示工作产物中的文件"，数据源是 IndexedDB
- 二者参数完全不同：`provide_file` 有 `fileName`/`content`/`mimeType`；新工具有 `pathPrefix`/`showTree` 等过滤参数
- 单文件卡的结构（文件名 + MIME + 预览 + 下发按钮）与集合卡（树状列表 + 批量预览 + 批量下载）差异大，合入会导致组件逻辑膨胀
- 两种卡片独立存在不会造成概念混淆——AI 根据场景选择合适的工具

**备选**：升级 `provide_file` 增加 `paths` 参数指向工作产物 → 放弃，工具语义分裂，代码分支多。

### 2. 工具参数设计

**选择**：`present_output_files` 参数设计如下：

```json
{
  "pathPrefix": "string (optional)",
  "showTree": "boolean (optional, default true)",
  "emptyMessage": "string (optional)"
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `pathPrefix` | string | 否 | 按路径前缀过滤文件，如 `openspec/changes/add-auth/`。不传则展示全部文件 |
| `showTree` | boolean | 否（默认 `true`） | 是否按目录树结构展示 |
| `emptyMessage` | string | 否 | 无文件时的提示语 |

**理由**：
- `pathPrefix` 让 AI 可按工作单元过滤（例如"刚才产出的 OpenSpec 文件"）
- `showTree` 控制展示方式：文件少时扁平列表更简洁
- `emptyMessage` 给 AI 自定义空状态提示的空间

### 3. 批量下载：逐个触发 Blob 下载

**选择**：点击"下载全部"时，遍历文件列表逐个触发 Blob 下载，而非打包为 ZIP。

**理由**：
- 零外部依赖，不引入 JSZip。项目约束要求纯原生 API
- Manifest V3 Chrome 扩展内存有限，大文件打包 ZIP 容易触发内存告警
- 浏览器原生下载机制已支持"允许多文件下载"（Chrome 对同源下载有合理的并行策略）
- 简化实现：`for` 循环 + 每个文件调用 `downloadFileContent()` 即可

**风险**：文件数量多时（20+）浏览器可能弹出"允许下载多个文件"提示 → 可接受，用户确认后继续下载

**备选**：
- JSZip 打包为 ZIP → 放弃，引入外部依赖
- 只下载最近修改的 N 个文件 → 放弃，与"全部下载"语义矛盾
- 使用 `chrome.downloads` API → 放弃，需要额外权限

### 4. 文件预览：复用现有 `openFileModal`

**选择**：每个文件行右侧放"预览"按钮，点击后调用 `getOutputFile(path)` 读取内容，再通过 `openFileModal(id, path)` 展示。

**理由**：
- `openFileModal` 已实现：读取文件 → 渲染模态框（8000 字符截断）→ 关闭按钮
- 工作产物卡片和产物集合卡片共用同一套预览体验
- 文件内容按需加载（点击时才从 IndexedDB 读取），避免卡片渲染时加载全部文件内容

### 5. 卡片 DOM 结构

**选择**：采用与现有卡片一致的两层嵌套结构 + 滚动文件列表。

```
div.chat-message.chat-message-output-collection-card
  └── div.chat-bubble.chat-bubble-output-collection-card
        ├── div.occ-header          ← 📦 标题 + 文件数量
        ├── div.occ-file-list       ← 文件列表（可滚动）
        │     ├── div.occ-dir        ← 目录节点（可折叠）
        │     │     └── div.occ-file  ← 文件行：📄 文件名 [👁 预览]
        │     └── div.occ-file       ← 根目录文件行
        └── div.occ-actions         ← [⬇ 下载全部 (N个文件)]
```

**理由**：
- 两层嵌套 `.chat-message` + `.chat-bubble` 与其他卡片一致，复用滚动到底部的逻辑
- 文件列表区域设置 `max-height` + `overflow-y: auto`，防止大量文件撑破面板
- 目录节点用 `<details>` + `<summary>` 原生折叠，零 JS 交互成本
- 预览按钮按需加载内容，渲染时仅展示路径名

### 6. 国际化

**选择**：新增翻译键到 `i18n.js`

| Key | 中文 | 英文 |
|-----|------|------|
| `outputCollectionCardTitle` | 工作产物 | Output Files |
| `outputCollectionCardEmpty` | 暂无产物文件 | No output files yet |
| `outputCollectionCardPreview` | 预览 | Preview |
| `outputCollectionCardDownloadAll` | 下载全部 | Download All |
| `outputCollectionCardFileCount` | {n} 个文件 | {n} files |

### 7. 卡片不阻塞 Agent 循环

**选择**：与文件卡行为一致，`executeToolCall` 渲染卡片后立即返回 `{displayed: true, fileCount: N}`。

**理由**：
- 产物集合卡是展示型卡片，不需要用户交互确认
- 用户可在查看文件的同时，Agent 继续执行后续工作
- 与现有交互卡片（询问卡/授权卡/表格卡-clickable）的 Promise 阻塞模式形成清晰分界

## Risks / Trade-offs

- **[大量文件渲染性能]** 工作产物文件数达到 50+ 时，卡片初始渲染时间增长 → 文件列表设置 `max-height: 280px` + `overflow-y: auto`，减少初始 DOM 量
- **[批量下载浏览器限制]** 20+ 文件逐个下载时 Chrome 可能弹出"阻止多文件下载"提示 → 用户手动确认即可，不做自动处理
- **[文件内容加载延迟]** 点击预览时从 IndexedDB 读取文件，可能延迟 50-200ms → 预览按钮添加加载中状态（`...` 或 spinner）

## Open Questions

（无 — 方案方向已在 explore 阶段与用户对齐，技术方案明确）
