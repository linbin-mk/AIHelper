## ADDED Requirements

### Requirement: File tree toggle in project card
系统 SHALL 在已同步项目卡片的"最后同步"信息下方提供可折叠的文件目录树预览入口，默认收起状态。

#### Scenario: Show toggle button on synced project
- **WHEN** 项目同步状态为"已同步"（`syncStatus === 'synced'`）
- **THEN** 项目卡片"最后同步"信息下方显示"📁 文件目录"折叠按钮
- **AND** 按钮处于收起状态，右侧显示展开/收起箭头图标（▶ 收起 / ▼ 展开）

#### Scenario: Hide toggle for unsynced project
- **WHEN** 项目同步状态不是"已同步"（待同步、同步中、同步失败）
- **THEN** 项目卡片不显示文件目录按钮

### Requirement: Collapsible directory tree rendering
系统 SHALL 点击"文件目录"按钮后展开树形文件列表，以嵌套结构展示项目的所有已缓存文件，支持目录层级展开/收起和文件点击查看。

#### Scenario: Expand file tree
- **WHEN** 用户点击已同步项目的"文件目录"按钮
- **THEN** 系统从 IndexedDB 读取该项目的目录树数据并渲染树形结构
- **AND** 树结构中目录项前缀 📁 图标且可点击展开/收起
- **AND** 树结构中文件项前缀对应文件类型图标（如 📜 JS、🔷 TS、📝 MD 等）
- **AND** 首层目录默认展开，深层子目录默认收起

#### Scenario: Collapse file tree
- **WHEN** 文件树处于展开状态且用户再次点击"文件目录"按钮
- **THEN** 文件树收起隐藏，按钮文字和箭头恢复初始状态

#### Scenario: Toggle subdirectory
- **WHEN** 用户点击展开状态下的 📁 目录节点
- **THEN** 该目录收起子节点，图标变为 📁
- **AND WHEN** 用户点击收起状态下的 📁 目录节点
- **THEN** 该目录展开子节点，图标变为 📂

#### Scenario: Empty tree
- **WHEN** 项目的目录树数据为空或不存在
- **THEN** 展开后显示"暂无缓存文件"提示文字

### Requirement: File content modal popup
系统 SHALL 在用户点击文件树中的文件项时弹出模态框展示该文件的完整内容，支持代码高亮滚动浏览和关闭操作。

#### Scenario: Open file content modal
- **WHEN** 用户点击文件树中的代码/文本文件项（非二进制文件）
- **THEN** 系统从 IndexedDB 读取该文件完整内容
- **AND** 弹出模态框，标题栏显示文件路径，内容区域以等宽字体展示代码（保留原始缩进和换行）
- **AND** 内容超过 8000 字符时截断并标注总长度

#### Scenario: Close modal by button
- **WHEN** 用户在文件内容模态框中点击"关闭"按钮或右上角 ✕ 按钮
- **THEN** 模态框关闭消失

#### Scenario: Close modal by overlay click
- **WHEN** 用户在文件内容模态框的遮罩区域（非内容区域）点击
- **THEN** 模态框关闭消失

#### Scenario: Close modal by ESC key
- **WHEN** 用户在文件内容模态框打开状态下按下 ESC 键
- **THEN** 模态框关闭消失

#### Scenario: Binary file click
- **WHEN** 用户点击文件树中的二进制文件项（图片、字体等，扩展名在 BINARY_EXTENSIONS 中）
- **THEN** 系统弹出提示"二进制文件暂不支持预览"，不显示模态框

#### Scenario: File not in cache
- **WHEN** 用户点击文件但 IndexedDB 中该文件内容不存在
- **THEN** 模态框显示"文件内容未缓存，请重新同步项目"提示

### Requirement: File icon mapping
系统 SHALL 根据文件扩展名显示不同的图标，增强文件类型的视觉辨识度。

#### Scenario: Recognized extension icon
- **WHEN** 文件扩展名在图标映射表中（如 `.js`、`.ts`、`.json`、`.md`、`.css`、`.html`、`.py`、`.go`、`.java`、`.vue`、`.sql`、`.yaml`、`.xml` 等）
- **THEN** 文件项显示对应的类型图标

#### Scenario: Unrecognized extension icon
- **WHEN** 文件扩展名不在图标映射表中
- **THEN** 文件项显示默认文件图标 📄
