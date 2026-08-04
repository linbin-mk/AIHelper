## Context

AI Helper 是一个 Chrome 扩展的侧边栏面板。当前聊天记录保存在 `chrome.storage.local` 中，数据结构为消息数组 `{ role, content, reasoning_content, tool_calls, ... }[]`。侧边栏面板运行在独立的沙盒页面中，可以通过 Blob + `<a>` 标签触发浏览器下载。

## Goals / Non-Goals

**Goals:**
- 在聊天工具栏添加「导出日志」按钮，位于清空按钮左侧
- 点击按钮时，将当前聊天消息完整导出为 JSON 文件
- 导出文件包含元数据（导出时间、消息数量、模型配置摘要），便于离线分析 LLM 行为
- 使用 Blob 下载方式，无需新增扩展权限

**Non-Goals:**
- 不支持导出为 CSV 或其他格式（仅 JSON）
- 不支持选择性导出（导出全部消息）
- 不包含 UI 渲染的 HTML 内容（仅结构化数据）

## Decisions

### 1. 下载方式：Blob + anchor 点击
- **选择**: 创建 JSON Blob，通过 `URL.createObjectURL` + 隐藏 `<a>` 点击触发下载
- **替代方案**: `chrome.downloads` API — 需要声明 `downloads` 权限，增加权限复杂度且对用户体验无显著提升
- **理由**: Blob 方式无需额外权限，在侧边栏页面中天然可用，与普通网页下载行为一致

### 2. 逻辑位置：在 chat.js 中实现
- **选择**: 将导出逻辑放在 `chat.js`，因为该文件已持有聊天消息引用和清空按钮事件处理
- **理由**: 导出和清空是工具栏中相邻的功能按钮，逻辑内聚性高；chat.js 可直接访问 `window.chatMessages`

### 3. 导出数据结构
- **选择**: 导出 JSON 对象包含两个顶层字段：
  - `meta`: `{ exportedAt: ISO时间戳, messageCount: 数量, modelConfig: { provider, model, temperature, maxTokens } }`
  - `messages`: 完整的 `window.chatMessages` 数组
- **理由**: 分离元数据和消息数据，便于工具解析；元数据提供分析上下文

### 4. 文件名格式：`ai-helper-chat-YYYYMMDD-HHmmss.json`
- **选择**: 使用本地时间戳，前缀 `ai-helper-chat-` 标识来源
- **理由**: 文件名直观可排序，便于在下载目录中批量管理

## Risks / Trade-offs

- **[风险] 大量消息时 JSON 文件体积较大** → 当前聊天历史有上限 (`CHAT_HISTORY_MAX`)，单文件大小可控
- **[风险] 侧边栏关闭后 Blob URL 失效** → 下载操作在点击时立即触发，无持久化需求
