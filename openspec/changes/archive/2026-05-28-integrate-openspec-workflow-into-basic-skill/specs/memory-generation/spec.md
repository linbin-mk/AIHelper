## ADDED Requirements

### Requirement: 记忆生成支持 OpenSpec 目录结构
`generateMemory()` 函数 SHALL 在对话结束后扫描 `{hostname}/openspec/changes/` 路径，将新增或修改的 artifact 文件作为记忆持久化。OpenSpec 产物的生成不经过 AI 总结步骤，直接以原始内容存入记忆系统。

#### Scenario: Propose 后 artifact 文件自动成为记忆
- **WHEN** AI 对话中执行 `/opsx:propose` 并生成了 proposal.md、design.md、tasks.md 等文件
- **THEN** 对话结束后，这些文件通过 FileCacheManager 存入 IndexedDB，路径为 `{hostname}/openspec/changes/{change-name}/`
- **AND** 同时创建对应的记忆卡片（ai_helper_memory_item），`type: "memory"`

#### Scenario: Apply 后更新已有记忆
- **WHEN** AI 对话中执行 `/opsx:apply` 更新了 tasks.md
- **THEN** 对话结束后，更新后的 tasks.md 覆盖 IndexedDB 中已有同名文件
- **AND** 记忆卡片对应的 knowledgeId 保持不变

#### Scenario: 无 OpenSpec 操作时不产生额外记忆
- **WHEN** 对话不涉及 OpenSpec 操作
- **THEN** `generateMemory()` 按原有逻辑处理，不扫描 `openspec/changes/` 路径

### Requirement: 记忆文件命名遵循 OpenSpec 规范
OpenSpec artifact 记忆文件 SHALL 保持标准命名（proposal.md、design.md、tasks.md、specs/*.md），不添加时间戳或序号。目录结构遵循 `openspec/changes/{change-name}/` 模式。

#### Scenario: Artifact 文件命名
- **WHEN** 变更名称为 `add-user-auth`
- **THEN** 生成的 artifact 文件路径为 `{hostname}/openspec/changes/add-user-auth/proposal.md`
- **AND** spec 文件路径为 `{hostname}/openspec/changes/add-user-auth/specs/{capability}/spec.md`

#### Scenario: 同名变更覆盖更新
- **WHEN** 用户对同一变更名称重复执行 `/opsx:propose`
- **THEN** 新生成的 artifact 文件覆盖已有的同名文件
- **AND** 提示用户确认覆盖操作
