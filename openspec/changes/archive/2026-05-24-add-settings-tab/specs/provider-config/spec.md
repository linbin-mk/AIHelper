## ADDED Requirements

### Requirement: Provider Configuration Form
系统 SHALL 在「设置 → 供应商」子页面中展示模型供应商配置表单，包含 API Base URL、API Key、Model Name、Model Type 四个字段，功能与原有模型配置页面完全一致。

#### Scenario: Provider config form loads saved values
- **WHEN** 用户进入「设置 → 供应商」子页面
- **THEN** 表单各字段自动填充已保存的配置值（API Key 出于安全考虑不显示）

#### Scenario: Provider config form validation
- **WHEN** 用户填写配置并点击保存
- **THEN** 系统对 API Base URL 格式、API Key 必填、Model Name 必填进行校验，校验不通过则显示对应错误提示

#### Scenario: Provider config save success
- **WHEN** 用户填写完整有效配置并点击保存
- **THEN** 配置保存到 chrome.storage.local，提示保存成功并可继续使用 AI 聊天

### Requirement: Remove Config Entry from Chat Toolbar
系统 SHALL 从「AI 聊天」页面的工具栏中移除 ⚙️ 配置按钮，用户通过「设置」Tab 访问配置。

#### Scenario: Chat toolbar no longer shows config button
- **WHEN** 用户进入「AI 聊天」Tab
- **THEN** 工具栏不再显示 ⚙️ 配置按钮

### Requirement: Config Check Redirects to Settings
当用户未配置模型就尝试使用 AI 聊天时，系统 SHALL 自动跳转到「设置」Tab 而非原来隐藏的配置页面。

#### Scenario: Unconfigured user opens AI chat
- **WHEN** 用户首次使用且未配置模型
- **THEN** 系统自动切换到「设置」Tab 的「供应商」子页面
