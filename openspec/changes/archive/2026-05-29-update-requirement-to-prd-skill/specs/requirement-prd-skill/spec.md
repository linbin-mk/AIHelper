## ADDED Requirements

### Requirement: 技能提示词包含完整 PRD 生成工作流
`requirement-to-prd` 技能（目录 `chrome-extension/skills/requirement-to-prd/`）的 Markdown 正文 SHALL 包含一个结构化的 PRD 生成工作流，引导 AI 按以下步骤执行：
1. 若知识库存在，调用 `list_project_files` 了解项目结构
2. 根据用户描述的需求关键词，调用 `search_project_code` 搜索相关模块
3. 按需调用 `get_project_file` 读取关键文件
4. 综合信息生成完整 PRD 文档（不需要采访用户）
5. 调用 `provide_file` 导出 PRD 为 .md 文件
6. 向用户展示 PRD 内容并确认文件已提供

#### Scenario: AI 按顺序执行工作流
- **WHEN** 用户激活 `requirement-to-prd` 技能并输入需求描述
- **THEN** AI 首先检查知识库可用性，然后搜索相关代码，生成 PRD 文档，最后调用 `provide_file` 导出文件

#### Scenario: 知识库为空时的降级
- **WHEN** `list_project_files` 返回空结果
- **THEN** AI 基于用户输入推断项目背景，在 PRD 中注明"基于需求描述推断，建议与研发确认工时"

### Requirement: PRD 文档包含指定章节结构
AI 生成的 PRD 文档 SHALL 包含以下章节（按顺序）：
- 需求背景（当前痛点、问题场景、影响范围）
- 目标与范围（In Scope / Out of Scope）
- 用户故事（2-4条，格式：作为[用户角色]，我希望[功能]，以便[价值]）
- 功能需求（逐条列举具体功能点，含交互逻辑和边界条件）
- 验收标准（Given/When/Then 格式）
- 非功能需求（性能、安全、兼容性等）
- 工时评估（开发任务清单表格 + 按角色汇总表格）

#### Scenario: 生成完整 PRD
- **WHEN** AI 完成信息收集并开始生成 PRD
- **THEN** 生成的文档包含全部 7 个章节，工时评估以 Markdown 表格呈现

#### Scenario: 工时评估包含角色分工
- **WHEN** AI 生成工时评估章节
- **THEN** 表格至少包含「前端开发」「后端开发」「测试」三个角色的工时列，并注明 buffer 系数 1.3x

### Requirement: 使用 provide_file 导出 PRD
AI SHALL 在生成 PRD 后调用内置 `provide_file` 工具导出文档，参数为：`fileName`（.md 后缀）、`content`（完整 Markdown 文本）、`mimeType`（`text/plain` 或 `text/markdown`）。

#### Scenario: 成功导出 PRD 文件
- **WHEN** AI 调用 `provide_file` 并传入 PRD 的 fileName、content、mimeType
- **THEN** 系统在聊天面板中创建一个文件下载卡片，用户可点击下载

#### Scenario: 提示用户文件位置
- **WHEN** `provide_file` 调用成功后
- **THEN** AI 在回复中告知用户 PRD 文件已生成并可下载
