## MODIFIED Requirements

### Requirement: Skill 定义接口
系统 SHALL 支持两种方式注册 Skill：
1. **MD 文件方式**：通过 `SkillRegistry.loadAllSkills()` 自动扫描并加载 `skills/` 目录下的 `skill.md` 文件，解析 YAML front matter 获取元数据（`id`、`name`、`description`、`category`），Markdown 正文作为 `getPrompt()` 内容
2. **代码注册方式**（向后兼容）：通过 `window.__registerSkill(skillDefinition)` 注册 Skill 对象，`skillDefinition` 必须包含 `id`、`name`、`description`、`getPrompt()`、`getTools()`，可选 `getUIDelegate()`、`category`。注册即激活。

#### Scenario: MD 文件自注册
- **WHEN** 插件初始化时 `loadAllSkills()` 扫描 `skills/code-master/skill.md`，成功解析 front matter 和正文
- **THEN** 该 Skill 被添加到注册表，具备 `id: "code-master"`、`name: "代码大师"`、`description`、`category` 字段，`getPrompt()` 返回 MD 正文内容，立即进入激活状态

#### Scenario: JS 代码向后兼容注册
- **WHEN** `skills/test-data-generation/index.js` 在页面加载时调用 `window.__registerSkill({id: "test-data-generation", name: "测试数据生成", category: "测试", ...})`
- **THEN** 该 Skill 被添加到注册表，且立即进入激活状态（`isActive("test-data-generation")` 返回 `true`）

#### Scenario: 注册一个无 UI 的 Skill
- **WHEN** 注册的 Skill 不提供 `getUIDelegate` 和 `category`
- **THEN** 该 Skill 正常注册并激活，`getUIDelegate()` 返回 `null`，`category` 未定义时归入"其他"

#### Scenario: 注册带分类的 Skill
- **WHEN** 注册的 Skill 包含 `category: '开发'`
- **THEN** 该 Skill 被标记为"开发"分类

### Requirement: SkillRegistry 管理 Skill 生命周期
系统 SHALL 提供 `SkillRegistry` 单例。支持以下操作：
- `register(skill)`：注册技能对象（注册即激活）
- `loadAllSkills()`：异步扫描 `skills/` 目录并加载所有 MD 技能文件
- `activate(skillId)` / `deactivate(skillId)`：激活/停用技能
- `isActive(skillId)`：查询激活状态
- `getActive()`：获取所有激活 Skill
- `getAll()`：获取所有已注册 Skill

#### Scenario: 注册即激活
- **WHEN** 调用 `window.__registerSkill(testDataGenSkill)`
- **THEN** 该 Skill 同时被注册和激活，`isActive("test-data-generation")` 返回 `true`

#### Scenario: MD 加载即激活
- **WHEN** `loadAllSkills()` 完成后，所有成功解析的 MD 技能被注册
- **THEN** 每个 MD 技能自动激活

#### Scenario: 重复注册同一 ID
- **WHEN** 以相同 `id` 调用 `__registerSkill()` 两次
- **THEN** 后注册的 Skill 覆盖前者，仍保持激活状态

### Requirement: 系统 Prompt 由 Skill 动态注入
聊天系统 SHALL 在构建系统消息时按两层结构注入 Skill 信息：
1. **技能目录**（始终注入）：所有已注册 Skill 的 `name` 和 `description`，无论激活状态
2. **已激活规则**（条件注入）：所有激活 Skill 的 `getPrompt()` 完整规则片段（MD 技能的 `getPrompt()` 返回 MD 正文）

#### Scenario: 有激活 Skill 时构建 prompt
- **WHEN** 有 2 个 Skill 激活，各自 `getPrompt()` 返回不同内容
- **THEN** 系统 prompt 包含基础上下文，后接 "## 已注册技能" 目录（所有 Skill），再后接 "## 已激活技能规则"（仅激活 Skill 的完整 prompt）

#### Scenario: MD 技能 prompt 注入
- **WHEN** 激活的 `code-master` 为 MD 格式技能
- **THEN** 该技能的 `getPrompt()` 返回其 `skill.md` 正文内容，被注入到 "已激活技能规则" 章节

#### Scenario: 无激活 Skill 时构建 prompt
- **WHEN** 所有 Skill 均未激活
- **THEN** 系统 prompt 仍包含 "## 已注册技能" 目录（名称+描述），但不包含 "## 已激活技能规则" 章节

#### Scenario: 技能目录仅含轻量信息
- **WHEN** 技能目录被注入到系统 prompt 中
- **THEN** 每个 Skill 仅包含 `name` 和 `description` 字段，不包含完整 prompt 规则

### Requirement: 工具分发由 Skill 声明驱动
系统 SHALL 在处理 Agent 工具调用时，遍历所有激活 Skill 的工具列表查找匹配的工具名称，找到后调用其 `handler` 函数。找不到匹配时回退到内置工具处理。MD 格式技能的 `getTools()` 返回空数组，不声明专属工具。

#### Scenario: Skill 工具被匹配
- **WHEN** Agent 调用工具 "execute_request"，且激活的 Skill `test-data-generation` 的 `getTools()` 中包含匹配该名称的工具定义
- **THEN** 系统调用该工具的 `handler(args)` 并返回结果

#### Scenario: MD 技能无专属工具
- **WHEN** Agent 调用任意工具，且仅 MD 格式技能激活
- **THEN** 所有激活 MD 技能的 `getTools()` 返回空数组，系统回退到内置工具处理

#### Scenario: 工具无匹配回退到内置
- **WHEN** Agent 调用工具 "get_captured_requests"，且没有任何激活 Skill 提供同名工具
- **THEN** 系统回退到内置的 `executeBuiltinTool()` 处理
