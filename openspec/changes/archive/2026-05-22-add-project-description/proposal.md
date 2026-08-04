## Why

资源管理中已配置的 Git 项目缺乏描述信息，AI 聊天时只能根据项目名称和文件列表理解项目，无法获取用户对项目用途、业务背景的说明。添加项目描述字段让用户在配置项目时即可补充业务说明，AI 聊天时会自动注入这些描述，帮助 AI 更准确地理解项目上下文和用户意图。

## What Changes

- 项目配置数据模型新增 `description` 字段（可选，最多 100 个字符）
- 资源管理 UI 的添加/编辑项目表单中新增描述文本输入框，带字数计数
- 项目卡片展示描述内容（截断显示）
- AI 聊天构建系统消息时将项目描述注入到项目上下文中
- 数据持久化兼容：存量项目没有描述字段时默认为空，不影响现有功能

## Capabilities

### New Capabilities
- `project-description`: 项目描述字段的存储、UI 编辑、验证和 AI 上下文注入

### Modified Capabilities
- `git-project-config`: 数据模型新增 `description` 字段（可选，最多 100 字符），存储验证规则调整
- `resource-manager-ui`: 添加/编辑项目表单新增描述输入框；项目卡片展示描述摘要
- `ai-code-context`: 系统消息中的项目上下文注入新增 `description` 字段内容

## Impact

- `chrome-extension/src/panel/resource.js`：项目配置 CRUD、表单渲染、卡片渲染
- `chrome-extension/src/panel/panel.html`：资源管理 Tab 表单项（如描述输入框以动态生成则无需修改 HTML）
- `chrome-extension/src/panel/chat.js`：`buildProjectContext()` 注入描述内容
- `chrome-extension/src/panel/panel.css`：描述输入框及字数计数样式
