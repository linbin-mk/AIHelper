## Why

AIHelper 项目已集成了 OpenSpec 四个技能（探索、提案、实现、归档），但它们各自独立、命令拗口，对非技术用户来说理解成本过高——用户需要掌握 `/opsx:propose`、`/opsx:apply`、`/opsx:archive` 等多条斜杠命令，并理解 proposal/design/specs/tasks 等抽象概念。需要提供一个统一的、向导式的入口，通过询问卡片引导用户一步步完成从需求描述到代码实现的完整流程。

## What Changes

- 新增 "代码大师" Skill（id: `code-master`，分类："开发"），作为代码开发的统一向导入口
- Skill 通过 `askUser` 工具驱动多轮询问卡片，逐阶段引导用户：描述需求 → 确认方案 → 开始实现 → 完成归档
- Skill prompt 内置完整的 OpenSpec 工作流逻辑，自动调度 openspec CLI 完成各阶段操作
- 在 Skill 注册列表中展示，支持斜杠命令 `/代码大师` 发现

## Capabilities

### New Capabilities
- `code-master-skill`: "代码大师"向导式 Skill，通过询问卡片引导用户完成从需求到代码的完整开发生命周期。覆盖需求描述、方案确认、代码实现、测试验证、归档完成五个阶段，每个阶段通过 askUser 工具发起结构化询问，用户通过点击选项即可推进流程，无需手动输入 CLI 命令。

### Modified Capabilities
<!-- 不修改现有 spec 的需求，仅新增一个 Skill -->

## Impact

- 新增文件：`.kilocode/skills/code-master/SKILL.md`（Skill 定义和完整 prompt）
- 依赖现有能力：`ai-question-card`（askUser 工具）、`skill-system`（Skill 注册机制）、openspec CLI
- 不修改现有代码和配置，纯增量变更
