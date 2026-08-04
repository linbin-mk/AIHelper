## 1. 资源管理 Tab 骨架

- [x] 1.1 在 `panel.html` 的 Tab 栏中添加"资源管理"按钮和 `#tab-resource` 视图容器
- [x] 1.2 在 `panel.js` 的 Tab 切换逻辑中注册"资源管理"Tab（`showTab('resource')`）
- [x] 1.3 创建 `chrome-extension/src/panel/resource.js` 并实现模块初始化入口

## 2. 项目配置数据层

- [x] 2.1 定义项目配置数据模型（id, name, gitUrl, authType, credential），实现 `ProjectManager` 类
- [x] 2.2 实现项目配置的 CRUD 操作，持久化到 `chrome.storage.local`（键名 `ai_helper_git_projects`）
- [x] 2.3 实现 Git 地址解析函数，从 URL 提取 baseUrl 和 projectPath
- [x] 2.4 实现配置表单验证逻辑（名称非空、URL 格式、凭证必填）

## 3. IndexedDB 缓存层

- [x] 3.1 创建 IndexedDB 数据库（`ai_helper_code_cache`），定义 `files` 和 `trees` 对象存储及索引
- [x] 3.2 实现 `FileCacheManager` 类：文件的写入、查询、按项目ID批量删除等操作
- [x] 3.3 实现 `TreeCacheManager` 类：目录树的缓存和查询

## 4. GitLab API 同步引擎

- [x] 4.1 实现 `GitLabAPI` 类：封装 API 请求（project search、tree、file content）
- [x] 4.2 实现认证处理：Basic Auth（账号密码）和 PAT Token 两种方式的请求头构造
- [x] 4.3 实现仓库文件树递归拉取，过滤非源码目录（node_modules、dist、.git 等）
- [x] 4.4 实现文件内容批量拉取，跳过二进制文件（根据扩展名判断）
- [x] 4.5 实现增量同步逻辑：对比文件最后更新时间，仅拉取有变更的文件
- [x] 4.6 实现同步进度报告机制：通过消息通道向 resource.js 推送进度更新

## 5. 资源管理 UI 实现

- [x] 5.1 实现项目列表渲染：空状态提示、项目卡片（名称、地址、同步状态、时间）
- [x] 5.2 实现"添加项目"表单：名称输入、地址输入、鉴权方式切换（SSH/密码）、凭证输入、表单验证
- [x] 5.3 实现项目编辑和删除功能：编辑表单预填、删除确认弹窗、删除时清理 IndexedDB 缓存
- [x] 5.4 实现凭证脱敏显示：密码显示 `****`，SSH Key 显示前20字符+`...`
- [x] 5.5 实现"一键同步最新代码"按钮和单项目同步按钮，调用同步引擎
- [x] 5.6 实现同步状态实时显示：进度条、当前文件名、同步中/成功/失败状态标签

## 6. AI 聊天上下文集成

- [x] 6.1 在 `chat.js` 中注册三个工具函数定义：`search_project_code`、`get_project_file`、`list_project_files`
- [x] 6.2 实现 `search_project_code` 工具：从 IndexedDB 按关键字搜索文件内容，返回匹配片段
- [x] 6.3 实现 `get_project_file` 工具：按项目名+文件路径从 IndexedDB 读取文件完整内容
- [x] 6.4 实现 `list_project_files` 工具：按项目名+目录路径返回文件树结构
- [x] 6.5 在 `buildMessages()` 系统消息中注入已管理项目的摘要信息（项目名、文件数、技术栈）
- [x] 6.6 实现工具返回内容的 token 预算控制：搜索结果≤5条、单文件≤8000字符、文件树≤500条目

## 7. Background 消息路由

- [x] 7.1 在 `background.js` 中添加 Git 同步相关消息路由，代理 API 请求（因需要 fetch 权限）
- [x] 7.2 添加 IndexedDB 操作的消息路由，支持 panel 端读写代码缓存

## 8. 样式

- [x] 8.1 在 `panel.css` 中添加资源管理 Tab 的样式：项目卡片、表单、按钮、进度条、状态标签
- [x] 8.2 添加加载动画（旋转图标）、同步进度条、空状态提示的样式

## 9. 测试与验证

- [ ] 9.1 手动测试添加项目配置流程（SSH Key 和账号密码两种方式）
- [ ] 9.2 手动测试同步功能：首次全量同步、增量同步、同步失败处理
- [ ] 9.3 手动测试 AI 聊天中工具调用：搜索代码、读取文件、列出目录
- [ ] 9.4 验证项目删除后 IndexedDB 缓存同步清除
