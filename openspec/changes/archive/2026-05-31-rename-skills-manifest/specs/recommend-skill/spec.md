## MODIFIED Requirements

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
