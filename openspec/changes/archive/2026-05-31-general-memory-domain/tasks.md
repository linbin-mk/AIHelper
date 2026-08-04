## 1. buildMemoryHint 扩展双域记忆查询

- [x] 1.1 修改 `buildMemoryHint()`，移除 `hostname === 'general'` 时 return null 的逻辑
- [x] 1.2 并行查询 general 域下的记忆文件（`FileCacheManager.getFilesByKnowledge(memoryItem.id)` 后过滤 `path.startsWith('general/')`）
- [x] 1.3 重构提示词生成逻辑：当两域均有记忆时输出双域提示，引导 AI 按当前域 → general 域的优先级查询，并提示 `search_memories({domain: 'general'})` 的调用方式
- [x] 1.4 功能地图特殊引导仅针对当前域名执行，不对 general 域做功能地图识别
- [x] 1.5 当当前域名就是 `general` 时不再触发"先查当前域"的优先级引导，仅列出 general 域记忆
- [x] 1.6 验证：无当前域记忆但有 general 域记忆时，提示词不返回 null

## 2. evaluateMemoryMerge 扩展双域判定

- [x] 2.1 修改 `evaluateMemoryMerge()` 的 AI prompt，将 current-hostname 和 general 均作为合法目标域名告知 AI
- [x] 2.2 prompt 中向 AI 说明：「对话内容与某一网站操作密切相关时存入当前域；跨域通用经验存入 general 域」
- [x] 2.3 AI 返回 UPDATE 指令时，路径本身已包含域名前缀（如 `general/xxx.md`），无需额外提取域名，沿现有逻辑
- [x] 2.4 AI 返回 CREATE 指令时，默认存入当前域；若 AI 在返回中明确指定域名（如 `CREATE: general`），按指定域名存储
- [x] 2.5 验证：AI 能正确执行跨域通用内容的 general 域存储决策

## 3. generateMemory 加载双域已有记忆

- [x] 3.1 修改 `generateMemory()`，在收集 `mergeExisting` 时不仅包含当前域被访问/生成的文件，也包含 general 域下被访问/生成的文件
- [x] 3.2 将 general 域已有的所有记忆文件也加入 `mergeExisting`，供 `evaluateMemoryMerge()` 判定
- [x] 3.3 保持 `triggerMemoryGeneration()` 的异步非阻塞调用方式不变

## 4. 验证和边界情况

- [x] 4.1 验证：搜索 `search_memories({domain: 'general'})` 正确返回 general 域记忆（无需代码改动，但要求功能可用）
- [x] 4.2 验证：`get_memory_file` 能正确读取 general 域下的记忆文件
- [x] 4.3 验证：`save_memory_file` 能正确写入 general 域下的记忆文件
- [x] 4.4 验证：general 域的 `domainCount` 在记忆卡片统计中正确计入
- [x] 4.5 验证：当两域均无记忆时，`buildMemoryHint()` 返回 null，不影响正常对话
