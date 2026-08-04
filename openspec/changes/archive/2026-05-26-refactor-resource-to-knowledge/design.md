## Context

AI Helper 是一个 Chrome 浏览器扩展（Manifest V3），当前 Side Panel 包含"AI 聊天"、"技能"、"请求监控"、"资源管理"、"设置"五个 Tab。资源管理模块通过 isomorphic-git 在浏览器端完成 Git 仓库浅克隆和源码提取，将文件存储到 IndexedDB。

重构目标：将"资源管理"更名为"知识"，彻底移除 Git 同步功能，改为用户直接选择本地文件导入，简化操作流程。

Chrome MV3 扩展环境约束：
- 使用 `<input type="file" webkitdirectory>` 实现文件夹选择，通过 FileReader API 读取文件内容
- IndexedDB 存储上限远大于 `chrome.storage.local`，适合存储文件内容
- `chrome.storage.local` 仅存储知识条目元数据（显示名称、描述、随机 ID 等）

本设计基于现有架构，技术栈不变（原生 JavaScript + Chrome Extension API），不引入外部依赖。

## Goals / Non-Goals

**Goals:**
- 将"资源管理" Tab 重命名为"知识"，所有文案和代码标识同步更新
- 移除 Git 操作相关所有代码和依赖（isomorphic-git 等三个 bundle 文件）
- 实现"添加知识"功能：选择本地文件夹或文件，读取内容导入 IndexedDB
- 实现导入进度条，实时反馈文件处理进度
- 知识卡片展示：显示名称（可修改）、文件树（可展开）、知识描述（可修改）
- 使用随机 ID 作为存储目录名，文件名仅作为默认显示名称
- 保留文件树展示和文件内容预览
- 保留 AI 聊天上下文搜索工具，适配新数据结构

**Non-Goals:**
- 不提供文件在线编辑功能
- 不支持增量更新（每次导入全量替换）
- 不提供知识搜索/筛选功能（本次迭代）
- 不修改"AI 聊天"、"技能"、"请求监控"、"设置" Tab 的核心逻辑

## Decisions

### 1. 数据模型：随机 ID 作为存储 Key

**选择**: 每个知识条目导入时生成随机 ID（crypto.randomUUID()），作为 IndexedDB 中存储文件的命名空间 key。文件夹名称或首文件名仅用作默认显示名称，存储到 `displayName` 字段。

**理由**: 避免中文路径、特殊符号导致的存储问题。随机 ID 是纯 ASCII 字符串，兼容所有文件系统和存储后端。显示名称允许任意语言和符号，与存储 Key 完全解耦。

**数据结构**:
```js
// chrome.storage.local key: ai_helper_knowledge_items
{
  id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",  // 随机 UUID
  displayName: "我的前端项目",                    // 用户可修改
  description: "React + TypeScript 项目源码",      // 用户可修改
  createdAt: "2026-05-26T10:30:00.000Z",
  fileCount: 120
}

// IndexedDB ai_helper_code_cache
// files store: { knowledgeId, path, content, updatedAt }
// trees store:  { knowledgeId, treeData, updatedAt }
```

### 2. 文件导入流程：FileReader + IndexedDB

**选择**: 通过 `<input type="file" webkitdirectory multiple>` 让用户选择文件夹，浏览器自动递归包含所有子目录和文件。对每个文件使用 FileReader.readAsText() 读取内容，写入 IndexedDB。

**导入流程**:
1. 用户点击"添加知识"按钮 → 触发隐藏的 `<input type="file" webkitdirectory>` 点击
2. 浏览器弹出文件夹选择对话框，用户选择目标文件夹
3. `onchange` 事件获取 `FileList`（包含所有文件的相对路径，如 `src/index.js`）
4. 生成随机 ID，使用文件夹名称作为默认显示名称
5. 逐个读取文件：对文本源码文件调用 `file.text()` / FileReader，跳过二进制文件
6. 实时更新进度：`已处理: 45/120 个文件`
7. 全部读取完成后写入 IndexedDB，构建文件树缓存
8. 保存知识条目配置到 `chrome.storage.local`

**进度条**:
- 显示在添加入口区域，包含进度条（`<progress>` 元素）和文本 "正在导入: 15/120 个文件"
- 进度条在导入完成后保留 2 秒后自动消失，知识卡片出现在列表中

### 3. 文件过滤规则

**选择**: 复用现有的源码文件扩展名过滤逻辑（`SOURCE_EXTENSIONS` 和 `SKIP_DIRS`），保持与原有模块一致。

