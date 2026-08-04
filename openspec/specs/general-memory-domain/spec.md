# general-memory-domain

## 新增需求

### 需求：general 域名作为跨域通用记忆载体
系统 SHALL 将 `general` 域名视为正式的记忆分类，用于存储不特定于某个网站的跨域通用经验和知识。`general` 域名在功能上与当前标签页域名完全对等，AI 可主动搜索、读取和写入该域下的记忆文件。

#### 场景：general 域名下的记忆文件可被正常存取
- **WHEN** 系统或 AI 调用 `saveMemoryFile('general', '功能地图设计方法', content)`
- **THEN** 记忆文件存入 FileCacheManager，路径为 `general/功能地图设计方法.md`
- **AND** TreeCacheManager 中 general 节点正常出现在文件树中
- **AND** 记忆卡片的 `domainCount` 中计入 general 域

#### 场景：general 域名下的记忆可被搜索
- **WHEN** AI 调用 `search_memories({domain: 'general'})` 或 `search_memories()`
- **THEN** 返回 general 域名下的记忆文件列表
- **AND** 文件路径前缀为 `general/`

#### 场景：general 域与当前域互不干扰
- **WHEN** 当前标签页域名为 `github.com`，general 域下有 5 条记忆，当前域下有 3 条记忆
- **THEN** `search_memories()` 仅返回当前域 `github.com` 下的 3 条记忆
- **AND** `search_memories({domain: 'general'})` 返回 general 域下的 5 条记忆

### 需求：AI 对话开始时可感知通用记忆
系统 SHALL 在构建 AI 请求消息时，通过 `buildMemoryHint()` 同时向 AI 注入当前域名和 general 域名的记忆提示，引导 AI 根据用户问题的性质自主决定查询哪个域的记忆。

#### 场景：当前域和 general 域均有记忆文件时注入双域提示
- **WHEN** 当前域名 `github.com` 下有 2 条记忆，general 域名下有 3 条记忆
- **THEN** `buildMemoryHint()` 返回的提示包含两部分：当前域名记忆概况和 general 域记忆概况
- **AND** 提示中明确建议 AI 先查当前域名记忆，如果涉及通用方法/模式/经验也可查询 general 记忆
- **AND** 功能地图的特殊引导仅对当前域名进行（general 域不触发功能地图引导）

#### 场景：仅当前域有记忆时行为不变
- **WHEN** 当前域名有记忆文件但 general 域无记忆文件
- **THEN** `buildMemoryHint()` 返回仅包含当前域记忆的提示（与现有行为一致）

#### 场景：仅 general 域有记忆时注入通用记忆提示
- **WHEN** 当前域名无记忆文件但 general 域有记忆文件
- **THEN** `buildMemoryHint()` 返回通用记忆提示："通用记忆中有 N 条跨域经验，建议调用 search_memories({domain: 'general'}) 查询"
- **AND** 不返回 null（与当前 `hostname === 'general'` 时 return null 的行为不同）

#### 场景：两域均无记忆时不注入提示
- **WHEN** 当前域名和 general 域名均无记忆文件
- **THEN** `buildMemoryHint()` 返回 null

### 需求：AI 自主决定记忆存储域名
系统 SHALL 在对话结束触发记忆生成时，让 AI 基于对话内容判断新总结应存入当前域名还是 general 域名（或同时存储到两个域）。AI 在 `evaluateMemoryMerge()` 阶段统一下达决策。

#### 场景：AI 判定存入当前域
- **WHEN** 对话内容与当前网站操作密切相关（如"makedaily.cn 的某个按钮怎么定位"）
- **THEN** AI 返回 `CREATE`（默认存入当前域），路径格式为 `{hostname}/{filename}.md`

#### 场景：AI 判定存入 general 域
- **WHEN** 对话内容为跨域通用经验（如"React 性能优化的通用方法"、"如何设计功能地图"）
- **THEN** AI 可在 CREATE 指令中指定 `general` 域名，路径为 `general/{filename}.md`
- **AND** 实现层解析 CREATE 决策时从 AI 返回的完整路径中提取域名

#### 场景：AI 判定同时存入两域
- **WHEN** 对话内容既有域特定知识又有可泛化的通用经验
- **THEN** AI 先执行 CREATE（或 UPDATE）存入当前域
- **AND** 再生成一条 `save_memory_file` 调用的输出，将泛化部分存入 general 域
- **AND** 记忆生成流程处理这种多路径输出

#### 场景：合并判定时考虑双域已有记忆
- **WHEN** `evaluateMemoryMerge()` 被调用
- **THEN** prompt 中包含当前域名已有的记忆文件列表和 general 域已有的记忆文件列表
- **AND** AI 基于两个域的内容综合判断 SKIP / UPDATE / CREATE
