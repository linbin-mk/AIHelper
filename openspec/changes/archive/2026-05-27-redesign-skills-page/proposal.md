## Why

当前"技能"Tab 以完整卡片形式展示 Skill 的详细信息（名称、描述、工具列表、使用提示），卡片占用空间大。随着 Skill 数量增长（当前2个，规划扩展至9个），需要更紧凑的列表布局和分类体系，让用户快速浏览和找到需要的技能。同时用户希望在不离开技能页面的情况下预览 Skill 的 prompt 规则内容并快速触发使用。

## What Changes

- 技能卡片缩小为紧凑行：仅展示标题和简短描述
- 新增分类体系：通用、业务、产品、开发、测试、基础，技能按分类分组展示；"基础"分类仅在调试模式下可见
- 点击技能行弹出详情弹窗：展示 Skill 的 `getPrompt()` 完整内容
- 弹窗右上角添加"使用"快捷按钮：点击后在聊天 Tab 激活该 Skill 并自动填入 `/skill-id `
- 新增 6 个占位 Skill（按分类）：系统解答专家、系统功能使用、研发人天预估、业务问题反馈、需求分析总结、智能测试
- Skill 定义接口扩展 `category` 字段：标识所属分类，可选

## Capabilities

### New Capabilities

- `skill-category-system`: 技能分类体系，Skill 支持声明所属分类，技能 Tab 按分类分组展示
- `skill-detail-popup`: 技能详情弹窗，点击技能行展示完整 prompt 规则，支持"使用"快捷操作

### Modified Capabilities

- `skill-system`: Skill 定义接口新增可选的 `category` 字段；"技能" Tab 的展示行为从完整卡片改为分类分组+紧凑行+点击弹窗

## Impact

- **panel.html**: 技能 Tab 的 DOM 结构需重构，从单层列表改为分类分组布局；新增弹窗 DOM
- **panel.css**: 技能卡片样式改为紧凑行样式，新增弹窗样式，新增分类标签样式
- **panel.js**: `renderSkillsList()` 重写，新增弹窗渲染和事件绑定；`applyDebugMode()` 扩展控制"基础"分类可见性
- **skill-registry.js**: 不变（Skill 定义层面不做修改，category 在 Skill 对象上）
- **skills/*.js**: 现有2个 Skill（test-data-generation、browser-page-refresh）需添加 `category` 字段；新增7个占位 Skill 文件
- **panel.html script 标签**: 新增7个 `<script>` 引入
- **skill-system spec**: REQUIREMENTS 变更（Skill 接口增加 category 字段、技能 Tab 展示行为变更）
