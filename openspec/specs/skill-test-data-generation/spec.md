## Requirements

### Requirement: 测试数据生成 Skill 定义
系统 SHALL 提供一个名为 `test-data-generation` 的内置 Skill，其 prompt 规则采用规则驱动模型：指导 AI 作为正向测试数据生成器，根据接口定义（Schema）和业务规则清单生成严格合规的测试数据，使用系统基础工具（`display_table`、`ask_user`、`execute_request`）完成数据展示、用户确认和批量执行。

#### Scenario: Skill 提供完整的工具集
- **WHEN** `test-data-generation` Skill 被查询其工具列表
- **THEN** 返回的工具数组包含 `execute_request`、`get_captured_requests`、`get_captured_request_detail`、`get_page_context`、`extract_auth_token`、`display_table`、`ask_user`

#### Scenario: Skill 提供 prompt 规则
- **WHEN** `test-data-generation` Skill 被查询其 prompt
- **THEN** 返回的 prompt 字符串包含：角色定义（规则驱动的正向测试数据生成器）、核心原则（正向优先/规则即代码/安全隐私/唯一性处理）、字段生成策略表、工作流程（包含数量询问、依赖关系智能感知、display_table / request_auth / execute_request 工具组合）、智能错误分类决策树（业务前置条件错误用 ask_user 结构化交互）、接口探测策略、多轮对话记忆规则

### Requirement: Skill 核心原则
系统 SHALL 在 Skill prompt 中定义以下核心原则指导 AI 行为。

#### Scenario: 正向优先原则
- **WHEN** 用户未明确要求生成"无效的"或"异常的"数据
- **THEN** AI 生成的数据必须满足每一条约束条件，没有任何例外

#### Scenario: 规则即代码原则
- **WHEN** 用户提供业务规则清单
- **THEN** AI 将每条规则视为强制约束严格执行

#### Scenario: 禁止自动发送原则
- **WHEN** AI 生成测试数据后
- **THEN** AI 不得主动调用 `execute_request` 工具，必须通过 `request_auth` 获得用户授权后由系统触发

### Requirement: 使用系统工具进行用户交互
系统 SHALL 在 Skill prompt 中指导 AI 使用系统基础工具完成用户交互，而非依赖自定义 UI 卡片。

#### Scenario: 数据展示使用 display_table
- **WHEN** AI 生成测试数据后需要向用户展示预览
- **THEN** AI 调用 `display_table` 工具，传入数据数组作为表格内容，系统渲染交互式数据表格

#### Scenario: 用户确认使用 request_auth
- **WHEN** AI 需要用户确认执行写入操作
- **THEN** AI 调用 `request_auth` 工具生成授权确认卡片，展示操作摘要（接口地址、方法、数据条数）和风险提示（`riskLevel` 根据操作类型设定）

#### Scenario: 工具组合工作流程
- **WHEN** AI 完成数据生成并需要用户确认后执行
- **THEN** 流程为：先调用 `display_table` 展示数据预览（用户可查看即将创建的数据） → 表格展示后调用 `request_auth` 请求用户授权 → 用户确认后调用 `execute_request` 逐条执行。display_table 和 request_auth 不可同时调用，必须先展示再授权

### Requirement: 未指定数量时主动询问
当用户创建数据的请求中未包含数量信息时，AI SHALL 使用 `ask_user` 工具主动询问用户所需数据条数。

#### Scenario: 用户未指定数量
- **WHEN** 用户请求如"给我创建一条测试分类数据"但未指定数量
- **THEN** AI 调用 `ask_user` 工具询问"需要创建多少条数据？"，提供预设选项并允许自由输入

### Requirement: 数据依赖关系智能感知与一条龙创建
AI SHALL 在生成数据前分析 Schema 中的外键字段，检测当前实体是否依赖其他实体。若在记忆系统中发现已知的依赖链路，用 `display_table` 向用户展示依赖关系并用 `ask_user` 询问是否一条龙创建。

