## Why

每次 AI 对话结束后，产生的技术决策、问题解决路径和关键上下文信息都会丢失。下次遇到语义相似的任务时，用户需要重新描述背景，AI 也无法利用过去的经验提供更好的回答。需要一个自动化的记忆系统来捕捉、存储和检索这些经验，形成知识沉淀的闭环。

## What Changes

- 在"知识"面板中新增一张**"记忆"卡片**，通过类型字段与普通知识卡片区分；用户可删除，下次对话自动重建
- AI 对话结束后**自动生成记忆总结**，包含任务描述、关键决策、技术细节
- 记忆按**域名**分类存储为 Markdown 文件，存入"记忆"卡片中
- 新对话开始时，**语义匹配**历史记忆并自动注入 AI 上下文
- 记忆卡片支持"文件管理"查看所有生成的记忆文件

## Capabilities

### New Capabilities
- `memory-card`: 在知识面板中创建一张单独的记忆卡片，使用 type="memory" 与普通知识卡片区分，卡片展示记忆文件数量统计
- `memory-generation`: AI 任务完成后自动生成结构化记忆总结，提取关键信息并存入对应域名的记忆文件中
- `memory-matching`: 新对话开始时，根据用户消息语义匹配相关历史记忆，将匹配结果注入 AI 上下文

### Modified Capabilities
- `ai-chat-panel`: 在 AI 对话流程中增加记忆生成触发点（任务完成时）和记忆加载注入点（对话开始时），不影响现有聊天逻辑

## Impact

- `chrome-extension/src/panel/knowledge.js` — 扩展知识卡片模型、渲染逻辑，新增记忆卡片类型
- `chrome-extension/src/panel/chat.js` — 增加记忆生成调用和记忆匹配注入
- `chrome-extension/src/panel/panel.css` — 记忆卡片样式
- `chrome.storage.local` — 新增 `ai_helper_memory_item` 存储记忆卡片元数据
- `IndexedDB` — 复用现有 FileCacheManager 和 TreeCacheManager 存储记忆文件内容
