## Context

当前项目是一个 Chrome 扩展 (Manifest V3)，已有"知识管理"模块 (`knowledge.js`)，支持导入代码文件并按卡片展示。知识条目存储在 `chrome.storage.local`（元数据）+ IndexedDB（文件内容）。AI 聊天模块 (`chat.js`) 通过 SSE 流式响应实现 Agent Loop，支持工具调用和多轮对话。

目前没有任何记忆功能——AI 对话结束后，产生的技术决策、问题解决路径等有价值信息完全丢失。

## Goals / Non-Goals

**Goals:**
- 在知识面板中创建一张**仅有一张**的"记忆"卡片，类型为 `memory`
- AI 任务完成时自动生成结构化记忆总结并存储
- 记忆按**域名**分类组织，存储为 Markdown 文件
- 新对话中，大模型通过工具查询当前域名下的记忆文件，根据文件名自行判断是否使用
- 复用现有 FileCacheManager/TreeCacheManager 存储记忆文件
- 记忆卡片视觉与普通知识卡片有清晰区分

**Non-Goals:**
- 不修改普通知识卡片的行为或数据模型（仅扩展 type 字段）
- 不在扩展代码中做关键词匹配或语义检索——交给大模型通过工具自行判断
- 不引入新的存储后端（复用 chrome.storage.local + IndexedDB）
- 不改变现有的导入文件流程

## Decisions

### 1. 存储设计：复用 IndexedDB + 扩展 chrome.storage.local

**决策**: 记忆卡片元数据存入 `chrome.storage.local`（key: `ai_helper_memory_item`，单对象），记忆文件内容通过 FileCacheManager/TreeCacheManager 存入 IndexedDB。

**理由**: 现有 FileCacheManager 已支持 `knowledgeId::path` 格式的键值存储和文件树管理，无需新建存储层。

**替代方案**: 完全使用 chrome.storage.local 存储文件内容 → 拒绝，chrome.storage.local 有 10MB 限制，不适合大量文件内容。

### 2. 域名分类：按 URL hostname 自动归类

**决策**: 记忆文件按 URL 的 hostname 自动归类目录。例如 `github.com` 下的所有记忆存入 `记忆/github.com/` 目录。

**理由**: 域名是自然的内容边界，用户的对话通常围绕特定平台展开。自动归类避免用户手动管理。

**替代方案**: 按项目名分类 → 拒绝，用户可能没有配置项目。按用户自定义标签 → 过度设计，首次迭代不需要。

### 3. 匹配策略：大模型通过工具自行查询

**决策**: 记忆文件以会话标题命名（如 `修复websocket断线重连问题.md`），提供 AI 工具 `search_memories` 查询当前域名下的记忆文件列表。大模型根据文件名自行判断是否相关，通过工具读取记忆内容。

**理由**: 会话标题天然表达了该记忆的核心内容。文件名即语义，大模型判断“是否相关”远比关键词匹配精准。与项目中 `search_project_code` 等工具的使用模型一致——大模型通过工具自主决策。

**替代方案**: 扩展代码内做关键词匹配 → 简化，交给模型判断更准且更灵活。

### 4. 卡片生命周期：按需自动创建，用户可删除

**决策**: 记忆卡片在首次记忆生成时自动创建；用户可删除记忆卡片（同时清空所有记忆文件）。下次对话完成生成新记忆时，记忆卡片自动重建。

**理由**: 给用户完全的控制权。记忆卡片仅在有记忆内容时存在，删除后不留空壳。下次 AI 对话完成后自动重建。

### 5. 记忆生成时机：startAgentLoop 最终回复保存后

**决策**: 在 `startAgentLoop` 中 `await saveCurrentMessages()` 之后（约 L956），异步调用记忆生成，不阻塞 UI。

**理由**: 此时对话内容已完整保存，可提取有效信息。异步执行避免影响用户体验。

## Risks / Trade-offs

- **[风险] 记忆文件膨胀** → 单次对话生成一个记忆文件（已由 AI 总结压缩），总体量可控。提供删除卡片清空全部记忆。
- **[风险] 大模型不主动查询记忆工具** → 在系统 prompt 中提示大模型"当问题与当前域名相关时，使用 search_memories 工具查询历史记忆"。
- **[权衡] 删除记忆卡片即清空全部记忆** → 用户删除卡片时所有记忆文件一并清除。记忆卡片在下次对话自动重建。需在删除前做二次确认。

## Migration Plan

1. 新增 `ai_helper_memory_item` key 到 chrome.storage.local，初始化为默认记忆卡片
2. 扩展现有 knowledge card 渲染逻辑，保持向后兼容（旧 item 无 type 字段）
3. chat.js 新增独立模块 `memory.js` 处理记忆生成和匹配
4. 无需数据迁移——这是一项全新功能
5. 回滚：移除 `memory.js` 引用，移除 `ai_helper_memory_item` key 即可

## Open Questions

- 系统 prompt 如何引导大模型主动查询记忆？（建议在 domain 相关的工具描述中引导）
- 记忆文件名是否需要去重？（建议：同标题追加序号，如 `修复websocket问题(2).md`）
