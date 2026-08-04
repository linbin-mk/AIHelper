## Why

当前AI聊天仅能基于页面捕获的网络请求数据提供上下文，无法获取项目源代码信息。开发者在使用AI Helper时需要频繁切换窗口查看代码，效率低下。通过添加资源管理功能，允许用户配置Git项目源并自动拉取代码到插件本地，AI聊天可以结合项目代码给出更精准的答案（如代码分析、API调用建议、bug定位等）。

## What Changes

- 在Side Panel中新增"资源管理"Tab，与"请求监控"、"AI聊天"、"配置"并列
- 支持配置多个Git项目源，每个项目包含名称、Git仓库地址、鉴权方式（SSH Key 或 账号密码）
- 配置保存后自动clone项目到插件管理的本地目录
- 提供"一键同步最新代码"功能，批量或单独拉取所有已配置项目的最新代码
- AI聊天上下文注入已管理项目的文件结构和关键代码片段，使AI能结合项目代码回答问题
- **BREAKING**: 无破坏性变更

## Capabilities

### New Capabilities
- `resource-manager-ui`: 资源管理Tab的UI界面，包括项目列表展示、添加/编辑/删除项目配置表单、同步状态显示
- `git-project-config`: Git项目源的配置增删改查，包括名称、地址、鉴权方式（SSH Key/账号密码）的持久化存储
- `git-sync`: Git仓库的clone和pull操作，支持SSH Key和账号密码两种鉴权方式，提供一键同步功能
- `ai-code-context`: AI聊天上下文扩展，注入已管理项目的文件结构和关键代码片段，支持AI通过工具调用查询项目代码

### Modified Capabilities
<!-- 无现有能力被修改 -->

## Impact

- **新增文件**: `chrome-extension/src/panel/resource.js`（资源管理Tab逻辑）、resource相关CSS样式（追加到 panel.css 或独立文件）
- **修改文件**: `chrome-extension/src/panel/panel.html`（添加Tab标签和视图容器）、`chrome-extension/src/panel/panel.js`（Tab切换逻辑）、`chrome-extension/src/panel/chat.js`（AI上下文注入扩展）、`chrome-extension/src/background.js`（添加Git操作消息路由）
- **新增权限**: 可能需要在 manifest.json 中添加文件系统访问权限
- **存储**: 新增 `ai_helper_git_projects` 存储键用于持久化项目配置
