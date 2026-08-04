## MODIFIED Requirements

### Requirement: Skill 定义接口
系统 SHALL 支持通过 `window.__registerSkill(skillDefinition)` 注册 Skill。`skillDefinition` 必须包含 `id`（唯一标识）、`name`（显示名称）、`description`（描述）、`getPrompt()`（返回 prompt 片段）、`getTools()`（返回工具定义数组），可选 `getUIDelegate()`（返回 UI 扩展点）、`category`（所属分类，默认归入"其他"）。注册即激活。

#### Scenario: Skill 文件自注册
- **WHEN** `skills/test-data-generation/index.js` 在页面加载时调用 `window.__registerSkill({id: "test-data-generation", name: "测试数据生成", category: "测试", ...})`
- **THEN** 该 Skill 被添加到注册表，且立即进入激活状态（`isActive("test-data-generation")` 返回 `true`）

#### Scenario: 注册一个无 UI 的 Skill
- **WHEN** 注册的 Skill 不提供 `getUIDelegate` 和 `category`
- **THEN** 该 Skill 正常注册并激活，`getUIDelegate()` 返回 `null`，`category` 未定义

#### Scenario: 注册带分类的 Skill
- **WHEN** 注册的 Skill 包含 `category: '开发'`
- **THEN** 该 Skill 被标记为"开发"分类

### Requirement: SkillRegistry 管理 Skill 生命周期
系统 SHALL 提供 `SkillRegistry` 单例，通过 `window.__registerSkill(skill)` 注册（注册即激活）、支持 `getActive()` 获取所有激活 Skill、`getAll()` 获取所有已注册 Skill。

#### Scenario: 注册即激活
- **WHEN** 调用 `window.__registerSkill(testDataGenSkill)`
- **THEN** 该 Skill 同时被注册和激活，`isActive("test-data-generation")` 返回 `true`

#### Scenario: 重复注册同一 ID
- **WHEN** 以相同 `id` 调用 `__registerSkill()` 两次
- **THEN** 后注册的 Skill 覆盖前者，仍保持激活状态

### Requirement: 系统 Prompt 由 Skill 动态注入
聊天系统 SHALL 在构建系统消息时按两层结构注入 Skill 信息：
1. **技能目录**（始终注入）：所有已注册 Skill 的 `name` 和 `description`，无论激活状态
2. **已激活规则**（条件注入）：所有激活 Skill 的 `getPrompt()` 完整规则片段

#### Scenario: 有激活 Skill 时构建 prompt
- **WHEN** 有 2 个 Skill 激活，各自 `getPrompt()` 返回不同内容
- **THEN** 系统 prompt 包含基础上下文，后接 "## 已注册技能" 目录（所有 Skill），再后接 "## 已激活技能规则"（仅激活 Skill 的完整 prompt）

#### Scenario: 无激活 Skill 时构建 prompt
- **WHEN** 所有 Skill 均未激活
- **THEN** 系统 prompt 仍包含 "## 已注册技能" 目录（名称+描述），但不包含 "## 已激活技能规则" 章节

#### Scenario: 技能目录仅含轻量信息
- **WHEN** 技能目录被注入到系统 prompt 中
- **THEN** 每个 Skill 仅包含 `name` 和 `description` 字段，不包含完整 prompt 规则、工具定义或 handler 函数

### Requirement: 斜杠命令面板
系统 SHALL 在聊天输入框中支持 `/` 斜杠命令：当用户输入 `/` 时（输入框为空或以 `/` 开头），弹出下拉面板展示所有已注册 Skill 的列表，供用户选择。

#### Scenario: 空输入框输入 "/" 弹出面板
- **WHEN** 用户在空聊天输入框中输入 `/`
- **THEN** 在输入框上方弹出绝对定位的下拉面板，列出所有已注册 Skill，每行包含 Skill 名称和描述

#### Scenario: 输入 "/" 后前缀过滤
- **WHEN** 用户在输入框中输入 `/test`
- **THEN** 下拉面板仅展示 `id` 或 `name` 以 "test" 开头的 Skill

## ADDED Requirements

### Requirement: OpenSpec 四个技能注册
系统 SHALL 在页面加载时注册 4 个 OpenSpec 技能：
- `openspec-explore`：id `openspec-explore`，名称 "OpenSpec 探索"，分类 "基础"，描述 "需求探索与分析，不产生文件"
- `openspec-propose`：id `openspec-propose`，名称 "OpenSpec 提案"，分类 "基础"，描述 "创建变更提案，生成 proposal/design/specs/tasks"
- `openspec-apply`：id `openspec-apply`，名称 "OpenSpec 实现"，分类 "基础"，描述 "按任务清单逐步实现变更"
- `openspec-archive`：id `openspec-archive`，名称 "OpenSpec 归档"，分类 "基础"，描述 "归档已完成的变更"

#### Scenario: 四个技能在目录中可见
- **WHEN** 用户在调试模式下查看技能 Tab
- **THEN** "基础"分类下出现四个 OpenSpec 技能行，各自显示对应名称和描述

#### Scenario: 斜杠命令可发现
- **WHEN** 用户在聊天输入框中输入 `/openspec`
- **THEN** 下拉面板展示 4 个 OpenSpec 技能行（探索 / 提案 / 实现 / 归档），每行包含技能名称和简短描述
