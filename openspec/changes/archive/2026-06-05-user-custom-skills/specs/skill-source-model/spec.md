## ADDED Requirements

### Requirement: Skill type 字段
所有 Skill 运行时对象 SHALL 包含 `type` 字段，标识技能来源。内置技能值为 `'builtin'`，用户创建技能值为 `'user'`。

#### Scenario: 内置技能标记为 builtin
- **WHEN** 技能注册完成后
- **THEN** 所有从 .md 文件种子的技能对象 `type` 字段值为 `'builtin'`

#### Scenario: 用户技能标记为 user
- **WHEN** 用户创建技能并注册
- **THEN** 注册后的技能对象 `type` 字段值为 `'user'`

#### Scenario: type 字段不影响运行时行为
- **WHEN** 系统构建 prompt、激活技能、渲染列表
- **THEN** builtin 和 user 技能的行为完全一致，消费端不依据 `type` 做逻辑分支

### Requirement: createSkill(dto) 统一工厂函数
系统 SHALL 提供 `createSkill(dto)` 函数作为所有 Skill 运行时对象的唯一创建入口。DTO 为纯数据对象不含方法。工厂函数负责添加 `getPrompt()` 方法。

#### Scenario: createSkill 生成运行时对象
- **WHEN** 调用 `createSkill({ id: 'code-master', name: '...', prompt: '...', type: 'builtin' })`
- **THEN** 返回对象包含 `id`、`name`、`prompt`、`type` 以及 `getPrompt()` 方法

#### Scenario: getPrompt() 返回 prompt 字段
- **WHEN** 调用 `skill.getPrompt()`
- **THEN** 返回该技能 DTO 中的 `prompt` 字段值

#### Scenario: 不返回 getTools 和 getUIDelegate
- **WHEN** 调用 `createSkill(dto)`
- **THEN** 返回对象上不存在 `getTools` 或 `getUIDelegate` 方法

### Requirement: ai_helper_skills 两集合存储模型
系统 SHALL 使用 `ai_helper_skills` 键，内部按语言隔离为 `cn` / `en` 两个平级集合。每个集合为 `{ skillId → skillObject }` Map。根级含 `_seededVersion` 记录上次种子时的扩展版本，两个集合共用。

#### Scenario: cn 和 en 集合独立
- **WHEN** 中文环境下用户编辑 code-master 的 prompt 并保存
- **THEN** 仅 `data.cn["code-master"].prompt` 被更新，`data.en["code-master"]` 不变

#### Scenario: 用户技能仅存在于创建时的语言集合
- **WHEN** 用户在中文环境创建自定义技能
- **THEN** 该技能仅出现在 `data.cn` 中，`data.en` 中不存在

#### Scenario: 删除按语言隔离
- **WHEN** 用户在中文环境删除 code-master
- **THEN** `data.cn["code-master"].deleted = true`，`data.en["code-master"]` 不受影响

### Requirement: SkillRegistry.bootstrap() 初始化决策
系统 SHALL 将 `loadAllSkills()` 重构为 `bootstrap()` 方法，按以下顺序决策：
1. `ai_helper_skills` 不存在 → 首次安装 → `_seedLanguage(currentLang)`
2. `data[currentLang]` 不存在 → 懒种子 → `_seedLanguage(currentLang)`
3. `_seededVersion` ≠ 当前扩展版本 → `_mergeBuiltinUpdate(currentLang)`
4. `_loadFromStorage(currentLang)` 加载当前语言集合

#### Scenario: 首次安装种子当前语言
- **WHEN** `ai_helper_skills` 键不存在，当前语言为 zh-CN
- **THEN** 系统 fetch skills.json 列出的所有 skill.cn.md，写入 `data.cn`，每个技能 `_editVersion` 设为 0，设置 `_seededVersion`，加载到内存

#### Scenario: 后续启动从 storage 读取
- **WHEN** `data.cn` 已存在且版本匹配
- **THEN** 系统直接加载 `data.cn` 中 `deleted !== true` 的技能，不发起 .md fetch

#### Scenario: 懒种子另一语言集合
- **WHEN** 用户首次切换到英文
- **THEN** `data.en` 不存在 → 从 skill.en.md 种子全部 builtin → 写入 `data.en` → 加载到内存
- **AND** `data.cn` 集合不受影响

#### Scenario: 扩展更新后合并当前语言
- **WHEN** `_seededVersion` 与当前扩展版本不同，当前语言为 zh-CN
- **THEN** 对 `data.cn` 中每个 `type === 'builtin'` 的技能从对应 .md 逐字段合并

