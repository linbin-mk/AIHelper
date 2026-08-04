## MODIFIED Requirements

### Requirement: 手动创建会话
系统 SHALL 支持用户通过侧边栏「+ 新建会话」按钮清空聊天区并取消当前会话选中，不创建存储记录，并同步清空持久化的活跃会话 ID。

#### Scenario: 点击新建会话按钮
- **WHEN** 用户点击侧边栏顶部的「+ 新建会话」按钮
- **THEN** 聊天区切换为欢迎页状态
- **AND** 当前活跃会话取消选中（侧边栏取消高亮）
- **AND** `SessionManager.getActiveSessionId()` 返回 `null`
- **AND** 输入框清空，等待用户输入
- **AND** 不在 storage 中创建新会话，侧边栏不新增卡片

### Requirement: 会话持久化
系统 SHALL 将所有会话及其消息持久化到 chrome.storage.local，支持页面刷新后完整恢复。

#### Scenario: 刷新后恢复（有活跃会话）
- **WHEN** 用户刷新页面或重新打开插件，且存在活跃会话 ID
- **THEN** 侧边栏完整恢复所有会话列表和时间分组
- **AND** 该活跃会话自动选中并恢复其消息历史
- **AND** 所有会话的标题、消息、创建时间完整保留

#### Scenario: 刷新后恢复（无活跃会话）
- **WHEN** 用户刷新页面或重新打开插件，且活跃会话 ID 为 `null`
- **THEN** 侧边栏完整恢复所有会话列表和时间分组
- **AND** 聊天区展示欢迎页
- **AND** 无会话被选中（侧边栏不显示高亮）

## ADDED Requirements

<!-- 无需新增需求，仅修改现有需求的规格行为 -->
