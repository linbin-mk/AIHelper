## Why

当前 AI Chat 的"测试数据创建"能力全部硬编码在 `chat.js` 中——prompt 规则、工具定义、工具分发、taskCard UI 渲染和执行流程耦合在一个文件里。每新增一个 AI 能力（如代码审查、接口调试）都需要修改核心文件，系统缺乏可扩展性。需要引入 Skill 抽象，将 AI 能力模块化，让每个 Skill 自包含 prompt + tools + UI，支持按需激活和组合。

## What Changes

- 引入 **Skill 抽象层**：每个 Skill 封装 prompt 片段、可用工具列表、UI 组件（可选），通过统一的 `SkillRegistry` 注册和激活
- 在 Panel 导航栏新增 **"技能"Tab**，展示所有已注册的 Skill 列表，支持查看详情和切换激活状态
- 将"测试数据创建"重构为第一个 Skill：**`test-data-generation`**——从 `chat.js` 中抽离其 prompt 规则、taskCard 解析/渲染/执行逻辑到独立 Skill 模块
- 重构 `chat.js` 的 Agent Loop：系统 prompt 由 Skill 动态注入，工具分发由 Skill 声明驱动（替代硬编码的 if-else 链）
- 保持用户交互流程不变：chat 中输入需求 → AI 生成 taskCard → 用户确认执行

## Capabilities

### New Capabilities
- `skill-system`: Skill 抽象定义、注册表（registry）、激活管理、生命周期（register/activate/deactivate），以及 Panel 中的"技能"Tab UI
- `skill-test-data-generation`: 测试数据生成 Skill，包含数据生成专用 prompt 规则、taskCard 格式定义、taskCard UI 渲染与执行交互逻辑

### Modified Capabilities
- `agent-execute-tool`: Chat Agent 的工具分发机制从硬编码 if-else 改为 Skill 声明驱动
- `ai-code-context`: 系统 prompt 构建从固定字符串改为 Skill 动态注入

## Impact

- **chat.js**：重构 Agent Loop 的 prompt 构建和工具分发，支持 Skill 动态注入
- **panel.js/panel.html/panel.css**：新增"技能"Tab 和 Skill 列表 UI
- **新增文件**：`skill-registry.js`、`skills/test-data-generation/`（prompt.md + tools.js + ui.js）
- 现有功能行为不变，用户交互流程保持不变
