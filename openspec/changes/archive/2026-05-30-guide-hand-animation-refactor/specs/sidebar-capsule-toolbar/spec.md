## MODIFIED Requirements

### Requirement: 胶囊按钮交互
胶囊中的每个图标按钮 SHALL 执行对应的功能操作。

#### Scenario: 点击展开侧边栏按钮
- **WHEN** 用户点击胶囊中的侧边栏图标按钮
- **THEN** 侧边栏展开，胶囊隐藏
- **AND** 侧边栏内工具栏正常显示
- **AND** 折叠状态持久化更新

#### Scenario: 点击搜索按钮
- **WHEN** 用户点击胶囊中的搜索图标按钮
- **THEN** 侧边栏自动展开，胶囊隐藏
- **AND** 侧边栏搜索输入框自动聚焦
- **AND** 搜索输入框右侧出现向左手指（👈）引导动画，左右弹跳 3 秒后消失

#### Scenario: 点击新建会话按钮
- **WHEN** 用户点击胶囊中的添加图标按钮
- **THEN** 侧边栏自动展开，胶囊隐藏
- **AND** 系统执行新建会话操作（`createNewSessionAndShow()`）
- **AND** 聊天区切换为欢迎页

## REMOVED Requirements

### Requirement: 搜索框颜色闪烁动画
**Reason**: 替换为更醒目的手指引导动画（`guide-hand-animation`）
**Migration**: 所有搜索触发场景统一使用 `showSearchGuide()` 替代 CSS 闪烁
