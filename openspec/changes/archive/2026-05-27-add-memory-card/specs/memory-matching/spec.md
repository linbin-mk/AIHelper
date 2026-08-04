## ADDED Requirements

### Requirement: AI 工具 - search_memories 查询记忆文件列表
系统 SHALL 提供 `search_memories` 工具函数供 AI Agent 调用，按域名查询记忆文件列表。工具参数包括：域名（可选，默认当前标签页 hostname）。返回该域名下所有记忆文件名列表和简要信息。

#### Scenario: AI 查询当前域名的记忆文件
- **WHEN** AI Agent 调用 `search_memories` 工具，无参数或参数 `{domain: <当前hostname>}`
- **THEN** 系统查询 IndexedDB 中该域名目录下的所有记忆文件
- **AND** 返回文件路径列表，格式为 `[{path: "github.com/修复websocket断线重连问题.md", content_preview: "前200字"}]`

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

#### Scenario: 文件不存在时返回错误
- **WHEN** 请求的记忆文件路径不存在
- **THEN** 系统返回错误提示 "记忆文件未找到: {path}"

### Requirement: 大模型通过文件名判断记忆相关性
记忆文件以会话标题命名，文件名自带语义。大模型 SHALL 根据文件名自行判断该记忆是否与当前问题相关，决定是否调用 `get_memory_file` 读取完整内容。

#### Scenario: 大模型判断文件名相关后读取
- **WHEN** 用户问"怎么处理websocket断线"，且 `search_memories` 返回的文件列表中包含 `修复websocket断线重连问题.md`
- **THEN** 大模型应自行判断该文件名与当前问题高度相关
- **AND** 调用 `get_memory_file` 获取该记忆的完整内容供参考

#### Scenario: 大模型判断文件名不相关时跳过
- **WHEN** `search_memories` 返回的文件名均与当前问题无关
- **THEN** 大模型不调用 `get_memory_file`，直接基于当前知识回答

### Requirement: 工具定义注册
系统 SHALL 在 AI Agent 初始化时将 `search_memories`、`get_memory_file` 两个工具注册到 tools 定义数组中，与现有 `search_project_code`、`get_project_file` 等工具并列。工具的 description MUST 使用中文描述，引导大模型在涉及当前域名的问题时优先查询记忆。

#### Scenario: 记忆工具在 agent loop 中可用
- **WHEN** AI Agent 开始推理循环
- **THEN** 上述两个记忆工具在 tools 数组中可用，大模型可根据需要调用
- **AND** 工具描述中包含 "当用户问题与当前网站相关时，先查询记忆文件获取历史经验" 的引导语
