## ADDED Requirements

### Requirement: 技能注册
系统 SHALL 在 `chrome-extension/skills/openspec-archive/` 目录下实现归档技能，通过 `window.__registerSkill()` 注册。技能的 `id` 为 `openspec-archive`，`name` 为 "OpenSpec 归档"，`category` 为 "开发"。

#### Scenario: 技能文件自注册
- **WHEN** `skills/openspec-archive/index.js` 在页面加载时调用 `window.__registerSkill({id: "openspec-archive", name: "OpenSpec 归档", category: "开发", ...})`
- **THEN** 该技能被添加到注册表，且立即进入激活状态

### Requirement: 归档已完成变更
技能 SHALL 在激活后检查变更完成状态，将已完成变更的产物目录移动到归档路径 `{hostname}/openspec/changes/archive/{change-name}/`，并记录归档元信息。

#### Scenario: 归档已完成变更
- **WHEN** 用户发送 `/openspec-archive add-user-auth`，且 tasks.md 中所有任务均已标记为 `[x]`
- **THEN** AI 将 `{hostname}/openspec/changes/add-user-auth/` 下的所有文件移动到 `{hostname}/openspec/changes/archive/add-user-auth/`
- **AND** 在变更目录下创建 `archive-info.md`，记录归档时间和完成状态

#### Scenario: 无变更名称时列出可归档变更
- **WHEN** 用户仅发送 `/openspec-archive` 未指定变更名称
- **THEN** AI 通过 `search_memories({pathPrefix: "openspec/changes/"})` 查询所有活跃变更，分析各变更的 tasks.md 完成度，列出可归档的变更

#### Scenario: 归档未完成变更时警告
- **WHEN** 用户发送 `/openspec-archive add-user-auth`，但 tasks.md 中存在未完成任务
- **THEN** AI 提示用户该变更尚未完成，列出未完成任务清单，询问确认后执行强制归档

#### Scenario: 变更不存在时提示
- **WHEN** 用户指定的变更名称在 `openspec/changes/` 路径下不存在
- **THEN** AI 提示用户该变更不存在，列出当前活跃变更供参考

### Requirement: 归档后更新记忆索引
归档操作完成后，记忆索引 SHALL 反映目录变化：`search_memories` 按路径前缀查询时，归档后的变更不再出现在活跃变更列表中，而是出现在 `archive/` 子路径下。

#### Scenario: 归档后查询变化
- **WHEN** `add-user-auth` 变更被归档后
- **THEN** `search_memories({pathPrefix: "openspec/changes/"})` 不再包含 `add-user-auth/` 目录
- **AND** `search_memories({pathPrefix: "openspec/changes/archive/"})` 包含 `add-user-auth/` 目录
