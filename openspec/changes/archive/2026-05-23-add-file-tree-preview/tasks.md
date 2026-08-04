## 1. HTML 结构

- [x] 1.1 在 `panel.html` 中添加文件内容模态框结构（包含标题栏、文件路径、关闭按钮、代码内容区域、遮罩层）
- [x] 1.2 在项目卡片模板中预留文件树容器位置（位于"最后同步"信息下方）

## 2. CSS 样式

- [x] 2.1 在 `panel.css` 中添加文件树容器样式（缩进、字体大小、行高、hover 效果）
- [x] 2.2 添加目录/文件节点样式（图标间距、颜色、cursor pointer、展开/收起过渡）
- [x] 2.3 添加模态框样式（固定定位、居中对齐、遮罩层半透明背景、内容区域最大高度可滚动、等宽字体）
- [x] 2.4 添加折叠/展开动画样式（可选：简单过渡或直接显示/隐藏）

## 3. 文件图标映射

- [x] 3.1 在 `resource.js` 中定义扩展名到图标的映射表（`.js`→📜, `.ts`→🔷, `.json`→📋, `.md`→📝, `.css`→🎨, `.html`→🌐, `.py`→🐍, `.go`→🔵, `.java`→☕, `.vue`→💚, `.sql`→🗄️, `.yaml`/`.yml`→⚙️, `.xml`→📰 等，未匹配默认 📄）
- [x] 3.2 实现 `getFileIcon(filename)` 工具函数，根据扩展名返回对应图标字符

## 4. 文件树渲染

- [x] 4.1 实现 `getFileTypeClass(filename)` 函数，判断文件是文本文件还是二进制文件（基于 BINARY_EXTENSIONS 判断）
- [x] 4.2 实现 `renderFileTreeNode(tree, basePath)` 递归函数，基于现有 `buildTreeStructure()` 数据格式生成嵌套 `<ul>/<li>` DOM 树，目录节点可点击展开/收起
- [x] 4.3 实现 `loadAndRenderFileTree(projectId, containerEl)` 函数，从 `TreeCacheManager.getTree()` 获取树数据并渲染到指定容器
- [x] 4.4 大项目优化：首层直接子节点超过 50 个时截断显示，其余用"更多..."折叠

## 5. 文件树折叠控制

- [x] 5.1 在 `createProjectCard()` 中为已同步项目添加"📁 文件目录"折叠按钮，绑定 click 事件切换展开/收起
- [x] 5.2 实现 `toggleFileTree(projectId, btnEl, containerEl)` 函数，处理按钮状态切换（▶/▼ 箭头变化）和树内容的加载/销毁
- [x] 5.3 确保切换 Tab 或项目列表刷新后文件树状态不保留（每次重新渲染默认收起）

## 6. 文件内容模态框

- [x] 6.1 实现 `openFileModal(projectId, filePath, fileName)` 函数，从 `FileCacheManager.getFile()` 读取内容并填充模态框
- [x] 6.2 处理内容截断逻辑（超过 8000 字符限制，与 `getProjectFile` 保持一致）
- [x] 6.3 处理二进制文件点击：弹 toast 提示"二进制文件暂不支持预览"
- [x] 6.4 实现 `closeFileModal()` 函数，关闭模态框并清空内容
- [x] 6.5 绑定关闭事件：关闭按钮 click、遮罩层 click、ESC 键盘事件

## 7. 集成与验证

- [x] 7.1 在 `createProjectCard()` 中集成文件树按钮和容器元素
- [x] 7.2 在文件树渲染后为每个文件节点绑定 click 事件调用 `openFileModal()`
- [x] 7.3 手动测试：同步项目后展开文件树，验证目录结构正确、图标匹配、文件内容弹窗可用
- [x] 7.4 边界测试：未同步项目无文件树按钮、空文件树显示提示、二进制文件不支持预览、大文件截断显示
