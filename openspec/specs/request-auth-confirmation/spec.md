## Requirements

### Requirement: 数据写入操作统一用 request_auth 获取用户授权
系统 SHALL 在所有数据写入操作（创建/修改/删除）的确认步骤中，使用 `request_auth` 工具获取用户授权，而非输出 taskCard JSON 文本。

#### Scenario: AI 调用 request_auth 确认创建操作
- **WHEN** AI 准备执行 POST 请求创建数据
- **THEN** AI 调用 `request_auth` 工具，传入 `action`（如"创建记录"）、`detail`（包含接口地址、方法、数据摘要）、`riskLevel`（根据操作类型设为 low/medium/high），系统渲染授权确认卡片

#### Scenario: AI 调用 request_auth 确认修改操作
- **WHEN** AI 准备执行 PUT/PATCH 请求修改数据
- **THEN** AI 调用 `request_auth` 工具，`riskLevel` 设为 `medium`，`detail` 中包含修改前后的关键字段对比

#### Scenario: AI 调用 request_auth 确认删除操作
- **WHEN** AI 准备执行 DELETE 请求删除数据
- **THEN** AI 调用 `request_auth` 工具，`riskLevel` 设为 `high`，`detail` 中明确说明不可逆性

#### Scenario: 用户拒绝授权
- **WHEN** 用户在 `request_auth` 卡片上点击"拒绝"
- **THEN** AI 不执行 `execute_request`，向用户说明已取消

#### Scenario: 基础系统提示词中的确认指令
- **WHEN** AI 接收系统提示词
- **THEN** 提示词中关于数据写入确认的规则指向 `request_auth` 工具，而非 taskCard JSON 格式
