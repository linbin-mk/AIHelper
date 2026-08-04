## MODIFIED Requirements

### Requirement: AI 工具 - search_memories 查询记忆文件列表
系统 SHALL 提供 `search_memories` 工具函数供 AI Agent 调用，按域名查询记忆文件列表。工具参数包括：域名（可选，默认当前标签页 hostname）、路径前缀 `pathPrefix`（可选，用于过滤特定子目录）。返回该域名下所有记忆文件名列表和简要信息。

#### Scenario: AI 查询当前域名的记忆文件
- **WHEN** AI Agent 调用 `search_memories` 工具，无参数或参数 `{domain: <当前hostname>}`
- **THEN** 系统查询 IndexedDB 中该域名目录下的所有记忆文件
- **AND** 返回文件路径列表，格式为 `[{path: "github.com/修复websocket断线重连问题.md", content_preview: "前200字"}]`

#### Scenario: AI 通过路径前缀查询 OpenSpec 变更
- **WHEN** AI Agent 调用 `search_memories` 工具，参数为 `{domain: "github.com", pathPrefix: "openspec/changes/"}`
- **THEN** 系统返回该域名下 `openspec/changes/` 路径中的所有文件和目录（排除 `archive/` 子目录）
- **AND** 每条结果包含 `path` 和 `type`（"file" 或 "directory"）

#### Scenario: AI 查询指定域名的记忆文件
- **WHEN** AI Agent 调用 `search_memories` 工具，参数为 `{domain: "stackoverflow.com"}`
- **THEN** 系统返回该域名下的记忆文件列表

#### Scenario: 无记忆文件时返回空列表
- **WHEN** 该域名下无任何记忆文件
- **THEN** 返回空数组 `[]`

### Requirement: AI 工具 - get_memory_file 读取记忆内容
系统 SHALL 提供 `get_memory_file` 工具函数供 AI Agent 调用，读取指定记忆文件的完整内容。工具参数包括：文件路径（必填，如 `github.com/修复websocket断线重连问题.md`）。

#### Scenario: AI 读取具体记忆文件
- **WHEN** AI Agent 调用 `get_memory_file` 工具，参数为 `{path: "github.com/修复websocket断线重连问题.md"}`
- **THEN** 系统从 IndexedDB 读取该文件的完整内容并返回

#### Scenario: AI 读取 OpenSpec artifact 文件
- **WHEN** AI Agent 调用 `get_memory_file` 工具，参数为 `{path: "github.com/openspec/changes/add-user-auth/proposal.md"}`
- **THEN** 系统从 IndexedDB 读取该 artifact 文件的完整内容并返回

#### Scenario: 文件不存在时返回错误
- **WHEN** 请求的记忆文件路径不存在
- **THEN** 系统返回错误提示 "记忆文件未找到: {path}"

## ADDED Requirements

### Requirement: search_memories 支持路径前缀参数
`search_memories` 工具的参数接口 SHALL 扩展 `pathPrefix` 可选参数（字符串），用于按路径前缀过滤记忆文件列表。当指定 `pathPrefix` 时，仅返回路径以该前缀开头的记忆文件和目录。

#### Scenario: 路径前缀过滤生效
- **WHEN** AI Agent 调用 `search_memories({domain: "github.com", pathPrefix: "openspec/changes/add-user-auth"})`
- **THEN** 仅返回路径以 `github.com/openspec/changes/add-user-auth` 开头的记忆文件
- **AND** 不返回其他路径下的记忆文件

#### Scenario: 无匹配前缀时返回空列表
- **WHEN** 指定的 `pathPrefix` 下无任何匹配文件
- **THEN** 返回空数组 `[]`
