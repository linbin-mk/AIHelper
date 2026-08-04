## Context

当前记忆系统按当前标签页 `hostname` 分类存储记忆文件（`{hostname}/{filename}.md`），`general` 域名仅在对话无关联页面时作为后备。`buildMemoryHint()` 仅向 AI 注入当前域名的记忆提示。这导致两个问题：

1. **跨域经验无法被 AI 感知**：用户在 `github.com` 上问"之前那个功能地图怎么画的"，AI 不会主动查 `general` 域下的 `功能地图设计方法.md`
2. **记忆存储缺乏智能分类**：所有记忆都写入当前域名，无法区分"通用方法论"和"域特定指令"

## Goals / Non-Goals

**Goals:**
- `buildMemoryHint()` 同时提及当前域名和 general 域名的记忆，引导 AI 自主决定查询哪个域
- 对话结束后，AI 基于内容判断新总结应存入当前域名还是 general 域名（或同时）
- general 域名从一个被动后备升级为正式的记忆域名，与当前域名并列

**Non-Goals:**
- 不新增其他"特殊域名"
- 不改动 `search_memories` / `get_memory_file` / `save_memory_file` 工具的函数签名
- 不改动记忆文件的存储结构（仍然是 `FileCacheManager` + `TreeCacheManager`）
- 不涉及 UI 层的视觉变化

## Decisions

### 决策1：general 域名的提示注入策略

在 `buildMemoryHint()` 中并行查询当前域名和 general 域名的记忆文件，修改提示词结构：

```
当前域名 xxx 下有 N 条特定记忆：...
通用记忆中有 M 条跨域经验：...
强烈建议先调用 search_memories 查当前域名记忆，
如果涉及通用方法/模式/经验，也可以调用 search_memories({domain: 'general'}) 查询通用记忆。
```

**备选方案**：在 tools 层面新增 `search_general_memories` 工具。被否决，因为 `search_memories` 已支持 `domain` 参数，新增工具是冗余设计的。

### 决策2：记忆生成的域名判定方式

在 `evaluateMemoryMerge()` 的 AI prompt 中扩展判断维度。prompt 中将同时传入：
- 当前域已有的记忆文件
- general 域已有的记忆文件

AI 的 CREATE 指令需要指明目标域名：
```
CREATE: <domain>  如 CREATE: general 或 CREATE: github.com
```

UPDATE 的路径本身即包含域名前缀（如 `general/xxx.md`），无需单独指定。

**备选方案**：基于关键词/规则自动判定（如检测到"经验"、"方法"、"模式"等词则存 general）。被否决，规则覆盖不完整且容易误判，AI 的语言理解能力更适合这个任务。

### 决策3：general 域名的记忆访问追踪

`getMemoryFile()` 在 `recordMemoryAccess()` 时已记录完整路径（含域名）。`triggerMemoryGeneration()` 在收集 `_accessedMemoryPaths` 时自然包含 general 域下的路径。无需改动追踪逻辑。

### 决策4：`buildMemoryHint()` 中 general 域名的展示条件

general 域名下的记忆提示**始终注入**（只要有文件），不因为当前域名是 general 而跳过。当前代码中 `if (hostname === 'general') return null` 的逻辑改为只在 general 域下无文件时跳过。

## Risks / Trade-offs

- [低风险] general 域名的记忆文件增多后，AI 可能过于"泛化"回答，未先查当前域特定记忆 → AI prompt 中"强烈建议先调用 search_memories" 已强调优先级
- [低风险] `evaluateMemoryMerge()` 的 prompt 变长（双域内容），可能增加 AI 调用耗时 → 已有 20 秒超时，失败降级到 CREATE
- [低风险] general 域名从后备升级后，可能与旧版存储的行为不一致 → general 域名本已存在且文件已按该路径存储，升级是语义上的而非数据迁移
