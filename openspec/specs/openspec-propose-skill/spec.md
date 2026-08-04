## ADDED Requirements

### Requirement: 技能注册
系统 SHALL 在 `chrome-extension/skills/openspec-propose/` 目录下实现提案技能，通过 `window.__registerSkill()` 注册。技能的 `id` 为 `openspec-propose`，`name` 为 "OpenSpec 提案"，`category` 为 "开发"。

#### Scenario: 技能文件自注册
- **WHEN** `skills/openspec-propose/index.js` 在页面加载时调用 `window.__registerSkill({id: "openspec-propose", name: "OpenSpec 提案", category: "开发", ...})`
- **THEN** 该技能被添加到注册表，且立即进入激活状态

### Requirement: 创建变更提案
技能 SHALL 在激活后根据用户描述创建变更提案。AI 从描述中推导 kebab-case 变更名称，按序生成以下 artifact 文件并存入记忆系统：

#### Scenario: 创建完整变更提案
- **WHEN** 用户发送 `/openspec-propose add-user-auth 增加用户认证功能`
- **THEN** AI 创建记忆文件 `{hostname}/openspec/changes/add-user-auth/proposal.md`，包含 Why/What Changes/Capabilities/Impact 章节
- **AND** 创建 `{hostname}/openspec/changes/add-user-auth/design.md`，包含 Context/Goals/Decisions/Risks 章节（仅当设计复杂度需要时创建）
- **AND** 创建 `{hostname}/openspec/changes/add-user-auth/specs/` 子目录及对应的 capability spec 文件
- **AND** 创建 `{hostname}/openspec/changes/add-user-auth/tasks.md`，包含复选框格式的实现任务清单
- **AND** 所有文件通过 FileCacheManager 存入 IndexedDB

#### Scenario: 无变更名称时自动推导
- **WHEN** 用户仅发送 `/openspec-propose 增加用户认证功能`（未提供 kebab-case 名称）
- **THEN** AI 从描述中自动推导变更名称（如 "add-user-auth"），按该名称创建目录和文件

#### Scenario: 变更已存在时提示冲突
- **WHEN** 用户试图创建已存在的变更名称
- **THEN** AI 通过 `search_memories` 检测到 `{hostname}/openspec/changes/{change-name}/` 目录已存在，提示用户选择覆盖、继续已有变更或使用新名称

### Requirement: 提案技能 Prompt 包含模板
`getPrompt()` SHALL 返回包含完整 artifact 模板的 prompt。模板需包含：proposal.md 的四章节结构（Why/What Changes/Capabilities/Impact）、design.md 的结构（Context/Goals/Decisions/Risks）、tasks.md 的复选框格式。

#### Scenario: AI 按模板生成 artifact
- **WHEN** AI 执行 propose 操作
- **THEN** 生成的 proposal.md 严格遵循模板结构，包含 Why/What Changes/Capabilities/Impact 四个章节
- **AND** 生成的 tasks.md 使用 `- [ ] X.Y Task description` 复选框格式

### Requirement: Propose 后自动持久化
Propose 操作完成后，所有生成的 artifact 文件 SHALL 立即通过 FileCacheManager 存入 IndexedDB，路径为 `{hostname}/openspec/changes/{change-name}/`。

#### Scenario: 文件即时持久化
- **WHEN** AI 完成 propose 并确认全部 artifact 已写入
- **THEN** 用户可通过 `search_memories({pathPrefix: "openspec/changes/<change-name>"})` 立即查询到新创建的变更
