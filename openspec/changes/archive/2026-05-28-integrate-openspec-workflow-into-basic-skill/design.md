## Context

AIHelper 当前已集成 OpenSpec 工作流作为 Kilo 内置能力（通过 `.kilocode/skills/` 和 `.kilocode/workflows/`），但这些仅在 Kilo CLI 环境中可用。AIHelper Chrome 扩展拥有独立的技能系统（通过 `window.__registerSkill()` 注册）和记忆系统（按域名在 IndexedDB 中存储 Markdown 文件）。本设计将 OpenSpec 工作流的四个阶段拆分为四个独立技能，每个技能职责单一、可独立激活，通过共享的记忆层（openspec/changes/ 路径约定）实现数据互通。

## Goals / Non-Goals

**Goals:**
- 在 AIHelper Chrome 扩展中新增 4 个独立的基础技能：
  - `openspec-explore`：需求探索（只读，不写文件）
  - `openspec-propose`：创建变更提案（生成 artifacts）
  - `openspec-apply`：实现变更（按 tasks.md 执行）
  - `openspec-archive`：归档变更（移动到 archive/）
- 4 个技能各自嵌入对应阶段的 Prompt 规则，通过 AI Agent 引导执行
- 生成的 artifact 文件自动存入记忆系统，路径为 `{hostname}/openspec/changes/{change-name}/`
- 4 个技能通过共享的 `openspec/changes/` 路径约定实现数据互通

**Non-Goals:**
- 不在浏览器中运行 `openspec` CLI 工具
- 不修改 Kilo 端的 OpenSpec 集成（`.kilocode/` 下的文件保持不变）
- 不改变现有记忆生成的核心流程（仅扩展）
- 不提供 Git 集成（变更文件仅存储在记忆系统中）

## Decisions

### 决策 1: 四技能独立拆分，通过记忆层共享数据

**选择**: 将 OpenSpec 工作流拆分为 4 个独立技能（explore / propose / apply / archive），每个技能负责一个阶段。4 个技能通过记忆系统中约定的 `{hostname}/openspec/changes/{change-name}/` 路径共享 artifact 数据。

**替代方案**: 合并为单一技能，内部通过子命令区分阶段。

**理由**: 独立拆分后每个技能职责单一、可独立激活（如用户只需探索则只激活 explore），符合 AIHelper 现有技能系统的粒度和设计惯例。通过记忆层共享数据使 4 个技能低耦合——apply 不仅依赖 propose 生成的产物，也能直接操作用户手动创建的变更目录。

### 决策 2: 技能 Prompt 各自独立，内嵌该阶段规则

**选择**: 每个技能的 `getPrompt()` 仅包含对应阶段的完整规则、artifact 模板和记忆系统交互指令。

**替代方案**: 共享一个通用 base prompt，各技能继承后追加阶段特有规则。

**理由**: 4 个阶段差异显著（explore 不写文件，propose 创建文件，apply 修改文件，archive 移动文件），共享 base prompt 会增加耦合且在 AI 理解时可能混淆。独立 prompt 更清晰，AI 激活哪个技能就严格遵循该阶段规则。

### 决策 3: Artifact 文件按域名存入记忆系统

**选择**: 生成的 artifact 文件存储路径为 `{hostname}/openspec/changes/{change-name}/`，与现有记忆文件 `{hostname}/{session-title}.md` 并列，但使用 `openspec/changes/` 子目录区分。

**替代方案**: 独立存储系统（如单独的 IndexedDB store 或 chrome.storage.local）。

**理由**: 复用现有 FileCacheManager 和 IndexedDB 基础设施，用户可通过已有的 `search_memories` / `get_memory_file` 工具查询变更产物。子目录结构使 OpenSpec 产物与普通记忆文件清晰隔离。

### 决策 4: 技能在"基础"分类下、调试模式下可见

**选择**: 4 个 OpenSpec 技能均归类为"基础"，遵循现有"基础"分类仅在调试模式下可见的规则。

**替代方案**: 独立分类或归入"开发"分类。

**理由**: OpenSpec 工作流是面向开发者的底层工具能力，与"页面刷新"、"建立网站大纲"同属辅助性工具。保持"基础"分类的调试模式可见规则一致，避免普通用户困惑。

## Risks / Trade-offs

- **[风险] AI 生成 artifact 质量不稳定**: 完全依赖 AI 理解 prompt 规则来生成 artifact，可能偏离 OpenSpec 标准格式。→ **缓解**: 在 prompt 中提供详细的模板和示例，并在关键步骤要求 AI 自我校验。
- **[风险] 多技能协同时 AI 可能混淆上下文**: 用户可能不按顺序激活技能（如直接 apply 而没有 propose）。→ **缓解**: 每个技能在 prompt 中声明前置条件（apply 需要 tasks.md 存在），AI 会在缺少前置文件时主动引导用户先执行 propose。
- **[权衡] 无 CLI 精确性**: 浏览器端不运行 `openspec` CLI，无法执行结构化状态查询。→ AI 通过记忆文件和对话上下文自行追踪状态，牺牲精确性换取独立性。
