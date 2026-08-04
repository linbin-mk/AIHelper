## ADDED Requirements

### Requirement: refresh_page 工具在 chat.js 中实现
系统 SHALL 在 `TOOLS` 数组中注册 `refresh_page` 工具并通过 `REFRESH_PAGE` 消息路由执行页面刷新。工具直接在 `chat.js` 的 `executeToolCall()` 中实现，不依赖技能系统的 `getTools()`。

#### Scenario: 工具注册
- **WHEN** AI 获取工具列表
- **THEN** 工具列表包含 `refresh_page`，无必填参数

#### Scenario: 刷新成功
- **WHEN** AI 调用 `refresh_page` 且当前有活动标签页
- **THEN** 系统通过 `chrome.runtime.sendMessage({ type: 'REFRESH_PAGE' })` 刷新页面，返回 `{ success: true, url: "<新URL>" }`

#### Scenario: 无活动标签页
- **WHEN** AI 调用 `refresh_page` 但无活动标签页
- **THEN** 返回错误 `{ error: "no_active_tab", message: "未找到活动标签页" }`

### Requirement: executeToolCall 中的 refresh_page 分发
`refresh_page` 工具 SHALL 在 `executeToolCall()` 中通过 `if (name === 'refresh_page')` 分支处理，通过 `sendMessage` 发送 `REFRESH_PAGE` 到 background.js。

#### Scenario: 工具调用路由
- **WHEN** AI 调用 `refresh_page`
- **THEN** `executeToolCall` 匹配到对应分支，发送消息并返回 Promise