**支持的扩展名**: .js, .ts, .tsx, .jsx, .vue, .java, .xml, .json, .yaml, .yml, .md, .css, .scss, .less, .html, .py, .go, .rs, .sql, .properties, .gradle, .proto, .txt, .env, .cfg, .ini, .toml

**跳过的目录**: node_modules, dist, build, .git, target, vendor, __pycache__, .idea, .vscode, .next, .nuxt, coverage, tmp, temp, cache

**跳过的二进制文件**（按扩展名）: .png, .jpg, .jpeg, .gif, .svg, .ico, .woff, .woff2, .ttf, .eot, .mp4, .mp3, .avi, .pdf, .zip, .tar, .gz, .rar, .7z, .exe, .dll, .so, .dylib, .class, .o, .obj, .wasm, .map

### 4. UI 结构设计

**选择**: 知识卡片视图替代项目卡片视图，移除 Git 相关 UI 元素，新增导入进度条和编辑功能。

**布局结构**:
```
#tab-knowledge (原 #tab-resource)
  ├── .knowledge-toolbar
  │   ├── 标题 "知识管理"
  │   └── 按钮 "添加知识"（移除了原"一键同步最新代码"按钮）
  ├── #importProgress (导入进度条区域，默认 hidden)
  │   ├── <progress> 进度条
  │   └── 进度文本 "正在导入: 15/120 个文件"
  ├── #knowledgeList (知识卡片列表)
  │   └── .knowledge-card (每张卡片)
  │       ├── .knowledge-card-header
  │       │   ├── 显示名称（可编辑 inline）
  │       │   └── 删除按钮
  │       ├── .knowledge-card-desc（可编辑 inline）
  │       └── .file-tree-section (文件目录树，可折叠)
  └── (移除原 #addProjectForm 和 #editProjectForm)
```

**编辑交互**:
- 显示名称：点击后变为 `<input>` 编辑框，失焦或回车保存
- 知识描述：点击后变为 `<textarea>` 编辑框，失焦保存
- 删除：点击删除按钮，确认后同时清除 IndexedDB 缓存数据

### 5. 代码组织

**选择**: 将 `resource.js` 重命名为 `knowledge.js`，内部模块重组为：

| Group | 名称 | 职责 |
|-------|------|------|
| Group 1 | 知识条目配置层 | `loadKnowledgeItems()`, `saveKnowledgeItems()`, `addKnowledgeItem()`, `updateKnowledgeItem()`, `deleteKnowledgeItem()` |
| Group 2 | IndexedDB 缓存层（适配） | `FileCacheManager`（knowledgeId 替代 projectName）和 `TreeCacheManager`（knowledgeId 替代 projectName）|
| Group 3 | 文件导入引擎 | `handleAddKnowledge()`, `importFiles()`, `processFileItem()`, `filterSourceFile()` |
| Group 4 | UI 渲染层 | `initKnowledgeManager()`, `renderKnowledgeList()`, `createKnowledgeCard()`, `renderImportProgress()` |
| Group 5 | AI 上下文工具 | `searchProjectCode()` → `searchKnowledgeCode()`, `getProjectFile()` → `getKnowledgeFile()`, `listProjectFiles()` → `listKnowledgeFiles()` |

### 6. 向后兼容处理

- 旧数据（`ai_helper_git_projects`）在首次加载时检测，若有数据提示用户迁移（或直接忽略，因为功能完全不同）
- IndexedDB 中旧 `projectName` 为 key 的数据不会被新功能读取，但不会主动清除（由浏览器配额管理自然淘汰）
- AI 聊天工具函数保持相同签名，仅内部实现从 projectName 改为 knowledgeId 查询
- 工具函数中的 `projectName` 参数 -> 改为 `knowledgeId` 参数

## Risks / Trade-offs

- **[文件读取内存]** 大型项目可能有数千文件，一次性 FileReader 读取可能消耗较多内存 → 分批读取（每批50个文件），每批完成后写入 IndexedDB 再释放内存
- **[浏览器兼容性]** `webkitdirectory` 属性是 Chrome 专有特性，Firefox 不支持（但本扩展仅针对 Chrome）→ 无影响
- **[数据丢失]** 从当前版本升级后，旧的 Git 项目配置和缓存数据将不可见 → 在发布说明中告知用户，旧数据保留在存储中不会自动清除
- **[进度条准确性]** 二进制文件和跳过的目录不计入总文件数，但用户在进度中看到的总数可能小于文件夹实际文件数 → 进度文本中显示有效的源码文件数
