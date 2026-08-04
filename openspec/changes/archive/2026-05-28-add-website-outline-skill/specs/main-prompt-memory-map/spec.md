## ADDED Requirements

### Requirement: 功能地图发现提示
系统 SHALL 在 `buildMemoryHint()` 中检测当前域名下是否存在功能地图文件（`{hostname}/功能地图.md`），若存在则在系统 prompt 中注入优先查询提示。

#### Scenario: 当前域名有功能地图时的提示
- **WHEN** 用户当前访问 `admin.example.com` 且记忆系统中存在 `admin.example.com/功能地图.md`
- **THEN** `buildMemoryHint()` 返回的提示文本包含："当前域名下有功能地图文件，包含系统的功能导航信息。当用户询问功能位置时，优先调用 search_memories 查找功能地图。"

#### Scenario: 无功能地图时的默认行为
- **WHEN** 当前域名下无功能地图文件
- **THEN** `buildMemoryHint()` 仅返回普通记忆提示，不包含功能地图相关引导

### Requirement: 功能地图查询引导
当 `buildMemoryHint()` 发现功能地图文件后，SHALL 建议 AI 在回答用户"某功能在哪"类型的问题时，先调用 `search_memories` 查找 `功能地图` 文件并读取完整内容，从中定位功能位置。

#### Scenario: AI 查询功能地图回答问题
- **WHEN** 用户问"用户管理功能在哪里"且系统 prompt 中包含功能地图发现提示
- **THEN** AI 调用 `search_memories({domain: "admin.example.com"})` 查找记忆列表
- **AND** 找到 `功能地图.md` 文件后调用 `get_memory_file({filePath: "admin.example.com/功能地图.md"})` 读取完整内容
- **AND** 从地图中查找"用户管理"的定位路径和选择器，直接回答用户

#### Scenario: 功能地图中未找到目标功能
- **WHEN** AI 读取功能地图后未找到用户询问的功能
- **THEN** AI 如实告知用户"功能地图中未记录此功能"，并建议用户手动查找或重新运行 `/website-outline` 更新地图

### Requirement: 主提示词中功能地图优先规则
系统 SHALL 在系统 prompt 构建逻辑中增加一条规则（在 `buildMemoryHint()` 之后）：当功能地图文件存在时，AI 在回答与"功能位置"、"功能入口"、"页面导航"相关的问题时，必须在回答前先从功能地图中查找。

#### Scenario: 功能位置问题自动查地图
- **WHEN** 系统 prompt 中包含功能地图优先规则
- **THEN** AI 在回答任何"在哪里"、"怎么找到"、"有没有"类型的功能相关问题时，先搜索并读取功能地图
- **AND** 在回答中明确引用地图中的功能路径和选择器
