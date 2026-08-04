## 1. 清理 Git 相关代码和依赖

- [x] 1.1 删除 `chrome-extension/src/panel/git-ops.js`
- [x] 1.2 删除 `chrome-extension/src/panel/isomorphic-git-bundle.js`
- [x] 1.3 删除 `chrome-extension/src/panel/git-bundle.js`
- [x] 1.4 删除 `chrome-extension/src/panel/buffer-standalone.js`
- [x] 1.5 从 `panel.html` 中移除以上脚本的 `<script>` 标签

## 2. 重命名 resource.js 为 knowledge.js，搭建模块骨架

- [x] 2.1 创建 `chrome-extension/src/panel/knowledge.js`，从资源管理代码中提取文件导入、缓存、AI工具部分
- [x] 2.2 定义新数据模型 `KnowledgeItem { id, displayName, description, createdAt, fileCount }`
- [x] 2.3 实现 `loadKnowledgeItems()` / `saveKnowledgeItems()`（存储键 `ai_helper_knowledge_items` 到 chrome.storage.local）
- [x] 2.4 实现 `addKnowledgeItem(item)` / `updateKnowledgeItem(id, updates)` / `deleteKnowledgeItem(id)` CRUD
- [x] 2.5 从 `panel.html` 中替换 `resource.js` 的 script 标签为 `knowledge.js`

## 3. 重构 IndexedDB 缓存层

- [x] 3.1 将 `FileCacheManager` 和 `TreeCacheManager` 中的 `projectName` 参数重命名为 `knowledgeId`
- [x] 3.2 更新 IndexedDB 数据库版本号（v2 → v3），迁移或重建对象存储
- [x] 3.3 确保 `deleteKnowledgeItem()` 调用 IndexedDB 清除该知识条目下所有缓存文件和数据

## 4. 实现文件导入引擎

- [x] 4.1 在 `knowledge.js` 中实现 `generateKnowledgeId()` 函数（使用 crypto.randomUUID()）
- [x] 4.2 实现 `isSourceFile(filePath)` 和 `shouldSkipDirectory(filePath)` 文件过滤函数
- [x] 4.3 实现 `importFiles(files, knowledgeId, onProgress)` 主导入流程：逐批读取文件→写入 IndexedDB→构建文件树
- [x] 4.4 实现分批读取逻辑（每批 50 个文件），每批完成后更新进度并写入 IndexedDB
- [x] 4.5 实现 `buildTreeStructure(files)` 从文件路径列表构建嵌套树结构（复用现有逻辑）
- [x] 4.6 实现 `handleAddKnowledge()` 事件处理：触发文件选择 → 生成 ID → 调用 importFiles → 保存知识条目

## 5. 重构知识管理 UI

- [x] 5.1 将 `#tab-resource` 容器更名为 `#tab-knowledge`，更新 `panel.html`
- [x] 5.2 重构工具栏：移除"一键同步最新代码"按钮，保留"添加知识"按钮，标题改为"知识管理"
- [x] 5.3 实现导入进度条 UI（`#importProgress` 区域）：`<progress>` 元素 + 进度文本
- [x] 5.4 实现 `renderKnowledgeList()` 渲染知识卡片列表，空状态提示"暂无知识文件，点击添加知识"
- [x] 5.5 实现 `createKnowledgeCard(item)` 卡片组件：显示名称（可编辑）、描述（可编辑）、文件树折叠按钮、删除按钮
- [x] 5.6 实现显示名称 inline 编辑：点击 → `<input>` → 失焦/回车保存
- [x] 5.7 实现知识描述 inline 编辑：点击 → `<textarea>` → 失焦保存
- [x] 5.8 实现删除知识确认弹窗，删除时同步清除 IndexedDB 缓存
- [x] 5.9 复用现有文件树渲染逻辑（`renderFileTreeNode`），适配 knowledgeId 参数
- [x] 5.10 复用文件内容模态框预览逻辑

## 6. 更新 Tab 切换和面板入口

- [x] 6.1 在 `panel.js` 中将"资源管理" Tab 注册更新为"知识" Tab（`showTab('knowledge')`）
- [x] 6.2 更新 Tab 按钮 ID 和数据属性（`tabKnowledgeBtn`、`data-tab="knowledge"`）
- [x] 6.3 初始化时调用 `initKnowledgeManager()` 替代 `initResourceManager()`

## 7. 适配 AI 聊天上下文工具

- [x] 7.1 在 `knowledge.js` 中导出 `searchProjectCode(knowledgeId, keyword)`（保持同名 API，参数改为 knowledgeId）
- [x] 7.2 导出 `getProjectFile(knowledgeId, filePath)`（保持同名 API，参数改为 knowledgeId）
- [x] 7.3 导出 `listProjectFiles(knowledgeId, directoryPath, depth)`（保持同名 API，参数改为 knowledgeId）
- [x] 7.4 在 `chat.js` 中更新工具函数注册：参数从 `projectName` 改为 `knowledgeId`
- [x] 7.5 在 `chat.js` 的 `executeToolCall()` 中更新分发调用逻辑
- [x] 7.6 在聊天系统消息中注入知识条目摘要（知识显示名称列表、knowledgeId、文件数等）

## 8. 更新国际化（i18n）

- [x] 8.1 将所有 `resource.*` 路径的 i18n key 更名为 `knowledge.*`
- [x] 8.2 删除 Git 相关的 i18n key（sync、auth、gitUrl、lastCommitHash 等）
- [x] 8.3 添加新 i18n key：`knowledge.title`、`knowledge.addKnowledge`、`knowledge.importing`、`knowledge.importDone`、`knowledge.defaultName`、`knowledge.noDescription`、`knowledge.delete`、`knowledge.emptyHint` 等
- [x] 8.4 提供中英文两份翻译

## 9. 重构样式

- [x] 9.1 在 `panel.css` 中将 `.resource-*` 类名替换为 `.knowledge-*`
- [x] 9.2 移除同步按钮、同步状态标签、Git 认证表单相关 CSS
- [x] 9.3 添加知识卡片样式（`.knowledge-card` 系列）、导入进度条样式
- [x] 9.4 添加 inline 编辑样式（显示名称和描述编辑框）
- [x] 9.5 保留文件树和文件内容模态框样式

## 10. 验证与测试

- [ ] 10.1 手动测试添加知识：选择文件夹，验证导入进度条显示、文件过滤正确
- [ ] 10.2 手动测试知识卡片显示：验证显示名称、描述、文件树展开、文件预览
- [ ] 10.3 手动测试编辑功能：修改显示名称和描述后保存
- [ ] 10.4 手动测试删除知识：删除后 IndexedDB 缓存同步清除
- [ ] 10.5 手动测试 AI 聊天工具调用：搜索知识代码、读取文件、列出目录
- [ ] 10.6 验证旧 Tab "资源管理" 不再出现，所有 Git 相关功能完全移除
- [ ] 10.7 确认插件加载无报错，面板正常打开
