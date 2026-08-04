## Why

当前插件仅能被动展示捕获到的网络请求和 Cookie 信息，用户无法对捕获的数据进行交互式分析和提问。引入 AI 聊天能力可以让用户直接用自然语言与 AI 对话，例如询问"当前页面有哪些 API 请求报错了？"或"这些请求的响应时间如何？"，大幅提升开发者调试效率。Kilo Code 提供了开源且可集成的 Agent 框架，适合嵌入到插件中。

## What Changes

- 在 Side Panel 中新增 AI 聊天面板（Tab 切换），用户可在"请求监控"和"AI 聊天"之间切换
- 集成 Kilo Code 开源 Agent SDK，实现会话式聊天功能
- 支持流式输出（SSE/Streaming），AI 回复逐字展示，提升用户体感响应速度
- 提供模型配置界面，支持配置 API 地址、API Key、模型名称、模型类型等参数
- 将当前捕获的请求数据作为上下文传递给 AI，支持基于请求数据的问答
- 聊天记录持久化到 chrome.storage.local，刷新后保留历史
- 支持多轮对话，上下文自动管理

## Capabilities

### New Capabilities
- `ai-chat-panel`: 在 Side Panel 中新增 AI 聊天面板，提供会话式聊天 UI，支持发送消息、显示 AI 回复、查看聊天历史
- `model-config`: 提供模型配置界面，用户可以配置大模型 API 地址、API Key、模型名称、模型类型（如 OpenAI、DeepSeek 等），配置持久化存储
- `request-context`: 将当前捕获的 HTTP 请求数据作为上下文注入到 AI 对话中，使 AI 能够回答关于捕获请求的问题
- `chat-history`: 聊天记录持久化存储，支持查看历史、清空历史

### Modified Capabilities
（无现有 spec，无需修改）

## Impact

- **manifest.json**: 可能需要新增 `storage` 相关权限（已有）
- **panel.html / panel.js / panel.css**: 重构为 Tab 布局，新增聊天面板模块
- **background.js**: 新增消息路由，面板可向 background 请求当前捕获的请求数据作为 AI 上下文
- **新增文件**: `src/panel/chat.js`（聊天逻辑）、`src/panel/config.js`（模型配置）、对应的 CSS 样式
- **外部依赖**: 引入 Kilo Code Agent SDK（需评估是否通过 CDN 加载或打包为本地文件）
- **安全风险**: API Key 存储在 chrome.storage.local 中，需注意加密存储
