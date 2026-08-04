## ADDED Requirements

### Requirement: Edit button in skill detail popup

系统 SHALL 在技能详情弹窗中提供「编辑」按钮，用户点击后进入编辑模式，编辑操作按当前 UI 语言区分版本。

#### Scenario: Skill detail popup shows edit button

- **WHEN** 用户点击技能行打开详情弹窗
- **THEN** 弹窗 header 显示「编辑」按钮（位于「使用」按钮旁边）
- **AND** 如果当前语言版本的技能已被用户编辑过，弹窗 header 额外显示「已编辑」标签（标注语言）和「重置」按钮

#### Scenario: Edited tag shows language context

- **WHEN** 中文版技能被编辑后，用户在中文模式打开该技能详情
- **THEN** 显示「已编辑(中文)」标签
- **AND** 切换到英文模式打开同一技能详情时，英文版本仍为内置内容，不显示「已编辑」标签

### Requirement: Edit mode form for skill content

系统 SHALL 在编辑模式下将详情内容替换为可编辑表单，包含名称、描述和提示内容字段。

#### Scenario: Enter edit mode

- **WHEN** 用户在技能详情弹窗中点击「编辑」按钮
- **THEN** 弹窗的内容区替换为表单，包含：
  - 名称输入框（`<input type="text">`），预填当前名称
  - 描述文本框（`<textarea>`），预填当前描述
  - 提示内容文本框（`<textarea>`），预填当前提示内容，高度较大支持多行
- **AND** 弹窗 footer 显示「保存」和「取消」按钮
- **AND** 「使用」和「编辑」按钮在编辑模式下隐藏

### Requirement: Save edited skill

系统 SHALL 将用户编辑后的技能内容按当前语言版本保存到 `SkillRegistry` 并持久化，不影响其他语言版本。

#### Scenario: Save skill edits for current language

- **WHEN** 用户在中文模式下编辑技能内容后点击「保存」
- **THEN** SkillRegistry 将该技能当前语言版本（中文）的对应字段更新为编辑后的值
- **AND** 技能详情弹窗退出编辑模式，展示更新后的中文内容
- **AND** 技能列表中的名称即时刷新
- **AND** 编辑后的内容按语言版本持久化到 `chrome.storage.local` 的 `ai_helper_skill_overrides.editedSkills.<id>.cn` 键中

#### Scenario: Edit one language does not affect the other

- **WHEN** 用户在中文模式下编辑并保存某个技能
- **THEN** 英文版本的该技能内容保持不变
- **AND** 切换到英文模式查看该技能时，展示的是内置英文内容

#### Scenario: Cancel editing

- **WHEN** 用户在编辑模式中点击「取消」
- **THEN** 弹窗退出编辑模式，恢复显示原始内容（不保存任何更改）

### Requirement: Edited skills persist across extension restarts

系统 SHALL 在扩展启动时加载持久化的编辑状态，确保编辑后的技能内容在重启后保持生效。

#### Scenario: Edited skill persists after restart

- **WHEN** 用户编辑某个技能并保存后重新打开扩展面板
- **THEN** 技能列表中该技能显示为编辑后的名称
- **AND** 进入详情弹窗查看时显示编辑后的内容

### Requirement: Reset edited skill to built-in default per language

系统 SHALL 允许用户按当前语言版本重置已编辑的技能内容，其他语言版本的编辑不受影响。

#### Scenario: Reset current language version of an edited skill

- **WHEN** 用户在中文模式下点击已编辑技能的「重置」按钮
- **THEN** 该技能的中文版本编辑状态被清除
- **AND** 中文版技能恢复为内置默认名称、描述和提示内容
- **AND** 从 `chrome.storage.local` 的 `editedSkills.<id>.cn` 中移除编辑记录（但不影响 `.en` 的编辑记录）
- **AND** 技能列表和详情弹窗即时刷新显示内置中文内容
