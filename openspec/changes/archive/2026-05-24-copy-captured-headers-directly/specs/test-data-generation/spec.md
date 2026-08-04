## MODIFIED Requirements

### Requirement: AI tool - batch create data
系统 SHALL 提供 `batch_create_data` 工具函数。header 来源：在 `requestBuffer` 中按 method + path 匹配到请求后，全量复制其 header。`fetch()` 在页面 Content Script 中执行，Origin、Referer、Cookie 由浏览器上下文自然提供。

工具参数：`url`（必填）、`method`（必填）、`headers`（已废弃，忽略）、`bodyTemplate`（必填，可用 `{{index}}` 占位符）、`count`（必填，最大 100）、`startIndex`（可选，默认 1）。

#### Scenario: Batch create data with headers from captured request
- **WHEN** `requestBuffer` 中存在匹配的捕获请求
- **THEN** Content Script 中发出的每个 `fetch()` 使用该捕获请求的全部 header
- **AND** Origin、Referer、Cookie 由浏览器自动携带

#### Scenario: Batch with partial failures
- **WHEN** 批量创建过程中部分请求失败
- **THEN** 系统继续执行剩余请求，不因单条失败而中断

#### Scenario: Count exceeds maximum
- **WHEN** `count` 参数超过 100
- **THEN** 系统返回错误提示，不发起任何请求

#### Scenario: Execution cancelled by user
- **WHEN** 批量执行过程中用户点击"取消"按钮
- **THEN** 系统停止后续请求，返回已完成统计

#### Scenario: Concurrency control
- **WHEN** 批量请求超过 5 条
- **THEN** 系统 MUST 控制并发数不超过 5 个
