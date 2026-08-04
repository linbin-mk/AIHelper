## ADDED Requirements

### Requirement: 测试数据生成 Skill 定义
系统 SHALL 提供一个名为 `test-data-generation` 的内置 Skill，包含测试数据批量生成所需的 prompt 规则、工具集合和 taskCard UI 委托。

#### Scenario: Skill 提供完整的工具集
- **WHEN** `test-data-generation` Skill 被查询其工具列表
- **THEN** 返回的工具数组包含 `execute_request`、`get_captured_requests`、`get_captured_request_detail`、`get_page_context`、`extract_auth_token`

#### Scenario: Skill 提供 prompt 规则
- **WHEN** `test-data-generation` Skill 被查询其 prompt
- **THEN** 返回的 prompt 字符串包含：两步约束规则（先分析后执行）、taskCard JSON 格式规范、10 步执行流程指令

### Requirement: taskCard 格式生成
当用户请求创建测试数据时，AI SHALL 生成包含 `taskCard` 字段的 JSON 对象，格式为：`{taskCard: {title, url, method, headers, bodyTemplate, count, templatePreview}}`。其中 `templatePreview` 包含 `columns` 和 `rows` 的表格预览。

#### Scenario: AI 生成 taskCard
- **WHEN** 用户说"帮我创建 10 个用户"且 `test-data-generation` Skill 激活
- **THEN** AI 在回答中生成包含 `taskCard` 字段的 JSON 代码块，其中 `count: 10`，`templatePreview.rows` 包含前 2 行示例数据

#### Scenario: taskCard 包含模板预览
- **WHEN** AI 生成 taskCard
- **THEN** `templatePreview` 包含 `columns` 数组（字段名列表）和 `rows` 数组（前 2 行示例数据值的矩阵）

### Requirement: taskCard UI 渲染
系统 SHALL 将 AI 返回的 taskCard JSON 解析并渲染为交互式任务卡片组件，显示标题、数据模板预览表格、元信息（数量、HTTP 方法、URL）、"允许执行"和"取消"两个操作按钮。

#### Scenario: 渲染任务卡片
- **WHEN** `test-data-generation` 的 `onMessageParsed` 检测到消息中包含有效 taskCard JSON
- **THEN** 系统在消息气泡中渲染任务卡片，包含标题、模板预览表格、元信息和操作按钮

#### Scenario: taskCard 初始状态为待确认
- **WHEN** 任务卡片首次渲染
- **THEN** 卡片状态为 `pending`，"允许执行"按钮可见

### Requirement: 任务执行流程
用户点击"允许执行"后，系统 SHALL 构造合成用户消息注入 Agent Loop，消息包含详细执行指令（获取请求列表→查询详情→按模板逐条执行→重试失败→输出报告）。Agent 在执行过程中 MUST 调用 `execute_request` 逐条发送请求。

#### Scenario: 用户确认执行
- **WHEN** 用户点击任务卡片的"允许执行"按钮
- **THEN** 卡片状态变为 `running`，显示实时进度，系统启动新的 Agent Loop 执行数据创建

#### Scenario: 执行进度展示
- **WHEN** Agent 正在执行数据创建（如 3/10 已完成）
- **THEN** 任务卡片显示进度文本 "正在创建... (3/10)"

#### Scenario: 执行完成
- **WHEN** 全部请求执行完毕
- **THEN** 任务卡片状态变为 `done`，显示结果摘要（成功 N 条，失败 M 条）

### Requirement: Skill 独立性
`test-data-generation` Skill SHALL 不依赖 `chat.js` 中的硬编码 taskCard 逻辑。其所有 prompt 规则、工具处理函数和 UI 渲染代码 MUST 在 Skill 模块内部自包含。

#### Scenario: Skill 模块自包含
- **WHEN** 查看 `test-data-generation` Skill 的源代码文件
- **THEN** 所有 taskCard 解析、渲染、执行相关代码位于 `skills/test-data-generation/` 目录下，不引用 `chat.js` 的私有函数
