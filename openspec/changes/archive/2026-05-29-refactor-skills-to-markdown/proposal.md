## Why

当前技能系统使用 JavaScript `index.js` 文件定义技能，每个技能需要编写代码（IIFE + `window.__registerSkill`），并在 `panel.html` 中手动添加 `<script>` 标签引入。这种方式增加了技能创建和维护的门槛，非开发人员难以参与技能编写。将技能格式统一为 Markdown 自然语言文件，结合已有的基础卡片组件（询问卡、授权卡、表格卡、下载卡），可以大幅降低技能编写门槛，实现技能内容与代码逻辑的解耦。

## What Changes

- **BREAKING**: 技能文件格式从 `index.js`（JavaScript 代码）变更为 `skill.md`（Markdown 自然语言），所有现有 13 个技能需要迁移
- 新增技能 MD 文件格式规范，包含元数据（YAML front matter）和自然语言内容
- 插件初始化时动态扫描 `chrome-extension/skills/` 目录，自动加载所有技能 MD 文件
- 移除 `panel.html` 中对技能 JS 文件的硬编码 `<script>` 引入
- 技能页面点击技能后直接渲染对应技能 MD 文件的内容
- 技能提示词（system prompt）从 MD 文件内容中提取，而非 JS 函数生成
- 工具调用（如 `ask_user`、`request_auth`、`display_table`、`provide_file`）通过 AI 理解 MD 中的自然语言描述自动调用已有基础组件，不再需要在技能中编写工具处理代码

## Capabilities

### New Capabilities
- `skill-md-format`: 技能 MD 文件格式规范，定义 YAML front matter 元数据字段（id、name、description、category、tools 等）和正文内容结构
- `skill-md-loader`: 技能动态加载机制，在插件初始化时扫描技能目录，解析 MD 文件并注册到 SkillRegistry

### Modified Capabilities
- `skill-system`: 技能注册方式从 JS IIFE 变更为 MD 文件动态加载，SkillRegistry 接口保持不变但加载路径改变
- `skill-detail-popup`: 技能详情弹窗从硬编码的 4 段式布局变更为渲染 MD 文件内容
- `skill-category-system`: 技能分类信息从 JS 对象中提取变更为从 MD front matter 中读取
- `code-master-skill`: 代码大师技能从 JS 格式迁移到 MD 格式
- `openspec-propose-skill`: OpenSpec 提案技能迁移到 MD 格式
- `openspec-apply-skill`: OpenSpec 实现技能迁移到 MD 格式
- `openspec-explore-skill`: OpenSpec 探索技能迁移到 MD 格式
- `openspec-archive-skill`: OpenSpec 归档技能迁移到 MD 格式
- `website-outline-skill`: 网站地图技能迁移到 MD 格式
- `skill-test-data-generation`: 测试数据生成技能迁移到 MD 格式，其 UI 委托（taskCard）能力通过基础组件实现

## Impact

- 所有 `chrome-extension/skills/*/index.js` 文件将被替换为 `skill.md`
- `chrome-extension/src/panel/panel.html` 移除技能 `<script>` 标签
- `chrome-extension/src/panel/skill-registry.js` 增加 MD 文件加载逻辑
- `chrome-extension/src/panel/panel.js` 修改技能列表渲染和详情展示逻辑
- `chrome-extension/src/panel/chat.js` 修改系统提示词构建逻辑（从 MD 内容生成而非调用 JS 函数）
- `chrome-extension/src/panel/panel.css` 技能详情样式适配 MD 渲染
