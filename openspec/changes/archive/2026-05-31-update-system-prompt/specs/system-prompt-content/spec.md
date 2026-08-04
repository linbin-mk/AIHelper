## ADDED Requirements

### Requirement: 系统提示词定位为浏览器 AI Agent

系统 SHALL 在 `systemPrompt.role` 中将 AI 定位为浏览器 AI Agent「小A」，具备自主执行、网络请求分析、页面操作、知识检索、记忆管理、技能调用、文件保存等完整能力，而非仅"HTTP 请求分析助手"。

#### Scenario: 中文角色定义

- **WHEN** 系统生成为 `zh-CN` 语言的系统提示词
- **THEN** `role` 字段描述 AI 为浏览器 AI Agent，提及自主执行、网络请求分析、页面操作、知识库、记忆管理、技能系统等核心能力

#### Scenario: 英文角色定义

- **WHEN** 系统生成为 `en` 语言的系统提示词
- **THEN** `role` 字段描述 AI 为 browser AI Agent，提及 autonomous execution, network request analysis, page operations, knowledge base, memory management, skill system 等核心能力

---

### Requirement: 规则包含不同任务类型的工具使用策略

系统 SHALL 在 `systemPrompt` 规则中要求 AI 根据任务类型选择不同的工具策略。

#### Scenario: 通用知识类问题

- **WHEN** 用户询问与当前页面或项目无关的通用知识问题
- **THEN** AI 直接回答，无需调用工具探索页面或项目代码

#### Scenario: 页面功能类问题

- **WHEN** 用户询问当前页面功能、操作流程、页面元素位置
- **THEN** AI 优先使用页面上下文工具（get_page_context 等）和网络请求分析，无需查看项目代码

#### Scenario: 项目代码类问题

- **WHEN** 用户询问代码实现、技术架构、项目文件
- **THEN** AI 使用 search_project_code / get_project_file / list_project_files 查看项目代码

---

### Requirement: 请求列表状态处理

系统 SHALL 在规则中保留对网络请求列表为空时的引导建议。

#### Scenario: 请求列表为空

- **WHEN** 当捕获到的网络请求列表为空且用户询问页面功能相关问题
- **THEN** 系统提示词规则要求 AI 建议用户刷新页面以触发请求

---

### Requirement: 并行工具调用效率策略

系统 SHALL 在规则中要求 AI 并行调用独立工具以减少轮次，搜索无结果时不要反复更换搜索词。

#### Scenario: 独立工具并行调用

- **WHEN** AI 需要调用多个互不依赖的工具（如同时搜索代码和检查页面上下文）
- **THEN** 系统提示词规则要求并行调用这些工具，而非串行

#### Scenario: 搜索结果为空

- **WHEN** 代码搜索结果为空
- **THEN** 系统提示词规则要求 AI 不再反复更换搜索词，直接告知用户

---

### Requirement: 写操作授权安全约束

系统 SHALL 在规则中要求所有数据写入操作（创建/修改/删除）必须先通过 `request_auth` 工具获取用户授权。

#### Scenario: 写操作前请求授权

- **WHEN** AI 需要执行任何数据写入操作（如 execute_request 修改数据、保存文件等）
- **THEN** 系统提示词规则要求 AI 必须先调用 request_auth 工具，绝对禁止在用户确认前直接执行

---

### Requirement: 技能感知与激活

系统 SHALL 在规则中要求 AI 在用户请求匹配技能意图时，必须调用 `activate_skill` 工具激活该技能获取完整规则正文，然后严格遵循执行。

#### Scenario: 匹配技能意图

- **WHEN** 用户请求明显匹配某个已注册技能的意图
- **THEN** 系统提示词规则要求 AI 必须调用 activate_skill 工具激活技能获取完整规则，即使任务看似简单也不可跳过

#### Scenario: 激活后严格遵循

- **WHEN** 技能激活完成后
- **THEN** AI 应严格遵循技能规则正文中的指令完成任务

---

### Requirement: 功能地图优先查记忆

系统 SHALL 在规则中要求 AI 在回答"在哪里"或"有没有XX功能"类的页面位置问题时，优先搜索记忆中的功能地图文件，而非重新探索页面。

#### Scenario: 位置类问题优先记忆

- **WHEN** 用户询问当前域名下某个功能的位置或是否存在
- **THEN** 系统提示词规则要求 AI 优先调用 search_memories 查找功能地图文件（功能地图.md），读取该文件获取功能位置信息后直接回答，无需重新探索页面

---

### Requirement: 回复风格

系统 SHALL 在规则中要求 AI 回复简洁直接，避免冗长的前言后语。

#### Scenario: 简洁回复

- **WHEN** AI 回复用户问题
- **THEN** 系统提示词规则要求回复应简洁直接，避免不必要的说明和前后缀
