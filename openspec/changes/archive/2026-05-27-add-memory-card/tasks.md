## 1. 创建 memory.js 核心模块

- [x] 1.1 创建 `chrome-extension/src/panel/memory.js` 文件，实现记忆管理核心功能
- [x] 1.2 实现 `initMemoryCard()` — 检查 `ai_helper_memory_item`，不存在则创建默认记忆卡片并存入 `chrome.storage.local`
- [x] 1.3 实现 `getMemoryItem()` — 从 `ai_helper_memory_item` 读取记忆卡片元数据
- [x] 1.4 实现 `getCurrentHostname()` — 从当前标签页 URL 提取 hostname（无标签页时返回 "general"）
- [x] 1.5 实现 `generateMemory(sessionMessages, hostname, sessionTitle)` — 异步调用 AI 总结对话内容，生成结构化记忆文件
- [x] 1.6 实现 `buildMemoryFileContent(messages, hostname, sessionTitle)` — 构建记忆总结 prompt，调用 AI 接口获取结构化总结
- [x] 1.7 实现 `saveMemoryFile(hostname, sessionTitle, content)` — 以会话标题为文件名写入 IndexedDB（复用 FileCacheManager.addFiles），更新文件树
- [x] 1.8 实现 `searchMemories(domain)` — 查询指定域名下的所有记忆文件列表，返回文件路径和内容预览（前200字）
- [x] 1.9 实现 `getMemoryFile(path)` — 读取指定路径记忆文件的完整内容
- [x] 1.10 实现 `deleteMemoryCard()` — 删除 `ai_helper_memory_item`，清空 IndexedDB 中该 knowledgeId 的所有记忆文件和文件树
- [x] 1.11 在 `panel.html` 中引入 `memory.js`（在 knowledge.js 之后、chat.js 之前加载）

## 2. 扩展 knowledge.js 支持记忆卡片

- [x] 2.1 修改 `addKnowledgeItem` / `saveKnowledgeItems` — 当 item.type === "memory" 时存入 `ai_helper_memory_item` 而非 `ai_helper_knowledge_items`
- [x] 2.2 修改 `loadKnowledgeItems` — 读取 `ai_helper_memory_item` 并将其插入列表第一位（如存在）
- [x] 2.3 修改 `createKnowledgeCard` — 根据 `item.type === "memory"` 使用不同样式类名 (`knowledge-card--memory`)
- [x] 2.4 记忆卡片显示删除按钮，删除时二次确认并清空所有记忆文件
- [x] 2.5 记忆卡片名称固定为"记忆"，显示 🧠 图标
- [x] 2.6 修改 `renderKnowledgeList` — 从 `ai_helper_memory_item` 读取记忆卡片数据并插入列表第一位（如存在）
- [x] 2.7 修改 `openFileManager` — 记忆卡片打开文件管理时展示域名分组的文件树

## 3. 记忆卡片样式

- [x] 3.1 在 `panel.css` 中添加 `.knowledge-card--memory` 样式（紫色调边框/背景，与普通卡片区分）
- [x] 3.2 添加记忆卡片专属图标样式（🧠 记忆标签徽章）

## 4. 集成到 chat.js

- [x] 4.1 在工具定义注册处添加 `search_memories` 和 `get_memory_file` 两个工具定义，描述中包含"当前域名相关问题优先查询记忆"引导语
- [x] 4.2 实现 `search_memories` 的 handler，调用 `memory.searchMemories(domain)` 并返回结果
- [x] 4.3 实现 `get_memory_file` 的 handler，调用 `memory.getMemoryFile(path)` 并返回结果
- [x] 4.4 在 `startAgentLoop` 最终回复保存后，调用 `triggerMemoryGeneration(sessionMessages, getCurrentHostname(), sessionTitle)`（不 await）
- [x] 4.5 确保 `setSending(false)` 在记忆生成触发前执行，不阻塞聊天 UI
- [x] 4.6 用户取消或错误时不触发记忆生成

## 5. 记忆合并优化（防冗余）

- [x] 5.1 实现 `recordMemoryAccess(path)` — 在 `getMemoryFile` 中追踪 LLM 读取过的记忆文件路径
- [x] 5.2 实现 `evaluateMemoryMerge(existingMemories, newContent)` — 调用 AI 判断新对话总结与已有记忆的关系（SKIP/UPDATE/CREATE）
- [x] 5.3 实现 `updateMemoryFile(memoryItemId, path, content)` — 原地更新已有记忆文件内容并刷新文件树和计数
- [x] 5.4 修改 `generateMemory` — 接收 `accessedPaths`，无命中记忆时创建新文件，有命中时先调用 `evaluateMemoryMerge` 决定操作
- [x] 5.5 修改 `triggerMemoryGeneration` — 在触发记忆生成时拍下 `_accessedMemoryPaths` 快照，清空追踪状态

## 6. 验证闭环流程

- [x] 6.1 验证：首次打开知识面板 → 无记忆卡片（尚未生成记忆）
- [x] 6.2 验证：完成一轮 AI 对话 → 记忆文件以会话标题命名存入记忆卡片
- [x] 6.3 验证：打开记忆卡片文件管理 → 看到域名分组的记忆文件，文件名即会话标题
- [x] 6.4 验证：新对话命中记忆且内容完全被已有记忆覆盖 → 跳过，不创建新文件（SKIP）
- [x] 6.5 验证：新对话命中记忆且有部分新补充信息 → 更新已有记忆文件（UPDATE）
- [x] 6.6 验证：新对话与已有记忆无关 → 创建新记忆文件（CREATE）
- [x] 6.7 验证：删除记忆卡片 → 卡片消失，所有记忆文件被清除
- [x] 6.8 验证：删除卡片后完成新对话 → 记忆卡片自动重建，新记忆文件生成
