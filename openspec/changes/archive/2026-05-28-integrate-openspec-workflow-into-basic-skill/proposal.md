## Why

当前 AIHelper 的"基础"技能分类仅包含底层辅助工具（browser-page-refresh、website-outline），缺少结构化变更管理能力。OpenSpec 提供了一套成熟的规约驱动开发工作流（探索→提案→实现→归档），但仅在 Kilo CLI 环境中可用。将 OpenSpec 工作流的四个阶段分别作为独立技能集成到 AIHelper 的"基础"技能中，每个技能职责单一、可独立激活，产生的文件自动归档到记忆系统的对应域名下，实现跨工具的变更管理一致性。

## What Changes

- 新增 4 个独立基础技能（skill），每个对应 OpenSpec 工作流的一个阶段：
  - `openspec-explore`：探索模式，需求分析与问题调查（只读，不产生文件）
  - `openspec-propose`：创建变更提案，生成 proposal.md / design.md / specs/*.md / tasks.md
  - `openspec-apply`：按 tasks.md 逐步实现变更
  - `openspec-archive`：归档已完成的变更
- 4 个技能共享同一套记忆存储规范：artifact 文件存入 `{hostname}/openspec/changes/{change-name}/`
- 对话结束后自动触发记忆生成，将变更产物作为记忆持久化

## Capabilities

### New Capabilities
- `openspec-explore-skill`: 探索模式技能 —— AI 进入思考伙伴角色，与用户探讨需求、分析问题、澄清范围，不产生任何文件写入，仅输出分析结果。
- `openspec-propose-skill`: 提案技能 —— AI 根据用户描述创建变更目录，依次生成 proposal.md（动机与变更范围）、design.md（技术方案）、specs/*.md（能力规约）、tasks.md（实现任务清单），所有文件存入记忆系统。
- `openspec-apply-skill`: 实现技能 —— AI 读取指定变更的 tasks.md 和 design.md，按依赖顺序逐步实现任务，每完成一项标记状态，更新记忆文件。
- `openspec-archive-skill`: 归档技能 —— AI 检查变更完成度，将已完成变更的产物移动到 `archive/` 子目录，记录归档时间和状态。
- `openspec-memory-integration`: 将 OpenSpec 生成的 artifact 文件集成到记忆系统中，按域名分层存储，支持记忆搜索和查询。

### Modified Capabilities
- `skill-system`: 新增 4 个 OpenSpec 技能的注册、激活/停用管理
- `skill-category-system`: 在"基础"分类中添加 4 个 OpenSpec 技能项，保持调试模式下可见的规则
- `memory-generation`: 扩展记忆生成逻辑，支持识别和存储 OpenSpec artifact 目录结构
- `memory-matching`: 扩展记忆搜索工具，支持按变更名称、状态、路径等维度搜索 OpenSpec 变更记录

## Impact

- `chrome-extension/skills/`: 新增 4 个技能目录（openspec-explore/、openspec-propose/、openspec-apply/、openspec-archive/），每个包含 index.js
- `chrome-extension/src/panel/skill-registry.js`: 注册 4 个新技能的类型定义和元信息
- `chrome-extension/src/panel/memory.js`: 扩展记忆生成和搜索逻辑，增加 OpenSpec 目录结构的识别
- 无外部依赖变更，纯前端实现
