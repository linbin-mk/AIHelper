## ADDED Requirements

### Requirement: 聊天记录持久化

系统 SHALL 将聊天消息持久化到 chrome.storage.local。

#### Scenario: 页面刷新后恢复聊天记录
- **WHEN** 用户刷新 Side Panel（如关闭后重新打开）
- **THEN** 系统从 chrome.storage.local 加载并展示之前的聊天记录

#### Scenario: 自动保存新消息
- **WHEN** 聊天区域新增一条消息（用户或 AI）
- **THEN** 系统自动将更新后的消息列表写入 chrome.storage.local

### Requirement: 聊天记录数量限制

系统 SHALL 将持久化的聊天消息数量限制为最近 200 条。

#### Scenario: 消息数超过限制
- **WHEN** 聊天消息总数超过 200 条
- **THEN** 系统自动移除最早的消息，仅保留最近 200 条

### Requirement: 清空聊天记录

系统 SHALL 提供清空聊天记录的按钮。

#### Scenario: 清空聊天记录
- **WHEN** 用户点击清空聊天记录按钮
- **THEN** 系统清除聊天区域的显示内容
- **AND** 系统清除 chrome.storage.local 中的聊天记录数据
- **AND** 聊天区域显示空状态提示"开始和 AI 聊聊吧"

### Requirement: 清空确认

系统 SHALL 在清空聊天记录前请求用户确认。

#### Scenario: 确认清空
- **WHEN** 用户点击清空按钮
- **THEN** 系统展示确认对话框"确定要清空所有聊天记录吗？"
- **WHEN** 用户确认
- **THEN** 系统执行清空操作
- **WHEN** 用户取消
- **THEN** 系统保持聊天记录不变
