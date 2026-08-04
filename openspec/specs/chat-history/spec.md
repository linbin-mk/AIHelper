# chat-history

## 新增需求

### 需求：消息存储保留视觉结构信息
当保存消息到 `chrome.storage.local` 时，系统应当保留足够的信息以便在恢复时重建视觉结构（思考卡片、工具调用卡片）。无需新增存储字段 — 现有的 `reasoning_content` 和 `tool_calls` 字段已足够。

#### 场景：思考卡片数据保留在存储中
- **当** 助手消息包含 reasoning_content
- **则** 存储的消息应当包含完整的 `reasoning_content` 字符串
- **且** `renderChatMessages` 应当根据 `reasoning_content` 的存在推断出思考卡片的呈现方式

#### 场景：工具调用卡片数据保留在存储中
- **当** 助手消息触发了工具调用
- **则** 存储的消息应当包含完整的 `tool_calls` 数组
- **且** 对应的工具结果消息应当包含 `tool_call_id` 以便关联

### 需求：恢复路径保留存储格式
`loadChatHistory` 应当以与保存时相同的格式返回消息，`renderChatMessages` 应当使用 `reasoning_content` 和 `tool_calls` 字段来重建视觉结构。

#### 场景：往返完整性
- **当** 消息通过 `saveChatHistory` 保存并通过 `loadChatHistory` 加载
- **则** 所有消息字段（`role`、`content`、`reasoning_content`、`tool_calls`、`tool_call_id`）应当被完整保留，无数据丢失
