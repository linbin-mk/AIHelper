# memory-generation

## 新增需求

### 需求：AI 任务完成后自动生成记忆总结
系统 SHALL 在 AI Agent Loop 完成一轮完整对话（最终回复已保存）后，自动生成一份结构化的记忆总结。记忆生成 MUST 异步执行，不阻塞 UI。

#### 场景：正常对话完成后生成记忆
- **当** `startAgentLoop` 中无 tool_calls 分支执行到 `await saveCurrentMessages()` 之后
- **则** 系统异步调用记忆生成函数 `generateMemory(sessionMessages, hostname)`
- **且** 生成的记忆内容包含：对话时间、用户问题摘要、AI 回答摘要、关键技术点

#### 场景：错误或取消时跳过记忆生成
- **当** 用户取消对话或 AI 返回错误
- **则** 系统不触发记忆生成

#### 场景：记忆生成不阻塞聊天
- **当** 记忆生成正在执行
- **则** 用户立即可开始新一轮对话
- **且** `setSending(false)` 在记忆生成启动前就已执行

### 需求：记忆文件按域名分类存储
生成的记忆内容 SHALL 存储为 Markdown 文件，按域名分类组织目录结构。存储域名由 AI 在记忆生成阶段基于对话内容自主决定，可从当前标签页 hostname 和 `general` 两个域名中选择。文件路径格式为 `{hostname}/{会话标题}.md` 或 `general/{会话标题}.md`，以会话标题作为文件名。

#### 场景：根据域名创建目录并以会话标题存储
- **当** AI 判定对话内容归属于当前域名（如 `github.com`），会话标题为"修复websocket断线重连问题"
- **则** 记忆文件存储路径为 `github.com/修复websocket断线重连问题.md`
- **且** 如果 `github.com` 目录不存在则自动创建

#### 场景：根据域名创建目录并以会话标题存储（general 域）
- **当** AI 判定对话内容为跨域通用经验，会话标题为"功能地图设计方法"
- **则** 记忆文件存储路径为 `general/功能地图设计方法.md`
- **且** 如果 `general` 目录不存在则自动创建

#### 场景：相同域名追加新记忆文件
- **当** `github.com` 目录已存在且产生新记忆
- **则** 新记忆以新会话标题命名，创建为独立文件，不覆盖已有文件
- **且** 如果标题已存在，追加序号（如 `修复websocket问题(2).md`）

#### 场景：无关联页面时的域名处理
- **当** 对话未关联任何页面（如 Popup 模式或全局对话）
- **则** 统一使用 `general` 作为默认分类，AI 仍可通过能力覆盖此默认值

### 需求：AI 自主决定记忆存储域名
系统 SHALL 在 `evaluateMemoryMerge()` 阶段向 AI 提供双域已有记忆（当前域 + general 域），让 AI 基于内容综合判断新总结应存入哪个域名。AI 通过 UPDATE 或 CREATE 指令中的完整路径（含域名前缀）表达决策。

#### 场景：AI 判定存入当前域名
- **当** AI 判断新总结与当前域已有记忆相关或为域特定经验
- **则** AI 返回 `UPDATE: {hostname}/{filename}.md` 或 `CREATE`（默认存入当前域）
- **且** 文件最终写入当前域名目录

#### 场景：AI 判定存入 general 域名
- **当** AI 判断新总结为跨域通用经验，与 general 域已有记忆相关
- **则** AI 返回 `UPDATE: general/{filename}.md` 或指示存入 general 域
- **且** 文件最终写入 general 域名目录

#### 场景：AI 合并决策时考虑双域已有记忆
- **当** `evaluateMemoryMerge()` 被调用，传入 `mergeExisting` 包含当前域和 general 域的文件
- **则** AI prompt 中包含两个域的已有记忆内容供综合判断
- **且** AI 基于内容重叠程度决定 SKIP / UPDATE(当前域) / UPDATE(general) / CREATE

### 需求：记忆文件内容结构
每个记忆文件 MUST 包含结构化的 Markdown 内容。文件标题使用会话标题。对于功能地图类型的记忆文件，文件标题使用 "功能地图"（或 "Function Map"），且内容格式遵循功能地图规范。

