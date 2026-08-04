## ADDED Requirements

### Requirement: 双栏主布局
聊天面板 SHALL 采用左侧侧边栏 + 右侧聊天主区的双栏布局，替代当前的单栏全宽设计。

#### Scenario: 桌面端默认布局
- **WHEN** 用户打开 AI 聊天 Tab
- **THEN** 左侧显示侧边栏（宽度 260px）
- **AND** 右侧显示聊天主区，占据剩余宽度
- **AND** 侧边栏顶部显示「新建会话」按钮和搜索框

#### Scenario: Tab 切换保持布局
- **WHEN** 用户从其他 Tab 切换回 AI 聊天 Tab
- **THEN** 侧边栏和聊天主区布局保持不变
- **AND** 当前活跃会话的消息完好保留

### Requirement: 侧边栏折叠
系统 SHALL 支持通过侧边栏工具栏中的折叠按钮和胶囊按钮两种方式控制侧边栏折叠/展开。

#### Scenario: 通过侧边栏工具栏折叠
- **WHEN** 用户在侧边栏展开状态下点击 `.sidebar-toolbar__collapse-btn`
- **THEN** 侧边栏收起（`display: none`）
- **AND** 胶囊浮动按钮在侧边栏原位置出现
- **AND** 折叠状态持久化

#### Scenario: 通过胶囊按钮展开
- **WHEN** 用户在侧边栏收起状态下点击胶囊中的展开按钮
- **THEN** 侧边栏恢复展开（`display: flex`）
- **AND** 胶囊浮动按钮隐藏
- **AND** 折叠状态持久化更新

### Requirement: 侧边栏结构
侧边栏 SHALL 从上到下包含以下区域：侧边栏工具栏（品牌名 + 搜索按钮 + 折叠按钮）、新建会话按钮 + 搜索框、会话时间分组列表、底部用户区域。

#### Scenario: 侧边栏组件层级
- **WHEN** 侧边栏渲染完成
- **THEN** 最顶部显示 `.chat-sidebar__toolbar` 区域，包含 "AIHelper" 文字 + 搜索放大镜按钮 + 折叠按钮
- **AND** 工具栏高度与 `chat-main__toolbar` 对齐（约 46px）
- **AND** 工具栏下方显示「+ 新建会话」按钮和搜索框（原 `chat-sidebar__header`）
- **AND** 中部显示按时间分组的会话列表
- **AND** 底部显示模型名称信息

#### Scenario: 工具栏仅在展开时可见
- **WHEN** 侧边栏收起（`chat-sidebar--collapsed`）
- **THEN** `.chat-sidebar__toolbar` 随侧边栏一同隐藏（`display: none`）

### Requirement: 移动端适配
在 Chrome Side Panel 宽度较窄时（< 400px），侧边栏 SHALL 默认隐藏，通过按钮切换显示。

#### Scenario: 窄面板默认隐藏侧边栏
- **WHEN** Side Panel 宽度 < 400px
- **THEN** 侧边栏默认隐藏，聊天主区占满全宽
- **AND** 顶部工具栏显示切换按钮，点击后以覆盖层形式展开侧边栏

#### Scenario: 覆盖层关闭
- **WHEN** 侧边栏以覆盖层形式展开
- **THEN** 点击聊天主区或会话列表中的会话后覆盖层自动关闭
