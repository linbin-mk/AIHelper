## Requirements

### Requirement: 字段名称语义推断生成策略
系统 SHALL 在 Skill prompt 中定义字段名称语义匹配表，AI 根据字段名称（不区分大小写、支持包含匹配）自动推断合适的测试数据生成策略。

#### Scenario: 常见字段名匹配
- **WHEN** AI 需要为 `email` 字段生成测试数据
- **THEN** 生成的值为 `user_` 前缀 + 随机英文数字 + `@example.com`，如 `user_a3b2@example.com`

#### Scenario: 手机号字段匹配
- **WHEN** AI 需要为 `phone`、`mobile`、`tel` 或 `telephone` 字段生成测试数据
- **THEN** 生成随机 11 位数字，如 `13800001234`

#### Scenario: 名称字段匹配
- **WHEN** AI 需要为 `name`、`username`、`nickName`、`author`、`creator` 或 `operator` 字段生成测试数据
- **THEN** 生成随机英文组合首字母大写的值，如 `TestUserAbc`

#### Scenario: 未知字段默认策略
- **WHEN** AI 需要为不在匹配表中的字段生成测试数据
- **THEN** 字符串类型填 `test_value_` 前缀加序号，数字类型填 0 或维持原值

#### Scenario: 多组数据多样性
- **WHEN** AI 需要生成多组数据
- **THEN** 每组数据的同名字段应生成不同的值（随机变化），不得重复

#### Scenario: 业务规则优先于字段名推断
- **WHEN** 某字段同时有业务规则约束和字段名称匹配策略
- **THEN** 业务规则约束优先于字段名称自动推断

### Requirement: 智能错误分类决策树
系统 SHALL 在 Skill prompt 中定义四类接口错误的分类标准和处理策略，AI 在遇到错误时必须先分类再处理。

#### Scenario: 业务前置条件错误识别
- **WHEN** 接口返回错误信息涉及关联数据不存在、状态不满足、权限不足、依赖实体缺失等
- **THEN** AI 判定为业务前置条件错误，停止重试，向用户输出业务约束分析（错误原因、涉及的业务规则、建议操作、用户可选操作列表）

#### Scenario: 业务前置条件错误不自动重试
- **WHEN** AI 判定为业务前置条件错误
- **THEN** AI 不进行任何自动重试（0 次重试上限），必须等待用户明确指示

#### Scenario: 字段校验错误自动修正
- **WHEN** 接口返回字段格式不对、长度不满足、必填字段缺失、枚举值错误等
- **THEN** AI 自动分析错误、修正数据后重试，最多 2 次重试

#### Scenario: 未知错误有限重试
- **WHEN** 接口返回 500 错误或无明确说明的通用错误
- **THEN** AI 最多重试 1 次，若仍失败则向用户汇报

#### Scenario: 连续同类错误降级处理
- **WHEN** AI 连续 2 次尝试都返回同一类错误
- **THEN** AI 转而向用户请求澄清，不再继续重试

#### Scenario: 错误信息业务语言翻译
- **WHEN** AI 向用户解释错误
- **THEN** AI 必须用业务语言翻译错误（如将 `class not found` 翻译为"班级不存在"），而不是直接抛错误原文

### Requirement: 接口发现与探测策略
系统 SHALL 在 Skill prompt 中定义四步接口探测流程，当捕获的请求列表中不包含目标写接口时自动执行。

#### Scenario: URL 模式推断
- **WHEN** 已捕获到查询接口（如 `POST /student/page`）
- **THEN** AI 去除后缀（`/page`、`/query`、`/list`、`/search`）推断写接口路径（如 `POST /student`）

#### Scenario: 查询响应字段提取
- **WHEN** 需要构造新增接口的字段但请求体结构未知
- **THEN** AI 从查询接口的响应体提取字段结构，去除 `id`、`createTime`、`updateTime` 等自动生成字段后作为新增字段候选

#### Scenario: 主动探测与迭代修正
- **WHEN** URL 推断和字段提取后仍未确定接口
- **THEN** AI 展示推断的接口信息并请求用户确认，系统执行后根据服务端返回的校验错误信息迭代修正字段列表和接口路径

#### Scenario: 兜底提示
- **WHEN** 前三步均失败
- **THEN** AI 告知用户需在页面上手动触发操作以捕获请求，并在回复中明确说明已尝试过的路径

#### Scenario: 跨页面 API 路径复用
- **WHEN** 同一域名下其他页面已有成功的 API 路径模式
- **THEN** AI 复用该模式推断当前页面的接口，不假设接口一定有 `/add` 或 `/save` 后缀

### Requirement: 测试数据安全与隐私约束
系统 SHALL 在 Skill prompt 中定义安全约束规则，确保所有生成的测试数据使用安全的测试占位符。

#### Scenario: 邮箱域名安全
- **WHEN** AI 生成包含邮箱字段的测试数据
- **THEN** 邮箱域必须使用 `@example.com` 或 `@test.com`，禁止生成真实邮箱域名

#### Scenario: 手机号安全
- **WHEN** AI 生成包含手机号字段的测试数据
- **THEN** 使用随机 11 位数字

#### Scenario: 姓名安全
- **WHEN** AI 生成包含姓名字段的测试数据
- **THEN** 使用 `TestUser` 前缀加随机后缀

#### Scenario: 全局唯一字段处理
- **WHEN** 规则要求某字段全局唯一
- **THEN** AI 使用"前缀 + 时间戳 + 随机字符串"的组合策略确保唯一性

### Requirement: 业务约束分析输出
系统 SHALL 在 AI 遇到业务前置条件错误时，要求 AI 输出结构化的业务约束分析文本，而非 JSON 数据。

#### Scenario: 业务约束分析格式
- **WHEN** AI 判定为业务前置条件错误需暂停
- **THEN** AI 输出包含错误原因、涉及的业务规则、建议操作的分析文本，末尾列出用户可选操作选项

### Requirement: 字段校验修正展示
系统 SHALL 要求 AI 在校验错误自动修正后，通过 `display_table` 展示修正后的数据并说明修正内容。

#### Scenario: 修正后展示
- **WHEN** AI 自动修正字段校验错误后重新生成数据
- **THEN** AI 调用 `display_table` 展示修正后的数据，并在说明中标注修正内容和上次错误原因

### Requirement: 多轮对话记忆
系统 SHALL 支持 Skill 在多轮对话中根据上下文记忆调整行为。

#### Scenario: 修改指定字段
- **WHEN** 用户要求"修改某字段的值"
- **THEN** AI 保留上次其他字段的值，只修改指定字段后重新输出

#### Scenario: 追加生成
- **WHEN** 用户要求"再生成一组"或追加数量
- **THEN** AI 基于相同模板重新生成新的测试数据

#### Scenario: 新增字段确认
- **WHEN** 用户要求新增字段
- **THEN** AI 先询问确认再生成