#### Scenario: 发现已知依赖链路
- **WHEN** AI 检测到外键依赖且 `search_memories` / `get_memory_file` 中发现已知的依赖链路（如学生→班级→学校）
- **THEN** AI 用 `display_table` 展示依赖链路表格，然后用 `ask_user` 询问是否一条龙创建全部依赖数据

#### Scenario: 未知依赖链路直接生成
- **WHEN** AI 检测到外键依赖但记忆和知识中均无该依赖关系信息
- **THEN** AI 按正常流程生成数据；若后续执行出现业务前置条件错误，再按错误处理策略应对

### Requirement: 业务前置条件错误用 ask_user 结构化交互
遇到业务前置条件错误时，AI SHALL 使用 `ask_user` 工具向用户展示结构化的处理选项，而非输出纯文本。

#### Scenario: 关联数据不存在的错误处理
- **WHEN** 数据创建返回"XXX 不存在"等业务前置条件错误
- **THEN** AI 调用 `ask_user` 工具，`question` 包含错误原因分析，`options` 列出"提供前置数据"、"先创建前置数据"、"其他方式"等可点击选项

### Requirement: Skill 描述更新
系统 SHALL 将 Skill 的描述文本更新为反映规则驱动定位。

#### Scenario: 中文描述
- **WHEN** Skill 在中文环境下被查询描述
- **THEN** 返回"规则驱动的正向测试数据生成器。根据接口定义(Schema)和业务规则清单，生成严格合规、安全可控的测试数据"

#### Scenario: 英文描述
- **WHEN** Skill 在英文环境下被查询描述
- **THEN** 返回"Rule-driven positive test data generator. Generates strictly compliant, safe, and controlled test data based on interface definitions (Schema) and business rule checklists"

### Requirement: Skill 独立性
`test-data-generation` Skill SHALL 不依赖任何自定义 UI 渲染代码。其所有交互能力通过系统基础工具（`display_table`、`request_auth`、`execute_request`）实现，Skill 模块（`.md` 文件）内不保留任何自定义 DOM 操作或卡片渲染逻辑。

#### Scenario: Skill 模块无自定义 UI
- **WHEN** 查看 `test-data-generation` Skill 的源文件
- **THEN** Skill 目录仅包含 `skill.cn.md` 和 `skill.en.md` 两个 Markdown 文件，不包含任何 taskCard/combinedTaskCard 解析和渲染代码

### Requirement: 请求数据缺失时自动刷新
当 `test-data-generation` Skill 激活且 `get_captured_requests` 返回的请求列表为空或不含目标接口时，AI SHALL 在 prompt 规则指引下调用 `refresh_page` 工具刷新当前页面，并在页面加载完成后重新调用 `get_captured_requests` 获取请求数据。

#### Scenario: 请求列表为空时自动刷新
- **WHEN** AI 调用 `get_captured_requests` 返回空数组 `[]`，且用户请求执行数据操作
- **THEN** AI 在聊天消息中说明"未捕获到请求数据，正在刷新页面以重新捕获"，然后调用 `refresh_page` 工具。刷新完成后等待 3 秒，再次调用 `get_captured_requests` 获取请求数据

#### Scenario: 请求列表不包含目标接口时自动刷新
- **WHEN** AI 调用 `get_captured_requests` 返回的列表不包含创建数据所需的 API 接口（如仅有 GET 请求，缺少 POST 请求）
- **THEN** AI 说明"捕获的请求列表中未找到创建数据的目标接口，将刷新页面重新捕获"，然后调用 `refresh_page` 并重新获取请求

#### Scenario: 刷新后仍未获取到目标请求
- **WHEN** 刷新页面后再次调用 `get_captured_requests` 仍为空或不含目标接口
- **THEN** AI 提示用户"刷新后仍未捕获到目标请求数据，请在页面中手动触发相应操作（如点击'新增'按钮并填写表单），然后重新请求"，不进入死循环
