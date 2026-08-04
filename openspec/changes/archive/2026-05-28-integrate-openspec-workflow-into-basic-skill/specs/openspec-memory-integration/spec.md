## ADDED Requirements

### Requirement: OpenSpec 产物存储路径
系统 SHALL 在记忆系统中使用 `{hostname}/openspec/changes/{change-name}/` 路径存储 OpenSpec 变更产物，与普通记忆文件 `{hostname}/{session-title}.md` 共享相同 FileCacheManager 和 IndexedDB 基础设施。

#### Scenario: Artifact 文件写入记忆系统
- **WHEN** AI 通过 `openspec-workflow` 技能创建 artifact 文件
- **THEN** 文件通过 `FileCacheManager.saveFile()` 存入 IndexedDB，路径为 `{current-hostname}/openspec/changes/{change-name}/{artifact-name}.md`
- **AND** 对应的记忆卡片（ai_helper_memory_item）存储在 chrome.storage.local，`type: "memory"`

#### Scenario: 子目录自动创建
- **WHEN** `{hostname}/openspec/` 或 `{hostname}/openspec/changes/` 目录尚不存在
- **THEN** FileCacheManager 自动创建中间目录，与现有目录创建行为一致

#### Scenario: 归档子目录
- **WHEN** 变更被归档
- **THEN** 产物移动到 `{hostname}/openspec/changes/archive/{change-name}/` 路径下

### Requirement: search_memories 支持 OpenSpec 路径过滤
`search_memories` 工具 SHALL 支持通过路径前缀过滤 OpenSpec 产物。当 AI 需要查询变更列表时，可通过路径前缀 `openspec/changes/` 或具体变更路径进行过滤。

#### Scenario: 查询所有活跃变更
- **WHEN** AI 调用 `search_memories({domain: "github.com", pathPrefix: "openspec/changes/"})`
- **THEN** 返回该域名下 `openspec/changes/` 路径中所有文件和目录列表，排除 `archive/` 子目录
- **AND** 每条结果包含文件路径和类型（目录/文件）

#### Scenario: 查询指定变更的 artifact
- **WHEN** AI 调用 `search_memories({domain: "github.com", pathPrefix: "openspec/changes/add-user-auth/"})`
- **THEN** 返回该变更目录下的所有 artifact 文件列表

#### Scenario: 路径前缀不存在时返回空列表
- **WHEN** 指定路径前缀下无任何文件
- **THEN** 返回空数组 `[]`

### Requirement: buildMemoryHint 识别 OpenSpec 产物
`buildMemoryHint()` 函数 SHALL 识别当前域名下的 OpenSpec 变更目录结构，在提示中引导 AI 优先查询相关变更上下文。

#### Scenario: 提示中包含变更概览
- **WHEN** `buildMemoryHint()` 扫描当前域名记忆文件
- **THEN** 识别 `openspec/changes/` 路径下的所有变更目录（排除 `archive/`）
- **AND** 在提示中列出变更名称和状态摘要（如 "add-user-auth (活跃)"、"fix-login-bug (已完成)")
- **AND** 引导 AI 在涉及项目变更时通过 `get_memory_file` 读取相关 artifact

#### Scenario: 无 OpenSpec 产物时不显示变更提示
- **WHEN** 当前域名下不存在 `openspec/` 路径
- **THEN** `buildMemoryHint()` 的提示不包含任何 OpenSpec 变更内容
