# memory-matching

## 新增需求

### 需求：AI 工具 - search_memories 查询记忆文件列表
系统 SHALL 提供 `search_memories` 工具函数供 AI Agent 调用，按域名查询记忆文件列表。工具参数包括：域名（可选，默认当前标签页 hostname）、路径前缀 `pathPrefix`（可选，用于过滤特定子目录）。返回该域名下所有记忆文件名列表和简要信息。

#### 场景：AI 查询当前域名的记忆文件
- **当** AI Agent 调用 `search_memories` 工具，无参数或参数 `{domain: <当前hostname>}`
- **则** 系统查询 IndexedDB 中该域名目录下的所有记忆文件
- **且** 返回文件路径列表，格式为 `[{path: "github.com/修复websocket断线重连问题.md", content_preview: "前200字"}]`

#### 场景：AI 通过路径前缀查询 OpenSpec 变更
- **当** AI Agent 调用 `search_memories` 工具，参数为 `{domain: "github.com", pathPrefix: "openspec/changes/"}`
- **则** 系统返回该域名下 `openspec/changes/` 路径中的所有文件和目录（排除 `archive/` 子目录）
- **且** 每条结果包含 `path` 和 `type`（"file" 或 "directory"）

#### 场景：AI 查询指定域名的记忆文件
- **当** AI Agent 调用 `search_memories` 工具，参数为 `{domain: "stackoverflow.com"}`
- **则** 系统返回该域名下的记忆文件列表

#### 场景：无记忆文件时返回空列表
- **当** 该域名下无任何记忆文件
- **则** 返回空数组 `[]`

### 需求：AI 工具 - get_memory_file 读取记忆内容
系统 SHALL 提供 `get_memory_file` 工具函数供 AI Agent 调用，读取指定记忆文件的完整内容。工具参数包括：文件路径（必填，如 `github.com/修复websocket断线重连问题.md`）。

#### 场景：AI 读取具体记忆文件
- **当** AI Agent 调用 `get_memory_file` 工具，参数为 `{path: "github.com/修复websocket断线重连问题.md"}`
- **则** 系统从 IndexedDB 读取该文件的完整内容并返回

#### 场景：AI 读取 OpenSpec artifact 文件
- **当** AI Agent 调用 `get_memory_file` 工具，参数为 `{path: "github.com/openspec/changes/add-user-auth/proposal.md"}`
- **则** 系统从 IndexedDB 读取该 artifact 文件的完整内容并返回

#### 场景：文件不存在时返回错误
- **当** 请求的记忆文件路径不存在
- **则** 系统返回错误提示 "记忆文件未找到: {path}"

### 需求：大模型通过文件名判断记忆相关性
记忆文件以会话标题命名，文件名自带语义。大模型 SHALL 根据文件名自行判断该记忆是否与当前问题相关，决定是否调用 `get_memory_file` 读取完整内容。

#### 场景：大模型判断文件名相关后读取
- **当** 用户问"怎么处理websocket断线"，且 `search_memories` 返回的文件列表中包含 `修复websocket断线重连问题.md`
- **则** 大模型应自行判断该文件名与当前问题高度相关
- **且** 调用 `get_memory_file` 获取该记忆的完整内容供参考

#### 场景：大模型判断文件名不相关时跳过
- **当** `search_memories` 返回的文件名均与当前问题无关
- **则** 大模型不调用 `get_memory_file`，直接基于当前知识回答

### 需求：工具定义注册
系统 SHALL 在 AI Agent 初始化时将 `search_memories`、`get_memory_file` 两个工具注册到 tools 定义数组中，与现有 `search_project_code`、`get_project_file` 等工具并列。工具的 description MUST 使用中文描述，引导大模型在涉及当前域名的问题时优先查询记忆。

#### 场景：记忆工具在 agent loop 中可用
- **当** AI Agent 开始推理循环
- **则** 上述两个记忆工具在 tools 数组中可用，大模型可根据需要调用
- **且** 工具描述中包含 "当用户问题与当前网站相关时，先查询记忆文件获取历史经验" 的引导语

### 需求：search_memories 支持路径前缀参数
`search_memories` 工具的参数接口 SHALL 扩展 `pathPrefix` 可选参数（字符串），用于按路径前缀过滤记忆文件列表。当指定 `pathPrefix` 时，仅返回路径以该前缀开头的记忆文件和目录。

#### 场景：路径前缀过滤生效
- **当** AI Agent 调用 `search_memories({domain: "github.com", pathPrefix: "openspec/changes/add-user-auth"})`
- **则** 仅返回路径以 `github.com/openspec/changes/add-user-auth` 开头的记忆文件
- **且** 不返回其他路径下的记忆文件

#### 场景：无匹配前缀时返回空列表
- **当** 指定的 `pathPrefix` 下无任何匹配文件
- **则** 返回空数组 `[]`
