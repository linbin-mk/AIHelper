## 1. 数据模型层

- [x] 1.1 `addProject()` 新增 `description` 参数，写入 `project.description` 字段（默认为空字符串）
- [x] 1.2 `updateProject()` 在更新逻辑中处理 `updates.description` 字段
- [x] 1.3 `validateProjectConfig()` 新增描述长度校验（不超过 100 字符），返回对应错误
- [x] 1.4 `clearAddForm()` 新增清空描述输入框逻辑

## 2. HTML 表单

- [x] 2.1 在 `panel.html` 的添加项目表单（`#addProjectForm`）末尾新增描述输入框 `#projectDescription`（`<textarea>`）及字数计数 `#projectDescriptionCount`
- [x] 2.2 在 `panel.html` 的编辑项目表单（`#editProjectForm`）末尾新增描述输入框 `#editProjectDescription`（`<textarea>`）及字数计数 `#editProjectDescriptionCount`

## 3. 表单交互逻辑

- [x] 3.1 `handleAddProject()` 读取 `#projectDescription` 值并传递给 `addProject()`
- [x] 3.2 `openEditForm()` 预填 `#editProjectDescription` 为当前项目描述，更新字数计数
- [x] 3.3 `handleUpdateProject()` 读取 `#editProjectDescription` 值并传递给 `updateProject()`
- [x] 3.4 添加 `/ 编辑` 表单的 `projectDescription` 输入框绑定 `input` 事件，实时更新字数计数 `(n/100)`
- [x] 3.5 描述框输入超过 100 字符时字数计数变红警告

## 4. 项目卡片展示

- [x] 4.1 `createProjectCard()` 在项目卡片中展示描述摘要（非空时显示，超过 30 字截断加 `...`）

## 5. AI 上下文注入

- [x] 5.1 `buildProjectContext()` 在每个已同步项目摘要中追加描述内容，格式为 `项目名(N文件) - 描述`

## 6. CSS 样式

- [x] 6.1 添加描述输入框（`.description-input`）样式（textarea 等宽、暗色主题）
- [x] 6.2 添加字数计数（`.char-count`）样式（右对齐、小号字体）
- [x] 6.3 添加字数超限警告（`.char-count.over-limit`）样式（红色）
- [x] 6.4 添加项目卡片描述行（`.project-card-desc`）样式
