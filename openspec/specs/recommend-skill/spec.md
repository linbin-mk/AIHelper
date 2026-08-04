## ADDED Requirements

### Requirement: 推荐Skill技能注册
系统 SHALL 注册一个新技能 `recommend-skill`，技能名称为"推荐Skill"，分类为"业务"。该技能通过 MD 文件方式注册（`skills/recommend-skill/skill.{cn,en}.md`），并在 `skills/skills.json` 中声明。技能不声明专属工具，不注册 `SkillUIDelegate`，完全依赖现有内置工具（`ask_user` 及收藏管理四工具）完成推荐流程。

#### Scenario: 技能在技能目录中可见
- **WHEN** 用户打开"技能"Tab
- **THEN** "业务"分类下出现"推荐Skill"技能行，显示名称"推荐Skill"和描述

#### Scenario: 斜杠命令可发现
- **WHEN** 用户在聊天输入框中输入 `/recommend`
- **THEN** 斜杠面板展示"推荐Skill"技能行

#### Scenario: 技能不声明专属工具
- **WHEN** 注册中心加载 `recommend-skill` 技能
- **THEN** 该技能的 `getTools()` 返回空数组
- **AND** `getUIDelegate()` 返回 `null`

### Requirement: 推荐Skill系统Prompt引导
技能的 prompt（MD 正文）SHALL 指导 AI 执行三段式推荐流程：

1. **澄清阶段**：通过 `ask_user` 工具向用户提问（单选题或带选项+自由输入的混合模式），逐步明确用户的场景、技术栈、角色和具体需求。至少进行 1-2 轮澄清后再输出推荐。
2. **推荐阶段**：基于已注册技能目录和用户需求，筛选出最多 5 个匹配技能。通过 `ask_user` 工具以 `multiSelect: true` 模式展示推荐结果，每项选项格式为 `"[技能名称] - [简短描述]"`，所有选项默认选中。
3. **创建阶段**：根据用户勾选的技能 ID，调用 `create_skill_collection` 工具创建收藏夹。工具参数 `name` 由 AI 根据用户场景生成（如"UI测试工具集"），`description` 为一句话概括，`skillIds` 为用户选中的技能 ID 数组。创建成功后告知用户。

Prompt 还应告知 AI 在后续对话中可使用 `add_skills_to_collection`、`remove_skills_from_collection`、`delete_skill_collection` 工具帮用户调整收藏夹。

#### Scenario: AI 执行引导式对话
- **WHEN** "推荐Skill"技能被激活且用户发送场景描述
- **THEN** AI 首先通过 `ask_user` 提问引导用户明确需求（如："你更关注代码质量方面还是数据操作方面？"）
- **AND** AI 不会在首次回复中直接输出推荐结果

#### Scenario: AI 轮次中逐步收窄范围
- **WHEN** AI 已经过至少一轮澄清提问
- **AND** 用户提供了足够的需求细节
- **THEN** AI 从已注册技能目录中筛选出最多 5 个匹配技能
- **AND** AI 通过 `ask_user`（`multiSelect: true`）展示推荐技能列表

#### Scenario: 无匹配技能时诚实告知
- **WHEN** AI 判断已注册技能目录中没有匹配用户需求的技能
- **THEN** AI 告知用户当前没有匹配的技能，建议用户描述其他场景或稍后查看
- **AND** 不调用 `create_skill_collection` 工具

#### Scenario: 用户确认后创建收藏夹
- **WHEN** 用户在 `ask_user` 多选卡片中勾选技能并点击确认
- **THEN** AI 获取用户选中的技能 ID 列表
- **AND** AI 调用 `create_skill_collection` 工具（传入 name、description、skillIds）
- **AND** AI 在回复中告知用户收藏夹已创建

### Requirement: 多语言支持
技能名称、描述和 prompt 内容 SHALL 支持中英文两个版本。

#### Scenario: 中文环境
- **WHEN** 语言环境为中文
- **THEN** 技能名称为"推荐Skill"，描述和 prompt 为中文版本

#### Scenario: 英文环境
- **WHEN** 语言环境为英文
- **THEN** 技能名称为"Recommend Skills"，描述和 prompt 为英文版本
