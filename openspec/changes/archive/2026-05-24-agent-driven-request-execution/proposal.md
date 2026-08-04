## Why

当前批量执行请求的方式是用户手动点击"执行"按钮后硬编码请求头直接发起，缺乏智能调整能力，遇到失败无法自动重试。将执行决策权交给 AI Agent，利用 Agent 的推理能力动态决定请求头和参数，实现智能重试，提升请求成功率和用户体验。

## What Changes

- **BREAKING**: 任务卡片按钮文案从"执行"改为"允许执行"，点击后不再直接发送 `BATCH_EXECUTE` 消息
- **BREAKING**: 移除旧的 `BATCH_EXECUTE` 批量执行流程（background.js 中的 `executeBatch()`、`BATCH_EXECUTE` 消息处理、`BATCH_PROGRESS`/`BATCH_COMPLETE` 消息处理）
- **BREAKING**: 移除 `batch-executor.js` 文件和 `batch_create_data` 工具
- **两步强约束**: 所有数据写入操作（创建/修改/删除，含单条或批量）必须先出 taskCard 等待用户审查确认，只有用户点击"允许执行"后 Agent 才能调用 `execute_request` 发送请求
- 新增 AI Agent 工具 `execute_request`：Agent 可调用此工具发起 HTTP 请求（页面注入，携带 Cookie 和认证状态）
- 新增 AI Agent 工具 `get_captured_request_detail`：Agent 可查询指定已捕获请求的完整信息（URL、方法、请求头、请求体）
- Agent 接收到"允许执行"指令后，自动进入执行循环：查询页面捕获的请求信息 → 智能决定请求头 → 调用 `execute_request` 发请求 → 分析响应 → 失败则智能调整 → 重试（最多 10 次）→ 输出结果报告

## Capabilities

### New Capabilities

- `agent-request-execution`: Agent 驱动的请求执行能力，包括请求头智能决策、自动重试、结果报告生成
- `agent-execute-tool`: Agent 可调用的 HTTP 请求执行工具，替代原有的批量执行器直接注入模式

### Modified Capabilities

- `request-capture`: Agent 需要查询已捕获请求的完整详情（包括请求头和请求体），不仅仅是摘要信息

### Removed Capabilities

- `batch-execute`: 旧的批量执行能力（`BATCH_EXECUTE` 消息、`batch-executor.js`、`batch_create_data` 工具）被 Agent 驱动的 `execute_request` 工具完全替代

## Impact

- **chat.js**: 新增工具定义（`execute_request`、`get_captured_request_detail`）、修改 `handleTaskExecute` 逻辑、修改 `renderTaskCard` 按钮文案、移除 `batch_create_data` 工具定义和实现
- **background.js**: 新增 `EXECUTE_REQUEST` 和 `QUERY_REQUEST_DETAIL` 消息处理，移除 `BATCH_EXECUTE`、`BATCH_CANCEL`、`BATCH_PROGRESS`、`BATCH_COMPLETE` 消息处理和 `executeBatch()` 函数
- **batch-executor.js**: 删除文件
- **manifest.json**: 移除 batch-executor.js 的 web_accessible_resources 声明
- **panel.css**: 可能需要调整按钮样式（文案变更）