#### 场景：记忆文件内容模板
- **当** 系统生成记忆文件
- **则** 文件内容包含以下章节：
  - `# {会话标题}` (标题，即文件名)
  - `**时间**: {日期时间}`
  - `**域名**: {hostname}`
  - `**用户问题**: {用户原始问题摘要}`
  - `**解决方案**: {AI 回答关键摘要}`
  - `**关键技术点**:` (列表形式的关键技术决策)

#### 场景：功能地图记忆文件格式
- **WHEN** AI 通过"建立网站大纲"技能生成功能地图文件
- **THEN** 文件内容包含以下章节（区别于标准记忆格式）：
  - `# {系统名称} 功能地图`
  - `**域名**: {hostname}`
  - `**URL**: {起始页面 URL}`
  - `**生成时间**: {日期时间}`
  - `**探索统计**: 共 {N} 个功能页面`
  - `## 功能目录`（编号列表）
  - `## 功能详情`（每行一个功能条目）

### 需求：记忆生成调用 AI 总结能力
系统 SHALL 使用 AI 模型对对话内容进行总结提炼，而非简单截断。总结 prompt MUST 要求 AI 提取关键技术和决策点。

#### 场景：AI 生成记忆总结
- **当** 系统调用记忆生成
- **则** 构建专门的记忆总结 prompt，包含对话历史
- **且** 向 AI 发送请求，要求以简短结构化格式总结
- **且** 将 AI 返回的总结内容写入记忆文件

#### 场景：记忆总结包含技术关键词
- **当** AI 生成的记忆总结
- **则** 总结中 MUST 包含"关键技术点"列表，每项为一个技术关键词或短语
- **且** 关键技术点用于后续记忆匹配

### 需求：记忆类型标记
系统 MAY 在记忆文件元数据中标记文件类型（通过文件名约定隐式区分），功能地图文件固定命名为 `功能地图.md`（中文环境）或 `function-map.md`（非中文环境）。

#### 场景：通过文件名区分记忆类型
- **WHEN** `buildMemoryHint()` 扫描当前域名下记忆文件
- **THEN** 通过判断文件名是否为 `功能地图` 或 `function-map` 来识别地图文件
- **AND** 识别到的地图文件在提示中单独列出，引导 AI 优先查询

### 需求：记忆生成支持 OpenSpec 目录结构
`generateMemory()` 函数 SHALL 在对话结束后扫描 `{hostname}/openspec/changes/` 路径，将新增或修改的 artifact 文件作为记忆持久化。OpenSpec 产物的生成不经过 AI 总结步骤，直接以原始内容存入记忆系统。

#### 场景：Propose 后 artifact 文件自动成为记忆
- **当** AI 对话中执行 `/opsx:propose` 并生成了 proposal.md、design.md、tasks.md 等文件
- **则** 对话结束后，这些文件通过 FileCacheManager 存入 IndexedDB，路径为 `{hostname}/openspec/changes/{change-name}/`
- **且** 同时创建对应的记忆卡片（ai_helper_memory_item），`type: "memory"`

#### 场景：Apply 后更新已有记忆
- **当** AI 对话中执行 `/opsx:apply` 更新了 tasks.md
- **则** 对话结束后，更新后的 tasks.md 覆盖 IndexedDB 中已有同名文件
- **且** 记忆卡片对应的 knowledgeId 保持不变

#### 场景：无 OpenSpec 操作时不产生额外记忆
- **当** 对话不涉及 OpenSpec 操作
- **则** `generateMemory()` 按原有逻辑处理，不扫描 `openspec/changes/` 路径

### 需求：记忆文件命名遵循 OpenSpec 规范
OpenSpec artifact 记忆文件 SHALL 保持标准命名（proposal.md、design.md、tasks.md、specs/*.md），不添加时间戳或序号。目录结构遵循 `openspec/changes/{change-name}/` 模式。

#### 场景：Artifact 文件命名
- **当** 变更名称为 `add-user-auth`
- **则** 生成的 artifact 文件路径为 `{hostname}/openspec/changes/add-user-auth/proposal.md`
- **且** spec 文件路径为 `{hostname}/openspec/changes/add-user-auth/specs/{capability}/spec.md`

#### 场景：同名变更覆盖更新
- **当** 用户对同一变更名称重复执行 `/opsx:propose`
- **则** 新生成的 artifact 文件覆盖已有的同名文件
- **且** 提示用户确认覆盖操作
