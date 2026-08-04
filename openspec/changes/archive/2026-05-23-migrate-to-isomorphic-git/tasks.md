## 1. 基础设施 - 内存文件系统

- [x] 1.1 创建 `chrome-extension/src/panel/git-ops.js` 模块文件，声明命名空间`GitOps`
- [x] 1.2 实现 `createMemoryFS()` 内存文件系统适配器，使用 `Map` 结构存储文件路径到内容的映射，满足 isomorphic-git 的 `fs` 接口要求（`promises.mkdir`、`promises.writeFile`、`promises.readFile`、`promises.stat`、`promises.readdir`、`promises.unlink`、`promises.rmdir`）
- [x] 1.3 实现 `validateGitFS(fs)` 校验函数，检查内存文件系统实例的完整性和基本方法可用性

## 2. Git 操作核心

- [x] 2.1 实现 `makeHTTP()` 函数，返回基于 `fetch` 的 HTTP 客户端，供 isomorphic-git 使用
- [x] 2.2 实现 `makeAuthCallback(project)` 函数，将项目配置的 authType 和凭证转为 isomorphic-git 的 `onAuth` 回调格式。password 类型返回 `{ username, password }`，sshkey 类型返回 `{ ssh: { privateKey } }`
- [x] 2.3 实现 `cloneRepo(project, onProgress)` 函数，调用 `isomorphicGit.clone()` 执行 `depth: 1, singleBranch: true` 浅克隆，返回 `{ commitHash, filePaths, fs, dir }`
- [x] 2.4 实现 `getRemoteHead(project)` 函数，使用 `isomorphicGit.getRemoteInfo()` 获取远程 HEAD commit hash，用于增量同步判断
- [x] 2.5 实现 `extractSourceFiles({ fs, dir, filePaths }, onProgress)` 函数，遍历 filePaths，使用 `isomorphicGit.readBlob()` 读取内容，按 `SOURCE_EXTENSIONS`/`SKIP_DIRS`/`BINARY_EXTENSIONS` 过滤，返回 `[{ path, content }]`
- [x] 2.6 实现 `getProjectFiles(fs, dir)` 函数，调用 `isomorphicGit.listFiles()` 获取仓库完整文件列表
- [x] 2.7 实现 `currentBranch(fs, dir)` 函数，调用 `isomorphicGit.currentBranch()` 获取默认分支名

## 3. 认证与 URL 解析

- [x] 3.1 重构 `parseGitUrl()` 函数，增强为通用平台识别：解析 `https://`、`ssh://`、`git@` 格式，返回 `{ url, platform }`，platform 从 URL 中自动识别（github/gitlab/bitbucket/gitee/unknown）
- [x] 3.2 认证由 `makeAuthCallback()` 统一处理，isomorphic-git 的 `onAuth` 回调自动生成 HTTP 认证头（Basic Auth），无需额外 `buildAuthHeaders` 函数
- [x] 3.3 `makeAuthCallback()` 已覆盖 password（返回 `{ username, password }`）和 sshkey（返回 `{ ssh: { privateKey } }`）两种 authType
- [x] 3.4 更新 `validateProjectConfig()` 函数，新增项目名称英文-only 验证规则，正则 `/^[a-zA-Z0-9][-a-zA-Z0-9_.]*$/`，拒绝中文、空格等字符，提示"项目名称仅支持英文、数字、连字符和下划线"
- [x] 3.5 更新项目表单 UI 中的名称输入框，添加输入限制提示文字"仅支持英文、数字、连字符和下划线"

## 4. 同步流程集成（resource.js）

- [x] 4.1 修改 `syncProject()` 函数，用 `GitOps.cloneRepo()` + `GitOps.extractSourceFiles()` 替换 `GitLabAPI.fetchTree()` + `GitLabAPI.fetchFileContent()` 调用链
- [x] 4.2 实现增量同步：syncProject 开始时调用 `GitOps.getRemoteHead()` 获取远程 commit hash，与项目配置中的 `lastCommitHash` 对比，一致则跳过克隆并提示"已是最新代码"
- [x] 4.3 同步完成后更新项目配置的 `lastCommitHash` 字段，调用 `updateProjectSyncStatus()` 更新同步状态和时间
- [x] 4.4 将 isomorphic-git 的 `onProgress` 事件映射到现有进度 UI 更新逻辑，展示阶段（compressing/receiving/extract）和进度百分比
- [x] 4.5 处理同步错误：捕获 isomorphic-git 异常，分类为认证错误（401/403/Unauthorized）、网络错误（ENOTFOUND/ECONNREFUSED），通过现有 UI 错误提示机制展示
- [x] 4.6 `loadProjects()` 加载项目时字段 `lastCommitHash` 默认为 undefined（缺失时视为首次同步），无需特殊兼容逻辑

## 5. 数据兼容与清理

- [x] 5.1 修改 `FileCacheManager` 和 `TreeCacheManager`，将 IndexedDB 数据隔离 key 从 `projectId`（自动生成）改为 `projectName`（项目名称）。`files` 存储的 `id` 字段改为 `projectName + '::' + path`，`trees` 存储的 `keyPath` 改为 `projectName`。DB_VERSION 升级到 2
- [x] 5.2 修改 `syncProject()` 等调用方，传入 `project.name` 替代 `project.id` 作为 IndexedDB 操作的 key 参数。AI 上下文工具（`searchProjectCode`、`getProjectFile`、`listProjectFiles`）同步更新
- [x] 5.3 保持 `buildTreeStructure()` 和 `renderFileTree()` 的文件树构建和渲染逻辑不变
- [x] 5.4 删除旧 `GitLabAPI` 对象（`findProjectId`、`fetchTree`、`fetchFileContent`、`buildHeaders`），统一使用 isomorphic-git 处理所有 git 拉取
- [x] 5.5 已删除 GitLab API 分页逻辑（`per_page`、`page` 参数），isomorphic-git 内部处理传输

## 6. 加载与初始化

- [x] 6.1 在 `panel.html` 中通过 `<script>` 标签加载 isomorphic-git 的 `index.umd.min.js` UMD 构建
- [x] 6.2 在 `panel.html` 中在 `resource.js` 之前加载 `git-ops.js`，确保 `GitOps` 命名空间在资源管理初始化时可用

## 7. 验证与测试

- [ ] 7.1 手动测试：使用 HTTPS GitLab 仓库 + PAT Token 认证执行同步，验证文件树和内容正确缓存到 IndexedDB
- [ ] 7.2 手动测试：使用 HTTPS GitHub 公开仓库 + 无认证执行同步，验证跨平台支持
- [ ] 7.3 手动测试：增量同步场景 — 首次同步后再次触发同步，验证 "已是最新代码" 提示
- [ ] 7.4 手动测试：认证失败场景 — 使用错误凭证，验证 "认证失败" 错误提示
- [ ] 7.5 手动测试：AI 上下文工具（`search_project_code`、`get_project_file`、`list_project_files`）在同步后功能正常
- [ ] 7.6 验证内存释放：同步完成后检查浏览器内存使用，确认内存文件系统已释放
