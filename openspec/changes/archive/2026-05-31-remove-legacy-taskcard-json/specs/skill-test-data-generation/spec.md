## MODIFIED Requirements

### Requirement: 禁止自动发送原则
- **WHEN** AI 生成测试数据后
- **THEN** AI 不得主动调用 `execute_request` 工具，必须通过 `request_auth` 工具获得用户授权后由系统触发

### Requirement: 用户确认使用 request_auth
- **WHEN** AI 需要用户确认执行写入操作
- **THEN** AI 调用 `request_auth` 工具生成授权确认卡片，展示操作摘要（接口地址、方法、数据条数）和风险提示（`riskLevel` 根据操作类型设定），系统渲染授权卡片

#### Scenario: 工具组合工作流程
- **WHEN** AI 完成数据生成并需要用户确认后执行
- **THEN** 流程为：先调用 `display_table` 展示数据预览 → 再调用 `request_auth` 请求用户授权 → 用户确认后调用 `execute_request` 逐条执行

### Requirement: Skill 独立性
`test-data-generation` Skill SHALL 不依赖任何自定义 UI 渲染代码。其所有交互能力通过系统基础工具（`display_table`、`request_auth`、`execute_request`）实现，Skill 模块（`.md` 文件）内不保留任何自定义 DOM 操作或卡片渲染逻辑。
