## Context

当前测试数据生成 Skill 架构分为两层：
1. **Prompt 层**（`skill.cn.md` / `skill.en.md`）：YAML frontmatter 元数据 + Markdown 规则文档，定义 AI 的行为指令
2. **UI 层**（`index.js`）：注册 Skill 到系统，包含 `getPrompt()`、`onMessageParsed()` 中自定义解析并渲染 taskCard/combinedTaskCard UI 组件

现有 UI 层维护了大量自定义卡片渲染代码（`parseTaskCardFromText`、`renderTaskCard`、`parseCombinedTaskCardFromText`、`renderCombinedTaskCard` 等），这些组件本质上是在聊天消息中做 UI 注入。系统已有 `display_table`（表格展示）和 `ask_user`（用户确认卡）等基础交互工具，可替代这些自定义组件。

本次升级将复用系统现有基础卡片工具，移除 `index.js` 中的自定义 taskCard/combinedTaskCard 渲染逻辑，让 AI 在 prompt 指引下通过工具组合完成交互。

## Goals / Non-Goals

**Goals:**
- 将 Skill prompt 从"请求捕获分析执行器"重写为"规则驱动的正向测试数据生成器"
- 新增字段生成策略表、智能错误分类决策树、接口探测四步法、多轮对话记忆规则
- **用系统基础工具取代自定义 taskCard/combinedTaskCard UI**：AI 用 `display_table` 展示数据预览，用 `ask_user` 获取用户确认，不再依赖 `index.js` 的自定义卡片渲染
- `index.js` 做减法：移除所有 taskCard/combinedTaskCard 解析与渲染代码，Skill 注册保持最简
- 同步更新 EN 版 Skill 定义

**Non-Goals:**
- 不修改 Skill 工具集（`getTools()` 返回的工具列表不变）
- 不改变 Background Service Worker 逻辑
- 不改变 Skill 注册清单（manifest.json）
- 不在 `index.js` 中新增任何自定义 UI 组件
- 不新增后端 API 接口

## Decisions

### Decision 1: 用系统工具取代自定义 taskCard UI

**方案**：在 Skill prompt 中指导 AI 使用 `display_table` 工具展示数据预览表格，使用 `ask_user` 工具生成用户确认卡片。`index.js` 不再做自定义消息解析和卡片渲染，移除所有 taskCard/combinedTaskCard 相关代码。

**理由**：
- 系统已有 `display_table`（表格式数据展示）和 `ask_user`（确认/取消交互）两个基础工具，完全覆盖 taskCard 的功能需求
- 自定义卡片渲染代码（~600 行）维护成本高，且与系统工具功能重叠
- AI 自由组合工具比硬编码的 taskCard 格式更灵活

**替代方案**：保留 taskCard 作为快捷方式。被拒绝原因：双重实现增加维护负担，且 taskCard 固定格式限制了 AI 的灵活性。

### Decision 2: `index.js` 做减法

**方案**：`index.js` 只保留 Skill 注册（`__registerSkill` 调用），移除 `onMessageParsed` 中的 taskCard/combinedTaskCard 解析逻辑。移除的函数包括：
- `parseTaskCardFromText()`
- `renderTaskCard()`
- `updateTaskCard()`
- `parseMultipleTaskCards()`
- `parseCombinedTaskCardFromText()`
- `renderCombinedTaskCard()`
- `updateCombinedTaskCard()`
- `extractTaskCardJSONs()`
- `handleTaskExecute()`
- `handleCombinedTaskExecute()`
- `executeCombinedStep()`
- `attachTaskCardEvents()`
- `attachCombinedTaskCardEvents()`

保留：Skill 注册元数据、`getPrompt()`、`getTools()`、`getUIDelegate()` 骨架。

**理由**：这些函数的核心功能已被系统基础工具覆盖，保留冗余代码增加维护负担。

### Decision 3: Prompt 中明确工具使用模式

**方案**：在 Skill prompt 的"工作流程"章节中，明确指导 AI 使用以下工具组合：

```
数据展示阶段：
  使用 display_table 工具展示生成的数据预览表格
  （不输出 taskCard JSON，不输出 markdown 表格，由 display_table 渲染）

确认阶段：
  使用 ask_user 工具生成确认卡片，包含操作摘要和风险提示
  选项："允许执行" / "取消"

执行阶段：
  用户确认后，使用 execute_request 工具按计划执行 API 调用
```

**理由**：将交互模式标准化到 prompt 中，AI 始终使用相同工具组合，用户获得一致的体验。

## Risks / Trade-offs

- **[工具支持] `display_table` 和 `ask_user` 工具是否已有成熟实现** → 需确认工具已可用且渲染稳定，否则需先完善工具
- **[AI 遵从性] AI 可能不按工具组合模式操作** → prompt 中提供具体示例和强制约束，强调必须使用工具而非输出 markdown 表格
- **[体验变化] 从"一次性 taskCard 确认"变为"工具调用-确认"流程** → display_table + ask_user 组合的交互步数可能比 taskCard 多一步，需在 prompt 中优化流程
- **[中文版同步] EN 版 prompt 翻译质量** → 同步翻译中文 prompt 内容到 EN 版
