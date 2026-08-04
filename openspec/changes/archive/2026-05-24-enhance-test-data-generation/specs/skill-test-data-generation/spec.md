## ADDED Requirements

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

### Requirement: 多表组合任务卡片定义
系统 SHALL 支持 `combinedTaskCard` JSON 格式，用于表达包含多个有序步骤的测试数据创建任务。每个步骤（`step`）是一个独立的 API 操作，步骤之间可通过 `dependsOn` 字段表达先后依赖关系。

#### Scenario: AI 生成 combinedTaskCard
- **WHEN** 用户说"帮我创建开销记录"且系统分析发现需要先创建开销分类
- **THEN** AI 生成 `combinedTaskCard` JSON，包含 2 个步骤：`[0] 创建开销分类` → `[1] 创建开销记录`（`dependsOn: 0`）。`title` 字段描述整体任务，`description` 字段说明步骤关系

#### Scenario: combinedTaskCard 格式规范
- **WHEN** AI 生成 `combinedTaskCard`
- **THEN** JSON 结构包含：`title`（任务标题）、`description`（任务说明）、`steps` 数组。每个 step 包含 `name`、`url`、`method`、`headers`、`bodyTemplate`、`count`、`templatePreview`。有依赖的步骤包含 `dependsOn` 字段（整数，表示依赖的步骤索引）

### Requirement: 组合任务卡片 UI 渲染
系统 SHALL 将 `combinedTaskCard` JSON 解析并渲染为多步骤任务卡片组件，以编号步骤列表展示步骤顺序，用视觉标记（如箭头、缩进、`依赖步骤N` 标注）表示依赖关系。

#### Scenario: 渲染组合任务卡片
- **WHEN** `test-data-generation` 的 `onMessageParsed` 检测到消息中包含有效 `combinedTaskCard` JSON
- **THEN** 系统渲染带编号的步骤列表，每个步骤显示名称、HTTP 方法、URL 和模板预览。有依赖标记的步骤额外显示"依赖步骤 N"提示

#### Scenario: 组合卡片初始状态
- **WHEN** 组合任务卡片首次渲染
- **THEN** 卡片状态为 `pending`，显示"允许执行"和"取消"按钮。所有步骤显示为待执行状态

### Requirement: 组合任务执行流程
用户点击"允许执行"后，系统 SHALL 按步骤索引顺序逐步执行。执行某步骤前检查其 `dependsOn` 指向的前置步骤是否全部成功，若前置步骤失败则该步骤跳过。执行过程中实时高亮当前步骤并更新状态。

#### Scenario: 按顺序逐步执行
- **WHEN** 用户点击组合任务卡片的"允许执行"按钮
- **THEN** 系统依次执行 step 0 → step 1 → ...。执行 step N 时，UI 高亮该步骤为 `running`，其他步骤为 `pending`。步骤执行完成后标记为 `done` 或 `failed`

#### Scenario: 前置步骤失败时跳过
- **WHEN** step 0 所有请求失败，且 step 1 的 `dependsOn` 为 0
- **THEN** step 1 被标记为 `skipped`（跳过），卡片结果摘要显示该步骤因前置步骤失败而跳过

#### Scenario: 组合任务执行完成
- **WHEN** 所有步骤执行完毕（含失败和跳过的步骤）
- **THEN** 卡片状态更新为 `done`，显示每个步骤的执行结果摘要（成功数/失败数/跳过）
