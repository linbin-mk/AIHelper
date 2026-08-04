## ADDED Requirements

### Requirement: Skill delete via context menu

系统 SHALL 在技能右键菜单中提供「删除」选项，用户点击后该技能从技能列表中移除。

#### Scenario: Right-click skill shows delete option

- **WHEN** 用户在技能列表中对任意技能行执行右键点击
- **THEN** 系统显示上下文菜单，包含「收藏」和「删除」两个选项

#### Scenario: Delete a skill via context menu

- **WHEN** 用户在技能右键菜单中点击「删除」
- **THEN** SkillRegistry 将该技能 ID 标记为已删除
- **AND** 技能列表即时刷新，被删除的技能不再显示
- **AND** 删除状态持久化到 `chrome.storage.local` 的 `ai_helper_skill_overrides` 键中

### Requirement: Deleted skills persist across extension restarts

系统 SHALL 在扩展启动时加载持久化的删除状态，确保被删除的技能在重启后仍然不可见。

#### Scenario: Deleted skills remain hidden after restart

- **WHEN** 用户删除某个技能后重新打开扩展面板
- **THEN** 被删除的技能在技能列表中仍然不可见

### Requirement: Deleted skills are excluded from other features

系统 SHALL 确保被删除的技能不显示在斜杠命令自动补全面板中，也不作为收藏夹可添加的选项。

#### Scenario: Deleted skill not in slash command panel

- **WHEN** 用户在聊天输入框中输入 `/` 触发技能自动补全
- **THEN** 已删除的技能不显示在自动补全候选列表中

#### Scenario: Deleted skill not available for favorites

- **WHEN** 用户尝试将技能添加到收藏夹
- **THEN** 已删除的技能不在可选技能列表中显示
