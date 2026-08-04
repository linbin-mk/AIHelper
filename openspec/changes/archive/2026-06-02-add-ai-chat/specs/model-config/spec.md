## ADDED Requirements

### Requirement: 模型配置入口

系统 SHALL 在 AI 聊天页面提供模型配置入口（齿轮图标按钮或"设置"链接），用户可点击进入配置页面。

#### Scenario: 打开配置页面
- **WHEN** 用户在 AI 聊天页面点击配置入口
- **THEN** 系统展示模型配置表单

#### Scenario: 返回聊天页面
- **WHEN** 用户在配置页面点击返回按钮
- **THEN** 系统返回 AI 聊天页面

### Requirement: 模型配置项

系统 SHALL 提供以下配置项供用户填写：

- **API Base URL**（必填）：大模型 API 的基础地址，如 `https://api.deepseek.com`
- **API Key**（必填）：用于认证的 API 密钥，输入框为密码类型（masked）
- **Model Name**（必填）：模型名称，如 `deepseek-v4-flash`、`deepseek-chat`
- **Model Type**（选填）：模型类型标识，用于识别不同厂商（默认值 `deepseek-v4-flash`）

#### Scenario: 首次使用未配置
- **WHEN** 用户首次打开 AI 聊天 Tab 且未配置任何参数
- **THEN** 系统展示模型配置表单，提示用户完成配置后才能开始聊天

#### Scenario: 已有配置时查看
- **WHEN** 用户已配置模型参数并打开配置页面
- **THEN** 系统预填已保存的配置值（API Key 除外，出于安全考虑仅显示占位符）

#### Scenario: 保存配置
- **WHEN** 用户填写完整的配置项并点击保存
- **THEN** 系统将配置持久化到 chrome.storage.local，键名为 `ai_helper_model_config`

#### Scenario: 配置项校验
- **WHEN** 用户提交配置时 API Base URL 或 Model Name 为空
- **THEN** 系统在对应字段旁显示错误提示"此项为必填"
- **WHEN** 用户提交配置时 API Key 为空
- **THEN** 系统在对应字段旁显示错误提示"API Key 为必填"

#### Scenario: URL 格式校验
- **WHEN** 用户输入的 API Base URL 格式不正确（不是有效的 HTTP/HTTPS URL）
- **THEN** 系统提示"请输入有效的 API 地址，以 http:// 或 https:// 开头"

### Requirement: API Key 安全存储

系统 SHALL 将 API Key 以明文形式存储在 chrome.storage.local 中，并在配置页面展示安全提示。

#### Scenario: 安全提示展示
- **WHEN** 用户查看或编辑 API Key 配置
- **THEN** 系统在 API Key 输入框下方展示提示文本"API Key 仅存储在本地，不会上传到任何服务器"

#### Scenario: 查看已保存的 Key
- **WHEN** 用户进入配置页面且已有保存的 API Key
- **THEN** API Key 输入框显示为 placeholder "已保存（出于安全考虑不显示）"，用户重新输入后会覆盖旧值
