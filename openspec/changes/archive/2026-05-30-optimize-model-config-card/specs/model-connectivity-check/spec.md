# model-connectivity-check Delta Specification

## MODIFIED Requirements

### Requirement: 保存配置后自动检测连通性
系统 SHALL 在用户保存模型配置时先执行表单验证，再执行连通性检测。仅当连通性检测成功后，系统才将配置写入 chrome.storage.local 并切换为模型配置信息卡片展示。联通检测失败时，系统保持在编辑表单并展示错误信息，不写入存储，用户留在设置页。

#### Scenario: 连通性检测成功
- **WHEN** 用户填写完整配置并点击"保存配置"按钮
- **AND** 表单验证通过
- **AND** 向 `{apiBaseUrl}/v1/models` 发送 GET 请求，携带 `Authorization: Bearer {apiKey}` 头，收到 2xx HTTP 状态码
- **THEN** 系统将配置写入 chrome.storage.local
- **AND** 编辑表单隐藏，展示浅绿色模型配置信息卡片
- **AND** 卡片显示 API Base URL、Model Name 和绿色"● 已连接"状态
- **AND** 用户留在设置页，不跳转

#### Scenario: 连通性检测失败
- **WHEN** 用户填写完整配置并点击"保存配置"按钮
- **AND** 连通性检测请求返回非 2xx 状态码
- **THEN** 不写入 chrome.storage.local
- **AND** 保持在编辑表单模式
- **AND** 表单下方以红色展示错误信息（包含 HTTP 状态码和响应内容）
- **AND** 用户留在设置页

#### Scenario: 网络不可达
- **WHEN** 连通性检测请求因网络原因失败（fetch 抛出异常）
- **THEN** 不写入 chrome.storage.local
- **AND** 保持在编辑表单模式
- **AND** 表单下方以红色展示"无法连接到服务商，请检查 API Base URL 和网络连接"
- **AND** 用户留在设置页

#### Scenario: 检测请求超时
- **WHEN** 连通性检测请求在 10 秒内未收到响应
- **THEN** 不写入 chrome.storage.local
- **AND** 保持在编辑表单模式
- **AND** 表单下方以红色展示"连接超时，请检查 API Base URL 是否正确"
- **AND** 用户留在设置页

#### Scenario: 表单验证失败
- **WHEN** 用户点击保存但表单验证未通过
- **THEN** 不执行联通性检测
- **AND** 不写入 chrome.storage.local
- **AND** 保持在编辑表单模式
- **AND** 对应字段显示红色错误提示

#### Scenario: 编辑模式下保存成功且联通正常
- **WHEN** 用户在卡片编辑模式下修改配置并保存
- **AND** 表单验证通过
- **AND** 连通性检测返回成功
- **THEN** 系统将配置写入 chrome.storage.local
- **AND** 隐藏表单，展示浅绿色模型配置信息卡片

#### Scenario: 编辑模式下保存但联通失败
- **WHEN** 用户在卡片编辑模式下修改配置并保存
- **AND** 连通性检测返回失败
- **THEN** 不写入 chrome.storage.local
- **AND** 保持在编辑表单模式
- **AND** 表单下方展示红色错误信息

## ADDED Requirements

### Requirement: 卡片刷新联通性检测
系统 SHALL 在卡片模式提供刷新按钮，点击后复用连通性检测逻辑，仅更新卡片颜色和状态文字，不涉及存储写入。

#### Scenario: 刷新检测成功
- **WHEN** 用户点击卡片右上角刷新按钮
- **AND** 连通性检测返回成功
- **THEN** 卡片变为浅绿色，状态显示绿色"● 已连接"

#### Scenario: 刷新检测失败
- **WHEN** 用户点击卡片右上角刷新按钮
- **AND** 连通性检测返回失败（非 2xx、网络不可达或超时）
- **THEN** 卡片变为浅红色，状态显示红色"● 连接失败"
