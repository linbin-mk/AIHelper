## MODIFIED Requirements

### Requirement: Project summary in system message
系统 SHALL 在 AI 聊天的系统消息中注入已管理项目的摘要信息，包括：项目名称、仓库地址、文件总数、项目描述（如有）、主要技术栈（根据文件扩展名推断）、关键目录列表（最多3层深度）。系统 prompt 构建 MUST 同时注入激活 Skill 的 prompt 片段。

#### Scenario: Inject project summaries into AI context
- **WHEN** 用户发起 AI 聊天且至少有一个已同步的项目
- **THEN** 系统在 buildMessages() 构建的系统消息中包含项目摘要列表，每个项目格式为 `项目名(N文件) - 用户描述内容`

#### Scenario: Inject project context without description
- **WHEN** 项目未填写描述
- **THEN** 系统消息中的项目摘要不包含描述内容，仅显示 `项目名(N文件)`

#### Scenario: No projects configured
- **WHEN** 用户未配置任何项目或所有项目均未同步
- **THEN** 系统消息中不包含项目代码相关上下文

### Requirement: AI tool - search project code
系统 SHALL 提供 `search_project_code` 工具函数供 AI Agent 调用，支持按关键字搜索指定项目的缓存文件内容。工具参数包括：项目名称（必填）、搜索关键字（必填）、搜索范围（文件路径过滤，可选）、结果数量限制（默认5条）。

#### Scenario: AI searches code by keyword
- **WHEN** AI Agent 调用 `search_project_code` 工具，参数为 `{projectName: "示例项目", keyword: "login"}`
- **THEN** 系统从 IndexedDB 中查询该项目下所有文件内容包含 "login" 的文件
- **AND** 返回匹配文件路径、匹配行号和上下文片段（前后各2行），最多5条结果

#### Scenario: AI searches with path filter
- **WHEN** AI Agent 调用 `search_project_code` 工具，参数包含 `pathFilter: "src/api"`
- **THEN** 系统仅搜索文件路径匹配 `src/api` 的文件

#### Scenario: No matching results
- **WHEN** 搜索的关键字在所有项目文件中均未找到
- **THEN** 系统返回空结果提示 "未找到匹配的代码"

### Requirement: AI tool - get project file
系统 SHALL 提供 `get_project_file` 工具函数供 AI Agent 调用，按文件路径获取指定项目中的某个文件完整内容。工具参数包括：项目名称（必填）、文件路径（必填）。

#### Scenario: AI reads a specific file
- **WHEN** AI Agent 调用 `get_project_file` 工具，参数为 `{projectName: "示例项目", filePath: "src/main/java/com/example/Application.java"}`
- **THEN** 系统从 IndexedDB 中查找并返回该文件的完整内容

#### Scenario: File not found in cache
- **WHEN** 请求的文件路径在项目缓存中不存在
- **THEN** 系统返回错误提示 "文件未在缓存中找到，请先同步项目"

### Requirement: AI tool - list project files
系统 SHALL 提供 `list_project_files` 工具函数供 AI Agent 调用，列出指定项目的文件目录结构。工具参数包括：项目名称（必填）、目录路径（可选，默认根目录）、深度（可选，默认2层）。

#### Scenario: AI lists project root structure
- **WHEN** AI Agent 调用 `list_project_files` 工具，参数为 `{projectName: "示例项目"}`
- **THEN** 系统返回该项目根目录下2层深度的文件树结构

#### Scenario: AI lists specific subdirectory
- **WHEN** AI Agent 调用 `list_project_files` 工具，参数为 `{projectName: "示例项目", directoryPath: "src/views", depth: 3}`
- **THEN** 系统返回 `src/views` 目录下3层深度的文件树

### Requirement: Context token budget management
系统 SHALL 在注入项目代码上下文时遵守 token 预算限制。工具返回的内容 MUST 遵守以下规则：搜索结果最多返回5条、单文件内容不超过8000字符（超出部分截断并标注）、文件树列表最多500个条目，超出部分标注省略。

#### Scenario: File content exceeds limit
- **WHEN** AI 请求的文件内容超过8000字符
- **THEN** 系统返回前8000字符，并在末尾标注 `[文件内容已截断，总长度: <N> 字符]`

#### Scenario: Search results exceed limit
- **WHEN** 搜索匹配的文件超过5条
- **THEN** 系统返回前5条最佳匹配结果，标注 `[搜索结果已截断，共匹配 <N> 个文件]`

## ADDED Requirements

### Requirement: 系统 prompt 包含激活 Skill 的规则
系统 SHALL 在 `buildSystemPrompt()` 中，将基础上下文（身份、请求列表注入）与所有激活 Skill 的 `getPrompt()` 输出拼接。拼接格式为：基础上下文 + `## 可用技能\n\n` + 各 Skill prompt 片段（用 `---` 分隔）。

#### Scenario: 单个 Skill 激活时 prompt 包含其规则
- **WHEN** 仅 `test-data-generation` Skill 激活
- **THEN** 系统消息末尾包含 "## 可用技能" 章节，后跟该 Skill 的 prompt 片段（含两步约束规则、taskCard 格式、执行流程）

#### Scenario: 无 Skill 激活时 prompt 不含技能章节
- **WHEN** 所有 Skill 均停用
- **THEN** 系统消息中不包含 "## 可用技能" 章节，仅包含基础上下文

### Requirement: 工具定义动态合并
系统 SHALL 在发送给 LLM 的 TOOLS 数组中，动态合并所有激活 Skill 的 `getTools()` 返回值。每个工具定义 MUST 仅保留 `type` 和 `function` 字段（`handler` 等运行时字段不发送给 LLM）。

#### Scenario: 合并多个 Skill 的工具定义
- **WHEN** 两个 Skill 各自提供 2 个工具定义
- **THEN** 发送给 LLM 的 tools 数组包含 4 个工具定义，每个仅含 `{type: "function", function: {name, description, parameters}}`

#### Scenario: 工具定义去重
- **WHEN** 两个 Skill 提供同名工具（相同的 `function.name`）
- **THEN** tools 数组中去重，保留后激活 Skill 的版本
