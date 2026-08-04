## ADDED Requirements

### Requirement: 保存配置后自动检测连通性
系统 SHALL 在用户保存模型配置后，自动向配置的 API Base URL 发送连通性检测请求。检测结果在保存按钮下方展示（成功提示或错误详情），用户留在设置页。

#### Scenario: 连通性检测成功
- **WHEN** 用户填写完整配置并点击"保存配置"按钮
- **AND** 系统完成配置写入 chrome.storage.local
- **AND** 向 `{apiBaseUrl}/v1/models` 发送 GET 请求，携带 `Authorization: Bearer {apiKey}` 头，收到 2xx HTTP 状态码
- **THEN** 保存按钮显示"已保存"文案
- **AND** 按钮下方显示绿色"连接成功"提示
- **AND** 2 秒后按钮文案恢复为"保存配置"，下方提示消失
- **AND** 用户留在设置页，不跳转

#### Scenario: 连通性检测失败
- **WHEN** 用户填写完整配置并点击"保存配置"按钮
- **AND** 系统完成配置写入 chrome.storage.local
- **AND** 连通性检测请求返回非 2xx 状态码或网络错误
- **THEN** 保存按钮下方以红色展示错误信息（包含 HTTP 状态码和响应内容）
- **AND** 按钮文案保持"保存配置"不变
- **AND** 用户留在设置页

#### Scenario: 网络不可达
- **WHEN** 连通性检测请求因网络原因失败（fetch 抛出异常）
- **THEN** 保存按钮下方以红色展示"无法连接到服务商，请检查 API Base URL 和网络连接"
- **AND** 用户留在设置页

### Requirement: 连通性检测超时控制
系统 SHALL 为连通性检测请求设置 10 秒超时时间，超时视为检测失败。

#### Scenario: 检测请求超时
- **WHEN** 连通性检测请求在 10 秒内未收到响应
- **THEN** 保存按钮下方以红色展示"连接超时，请检查 API Base URL 是否正确"
