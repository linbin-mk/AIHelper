## MODIFIED Requirements

### Requirement: Project summary in system message
系统 SHALL 在 AI 聊天的系统消息中注入已管理项目的摘要信息，包括：项目名称、仓库地址、文件总数、项目描述（如有）、主要技术栈（根据文件扩展名推断）、关键目录列表（最多3层深度）。

#### Scenario: Inject project summaries into AI context
- **WHEN** 用户发起 AI 聊天且至少有一个已同步的项目
- **THEN** 系统在 buildMessages() 构建的系统消息中包含项目摘要列表，每个项目格式为 `项目名(N文件) - 用户描述内容`

#### Scenario: Inject project context without description
- **WHEN** 项目未填写描述
- **THEN** 系统消息中的项目摘要不包含描述内容，仅显示 `项目名(N文件)`

#### Scenario: No projects configured
- **WHEN** 用户未配置任何项目或所有项目均未同步
- **THEN** 系统消息中不包含项目代码相关上下文
