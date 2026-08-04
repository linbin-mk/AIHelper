## ADDED Requirements

### Requirement: 胶囊形态浮动按钮
侧边栏处于收起状态时，系统 SHALL 在聊天面板左上角显示一个胶囊形态（border-radius: 100px）的浮动按钮组，作为侧边栏操作的替代入口。胶囊按钮仅在侧边栏收起时可见，侧边栏展开时隐藏。

#### Scenario: 侧边栏收起时显示胶囊
- **WHEN** 用户将侧边栏收起（`chat-sidebar--collapsed` 生效）
- **THEN** 胶囊浮动按钮组在侧边栏原位置左上方出现
- **AND** 胶囊使用 `display: block` 可见，`position: absolute` 定位
- **AND** 胶囊包含 3 个圆形图标按钮：展开侧边栏、搜索、新建会话

#### Scenario: 侧边栏展开时隐藏胶囊
- **WHEN** 用户将侧边栏展开（移除 `chat-sidebar--collapsed`）
- **THEN** 胶囊浮动按钮组隐藏（`display: none`）
- **AND** 侧边栏内工具栏（`chat-sidebar__toolbar`）正常展示

#### Scenario: 胶囊样式与 DeepSeek 设计一致
- **WHEN** 胶囊按钮组渲染
- **THEN** 胶囊外层容器采用 `border-radius: 100px` 圆角、浅色背景（`--ctp-mantle`）、边框（`--ctp-surface0`）、投影
- **AND** 内部按钮为 34×34px 方形，圆形边角（8px）、透明背景、hover 时显示浅色底色
- **AND** 按钮内 SVG 图标 16×16px，颜色使用 `--ctp-subtext0`
- **AND** 按钮 hover 时显示 `--ctp-surface0` 背景过渡动画（0.2s ease）

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
- **AND** 搜索输入框执行颜色闪烁动画（3 次）

#### Scenario: 点击新建会话按钮
- **WHEN** 用户点击胶囊中的添加图标按钮
- **THEN** 侧边栏自动展开，胶囊隐藏
- **AND** 系统执行新建会话操作（`createNewSessionAndShow()`）
- **AND** 聊天区切换为欢迎页

### Requirement: 搜索框颜色闪烁动画
当搜索按钮触发时，搜索输入框 SHALL 执行 3 次边框颜色闪烁动画，引导用户注意到搜索框。

#### Scenario: 闪烁动画执行
- **WHEN** 系统触发搜索框闪烁
- **THEN** 搜索输入框边框在主题色（`--ctp-blue`）和默认色之间切换 3 次
- **AND** 每次闪烁周期为 0.4 秒（总计约 1.2 秒）
- **AND** 动画结束后搜索输入框恢复默认样式
- **AND** 闪烁期间搜索输入框获得焦点
