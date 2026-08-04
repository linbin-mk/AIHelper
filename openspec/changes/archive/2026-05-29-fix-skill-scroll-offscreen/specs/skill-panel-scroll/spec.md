## ADDED Requirements

### Requirement: 选中项自动滚动到可视区域

系统 SHALL 在技能选择面板中，当用户通过键盘（ArrowDown/ArrowUp）导航到某个技能项时，自动将该选中项滚动到面板的可视区域内，确保用户始终能看到当前选中的技能。

#### Scenario: 向下导航超出可视区域底部

- **WHEN** 用户多次按 ArrowDown 键，选中项索引超出面板可视区域底部
- **THEN** 面板自动向下滚动，使当前选中项完整显示在面板可视区域内

#### Scenario: 向上导航超出可视区域顶部

- **WHEN** 用户多次按 ArrowUp 键，选中项索引超出面板可视区域顶部
- **THEN** 面板自动向上滚动，使当前选中项完整显示在面板可视区域内

#### Scenario: 选中项已在可视区域内

- **WHEN** 用户按 ArrowDown 或 ArrowUp 键，且新选中的项已在面板可视区域内
- **THEN** 面板不进行额外滚动

#### Scenario: 无选中项时

- **WHEN** 面板显示但无选中项（slashSelectedIndex 为 -1）
- **THEN** 面板不进行任何滚动操作

## MODIFIED Requirements

### Requirement: 键盘导航不受鼠标悬停干扰

系统 SHALL 在技能选择面板的 `mouseenter` 事件处理中检查键盘活跃标志位（`slashKeyboardActive`），当键盘导航活跃时整体跳过鼠标悬停处理，不覆盖键盘选中的视觉高亮和选中索引。

#### Scenario: 键盘导航时鼠标悬停不干扰

- **WHEN** 用户通过 ArrowDown 或 ArrowUp 导航技能项，且鼠标光标同时位于面板上方
- **THEN** `mouseenter` 事件不修改面板背景高亮，也不修改 `slashSelectedIndex`

#### Scenario: 键盘导航后鼠标移动恢复交互

- **WHEN** 用户使用键盘导航后移动鼠标
- **THEN** `mousemove` 事件重置键盘活跃标志，后续鼠标悬停恢复正常交互

#### Scenario: 键盘导航后点击恢复交互

- **WHEN** 用户使用键盘导航后点击某个技能项
- **THEN** 点击事件重置键盘活跃标志并通过 `data-skill-id` 选中对应技能