### Requirement: 语言切换 — 保存当前 + 加载目标
系统 SHALL 在语言切换时：将当前内存中的技能变更写回当前语言集合 → 检查目标语言集合是否存在（不存在则懒种子）→ 清空内存 → 加载目标集合。

#### Scenario: 切换前保存当前集合
- **WHEN** 用户在中文环境编辑了 code-master 的 prompt，然后切换到英文
- **THEN** code-master 的编辑先写入 `data.cn`，再进行集合切换

#### Scenario: 切回中文后编辑保留
- **WHEN** 用户从英文切回中文
- **THEN** 之前中文环境编辑过的 code-master prompt 完整保留

#### Scenario: 用户技能随语言切换可见性变化
- **WHEN** 用户在中文环境创建了自定义技能，切换到英文
- **THEN** 该自定义技能在英文环境下不可见，切回中文后恢复可见

### Requirement: 扩展更新自动合并 Builtin Skill — _editVersion 机制
系统 SHALL 使用 `_editVersion` 计数器判断合并策略。种子时 `_editVersion` 为 0，每次用户编辑 +1。扩展更新时：`_editVersion === 0` 表示用户从未编辑，用新版 .md 全量覆盖；`_editVersion > 0` 表示用户编辑过，完全保留不做覆盖。`_editVersion` 不受版本更新影响。

#### Scenario: 用户未编辑过的技能自动更新
- **WHEN** builtin 技能的 `_editVersion` 为 0
- **AND** 新版本 .md 的内容有变更
- **THEN** 该技能的全部字段（name/description/prompt）更新为新版 .md 内容

#### Scenario: 用户编辑过的技能完全保留
- **WHEN** builtin 技能的 `_editVersion > 0`（用户修改过任意字段）
- **AND** 新版本 .md 的内容有变更
- **THEN** 该技能的全部字段保留用户编辑的值，不做任何覆盖

#### Scenario: 编辑计数不受版本更新影响
- **WHEN** builtin 技能的 `_editVersion` 为 3，扩展更新触发合并
- **THEN** 合并后 `_editVersion` 保持为 3

#### Scenario: 两语言集合独立合并
- **WHEN** 扩展更新后，用户当前语言为 zh-CN
- **THEN** 仅 `data.cn` 执行合并，`data.en` 待用户切换到英文时才触发合并

### Requirement: 移除 getTools / getUIDelegate
系统 SHALL 从 skill 运行时对象上移除 `getTools()` 和 `getUIDelegate()` 方法。`chat.js` 中遍历这些方法的代码 SHALL 被移除。

#### Scenario: skill 对象无 getTools
- **WHEN** 注册任意技能
- **THEN** 该技能对象上不存在 `getTools` 方法

#### Scenario: executeToolCall 不再遍历
- **WHEN** `executeToolCall()` 处理 AI 工具调用
- **THEN** 代码中不存在 `all[i].getTools()` 的遍历循环

#### Scenario: buildMergedTools 仅合并全局 TOOLS
- **WHEN** `buildMergedTools()` 构建工具列表
- **THEN** 仅合并全局 `TOOLS` 数组

## MODIFIED Requirements

### Requirement: MD 文件解析返回纯 DTO
修改 `skill-md-loader` 要求：`_parseSkillMd()` SHALL 返回纯数据 DTO，不再包含方法。运行时方法由 `createSkill(dto)` 添加。

#### Scenario: _parseSkillMd 返回纯数据
- **WHEN** 解析 skill.cn.md
- **THEN** 返回 `{ id, name, description, category, prompt }`，不包含任何函数属性

### Requirement: Skill 定义接口更新
修改 `skill-system` 要求：Skill 运行时对象 SHALL 包含 `type` 字段，不再要求 `getTools()` 和 `getUIDelegate()`。

#### Scenario: Skill 对象兼容新接口
- **WHEN** `SkillRegistry.getAll()` 返回技能对象
- **THEN** 每个对象具有 `id`、`name`、`description`、`category`、`type`、`getPrompt()` 属性
- **AND** 对象上不存在 `getTools` 或 `getUIDelegate` 方法

### Requirement: 工具分发不再由 Skill 声明驱动
修改 `skill-system` 要求：移除"遍历所有激活 Skill 的工具列表查找匹配工具"的逻辑。工具完全由 Agent 运行时全局 TOOLS 定义提供。

#### Scenario: 工具列表仅来源于全局 TOOLS
- **WHEN** LLM 请求发送时构建 `tools` 参数
- **THEN** 仅包含全局 `TOOLS` 数组中定义的工具，不包括任何技能自带的工具
