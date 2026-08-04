## MODIFIED Requirements

### Requirement: 工具分发按 Skill 声明匹配
系统 SHALL 在处理工具调用时，遍历所有激活 Skill 的 `getTools()` 返回值，查找 `function.name` 与调用名称匹配的工具，找到后执行其 `handler`。匹配顺序为由后向前（后激活的 Skill 优先级更高），未匹配时回退到内置工具。对于 `askUser` 和 `requestAuth` 两种交互工具，系统 SHALL 通过 Promise 挂起 Agent Loop 等待用户交互完成后返回结果。

#### Scenario: 后激活 Skill 覆盖同名工具
- **WHEN** 两个激活 Skill 都提供了名为 "execute_request" 的工具
- **THEN** 系统使用后激活的 Skill 提供的 `handler`（后激活优先）

#### Scenario: Skill 提供工具但 handler 执行失败
- **WHEN** Skill 的工具 `handler(args)` 抛出异常
- **THEN** 系统返回 `{error: "tool_error", message: "<exception message>"}` 给 Agent

#### Scenario: 执行 askUser 工具时挂起等待用户选择
- **WHEN** Agent 调用 `askUser` 工具
- **THEN** 系统渲染询问卡片，通过 Promise 挂起 Agent Loop，在用户点击选项后 Promise resolve 并返回用户选择的选项文本

#### Scenario: 执行 requestAuth 工具时挂起等待用户确认
- **WHEN** Agent 调用 `requestAuth` 工具
- **THEN** 系统渲染授权卡片，通过 Promise 挂起 Agent Loop，在用户点击"同意"后 Promise resolve 返回 `{authorized: true}`

#### Scenario: requestAuth 被拒绝时终止会话
- **WHEN** 用户点击授权卡片中的"拒绝"按钮
- **THEN** 系统拒绝 Promise，触发 `abortController.abort()` 终止 Agent Loop
