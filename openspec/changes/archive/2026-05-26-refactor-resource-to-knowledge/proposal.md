## Why

当前"资源管理"模块依赖 Git 仓库拉取来获取代码文件，要求用户配置 Git 仓库地址和鉴权凭证，操作门槛高、流程复杂。大多数开发者需要的是直接导入本地文件/文档作为 AI 对话的知识参考，而非从远程仓库同步。同时，使用 Git 仓库地址或文件名称作为存储索引存在中文路径和特殊符号兼容性问题。

将"资源管理"重构为"知识"模块，简化用户操作流程：用户直接选择本地文件或文件夹导入，系统自动生成随机 ID 作为存储目录名，文件名仅作为显示名称。去除 Git 同步和"一键同步"功能，降低用户认知负担。

## What Changes

- 将"资源管理" Tab 重命名为"知识" Tab，所有相关 UI 文案、CSS 类名、内部标识同步更新
- 移除 Git 仓库拉取全部功能：删除 isomorphic-git 依赖包、git-ops.js 文件、Git 地址解析、鉴权处理、commit 对比增量同步等所有相关代码
- 移除"一键同步最新代码"和单项目同步功能，删除同步进度报告机制
- 新增"添加知识"功能：用户点击按钮后通过 `<input type="file" webkitdirectory>` 选择文件夹或文件，使用 FileReader 读取内容并写入 IndexedDB
- 新增导入进度条：实时显示文件读取进度（已处理文件数/总文件数），保留给用户查看当前导入进度
- 知识卡片简化：仅展示"显示名称"、文件树（保留现有树形展示）、"知识描述"
- 编辑功能简化：用户可修改显示名称和知识描述
- 随机 ID 存储：每次导入生成一个随机 ID 作为 IndexedDB 中的真正存储目录名，文档名称/文件夹名称仅用作默认显示名称
- 保留文件树展示和文件内容预览功能
- 保留 AI 聊天上下文工具（search_project_code / get_project_file / list_project_files），适配新的数据存储结构
- **BREAKING**: 移除 `ai_helper_git_projects` 存储键，迁移到 `ai_helper_knowledge_items`；IndexedDB 数据模型变更，旧数据不兼容

## Capabilities

### Modified Capabilities
- `resource-manager-ui` → **重写**为知识管理 UI：知识卡片列表、添加知识对话框、导入进度条、编辑显示名称和描述
- `git-project-config` → **移除**，替换为知识条目的配置管理（随机 ID、显示名称、描述）
- `git-sync` → **移除**，替换为本地上传导入引擎（FileReader + 文件系统 API）
- `git-operations` → **移除**，删除整个 git-ops.js 模块
- `file-tree-preview` → **保留并适配**：文件树展示逻辑复用，适配新的数据存储结构
- `ai-code-context` → **适配**：工具函数适配新的知识条目数据结构，按 knowledgeId 查询

### Removed Capabilities
- `git-project-config`：Git 项目配置管理
- `git-sync`：Git 仓库同步
- `git-operations`：isomorphic-git 操作

## Impact

- **删除文件**: `chrome-extension/src/panel/git-ops.js`、`chrome-extension/src/panel/isomorphic-git-bundle.js`、`chrome-extension/src/panel/git-bundle.js`、`chrome-extension/src/panel/buffer-standalone.js`
- **重写文件**: `chrome-extension/src/panel/resource.js`（重构为 knowledge.js）
- **修改文件**: `chrome-extension/src/panel/panel.html`（Tab 名称和布局调整）、`chrome-extension/src/panel/panel.js`（Tab 切换和模块加载调整）、`chrome-extension/src/panel/chat.js`（工具函数适配）、`chrome-extension/src/panel/panel.css`（样式重构）、`chrome-extension/src/panel/i18n.js`（国际化词条更新）
- **存储**: 移除 `ai_helper_git_projects`，新增 `ai_helper_knowledge_items`（chrome.storage.local）；IndexedDB `ai_helper_code_cache` 结构调整（projectName → knowledgeId）
