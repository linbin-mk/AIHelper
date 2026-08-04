## MODIFIED Requirements

### Requirement: 聊天区布局适配双栏结构
聊天区 SHALL 从当前的全宽单栏布局改为右侧面板布局，左侧为会话侧边栏。

#### Scenario: 聊天区在双栏布局中
- **WHEN** 用户打开 AI 聊天 Tab
- **THEN** 聊天区（消息列表 + 输入框）占据右侧主区域
- **AND** 左侧为会话侧边栏
- **AND** 消息输入框始终固定在聊天区底部

#### Scenario: 侧边栏折叠时聊天区扩展
- **WHEN** 侧边栏折叠为图标模式
- **THEN** 聊天区宽度自动扩展填充可用空间

## REMOVED Requirements

### Requirement: 清空按钮
**Reason**: 清空功能已完全移除，无替代方案。用户可删除会话后新建来实现类似效果。
**Migration**: 点击侧边栏会话三点菜单 → 「删除」，确认后新建会话

### Requirement: 导出日志按钮
**Reason**: 导出功能移至侧边栏会话卡片的右键菜单，属于会话级别的操作而非全局操作
**Migration**: 用户通过右键点击会话卡片 → 「导出日志」来导出特定会话的日志

## ADDED Requirements

### Requirement: 工具栏简化
聊天区顶部工具栏 SHALL 移除「清空」按钮，仅保留侧边栏切换按钮和当前会话信息；「导出日志」移至侧边栏右键菜单。

#### Scenario: 简化后的工具栏
- **WHEN** 用户打开 AI 聊天 Tab
- **THEN** 顶部工具栏仅显示侧边栏切换按钮和当前活跃会话标题
- **AND** 不显示「清空」和「导出日志」按钮
