## Why

当前项目卡片在同步完成后仅显示"最后同步"时间戳，用户无法直观了解项目缓存了哪些文件、目录结构如何。添加文件目录预览可以让用户在同步后直接浏览项目文件树，并通过点击文件查看内容详情，提升资源管理的可用性和代码浏览效率。

## What Changes

- 在项目卡片"最后同步"时间下方新增可折叠的文件目录树预览区域
- 目录树默认收起，点击展开后以树形结构显示项目缓存的文件和目录
- 目录节点可展开/收起，文件夹图标区分目录和文件
- 点击文本或代码文件（非二进制文件）弹出模态框展示文件内容详情
- 文件内容弹窗支持代码高亮显示和滚动浏览
- 项目同步完成后自动构建并缓存文件树结构到 IndexedDB

## Capabilities

### New Capabilities
- `file-tree-preview`: 文件目录树预览功能，包括可折叠的树形文件列表渲染、文件类型图标区分、文件内容弹窗展示

### Modified Capabilities
- `resource-manager-ui`: 项目卡片增加文件树预览区域，位于"最后同步"时间信息下方

## Impact

- 修改文件: `chrome-extension/src/panel/resource.js`（文件树构建逻辑、弹窗交互）
- 修改文件: `chrome-extension/src/panel/panel.html`（文件树 HTML 模板、内容弹窗结构）
- 修改文件: `chrome-extension/src/panel/panel.css`（文件树样式、弹窗样式）
- 修改文件: `chrome-extension/src/panel/chat.js`（可能涉及代码文件点击跳转）
- 涉及模块: IndexedDB `trees` 对象存储（已有目录树缓存，需确保数据结构兼容）
- 无新增依赖，纯前端实现
