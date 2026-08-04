## Context

当前资源管理模块在项目同步完成后将文件内容和目录树缓存到 IndexedDB：
- `files` store: 按 `projectId::path` 存储文件内容
- `trees` store: 按 `projectId` 存储目录树结构（`buildTreeStructure()` 生成的嵌套对象，`_files` 数组存文件名，子目录为嵌套 key）

项目卡片 UI 目前仅显示"最后同步: 时间"文本，用户无法直观了解项目文件结构。需要通过可折叠的树形组件让用户浏览文件目录，并支持点击文件查看内容。

## Goals / Non-Goals

**Goals:**
- 在已同步的项目卡片上显示可折叠的文件目录树
- 目录树默认收起，点击展开
- 支持目录节点的展开/收起交互
- 区分目录（文件夹图标）和文件（文件图标）的视觉呈现
- 点击代码/文本文件弹出模态框展示文件内容
- 利用现有 IndexedDB `trees` store 数据，无需额外存储

**Non-Goals:**
- 不支持二进制文件（图片、字体等）预览
- 不支持文件的在线编辑或修改
- 不改变现有的同步流程或 IndexedDB schema
- 不支持搜索过滤目录树

## Decisions

### Decision 1: 使用现有 `trees` store 数据而非重新构建

**选择**: 直接读取 `TreeCacheManager.getTree(projectId)` 返回的树结构数据渲染 UI。

**理由**:
- 同步完成时已通过 `buildTreeStructure()` 构建树并存入 IndexedDB
- 避免重复遍历 `files` store 重新构建，节省性能
- 数据结构 (`{dir: {...}, _files: [...]}`) 天然适合递归渲染

**替代方案**: 每次渲染时从 `files` store 拉取所有文件路径重新构建树。缺点是项目文件数多时性能差，优点是不依赖 trees store 的正确性。考虑到 trees 与 files 同步更新，当前方案更高效。

### Decision 2: 递归 DOM 渲染 + CSS 控制展开/收起

**选择**: 使用 JavaScript 递归遍历树对象，动态创建嵌套 `<ul>/<li>` DOM 结构，通过 CSS class `collapsed` 控制子节点显隐。

**理由**:
- 比 `innerHTML` 拼接字符串更安全（避免 XSS）
- 比第三方树组件更轻量，无额外依赖
- `<details>/<summary>` 原生语义元素也可行，但样式定制不如 `<ul>` 灵活

**替代方案**: 使用 `<details>/<summary>` 原生元素。优点是语义化好、无需 JS 控制状态，缺点是无法实现自定义动画和图标切换。考虑到 UI 需要文件夹/文件图标差异和展开动画，选择自定义方案。

### Decision 3: 文件图标基于扩展名映射

**选择**: 维护一个扩展名到图标的映射表，常见类型（`.js`→📜, `.ts`→🔷, `.json`→📋, `.md`→📝 等），未匹配的默认为 📄。目录统一使用 📁（折叠）/📂（展开）。

**理由**: 增强视觉识别度，用户可快速定位目标文件类型。图标数量可控，无需引入图标库。

### Decision 4: 文件内容弹窗通过固定定位的 div 实现

**选择**: 在 `panel.html` 中添加预置的模态框 `<div>`，点击文件时通过 JS 填充内容并显示，ESC 或点击遮罩关闭。

**理由**: Chrome Side Panel 宽度有限（约 400px），不适合跳转新页面或 iframe。模态框方案在有限空间内最大化显示区域。内容从 IndexedDB `FileCacheManager.getFile()` 获取。

**替代方案**: `window.open()` 新窗口。优点是内容不被遮挡，缺点是脱离 Side Panel 上下文，用户体验割裂。

## Risks / Trade-offs

- **[性能] 大项目（>1000 文件）渲染树可能较慢** → 首层默认收起，按需展开；方案是渲染时限制首层展开的子目录数（如最多 50 个直接子节点），其余用"更多..."折叠
- **[内存] 大文件内容加载到 DOM 可能影响 Side Panel 性能** → 内容截断显示，最大 8000 字符，与 AI 上下文函数保持一致
- **[数据一致性] trees store 数据过期（用户同步了但 trees 未更新）** → trees 与 files 在同步流程中原子更新（先 `deleteProjectFiles` + `addFiles`，再 `saveTree`），同步失败不会覆盖旧 tree
