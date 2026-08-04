# model-config-card Specification

## Purpose
定义模型配置信息卡片视图的行为规范，包括卡片展示、联通状态显示、刷新检测和编辑入口。

## ADDED Requirements

### Requirement: 保存+联通成功后展示卡片
系统 SHALL 仅在表单验证通过、联通性检测成功、且配置写入 chrome.storage.local 之后，才隐藏编辑表单并展示模型配置信息卡片。联通检测失败时，系统 SHALL 保持在编辑表单并展示错误信息，不写入存储。

#### Scenario: 保存配置且联通正常
- **WHEN** 用户填写完整配置并点击"保存配置"按钮
- **AND** 表单验证通过
- **AND** 连通性检测返回成功
- **AND** 系统完成配置写入 chrome.storage.local
- **THEN** 编辑表单隐藏
- **AND** 卡片区域展示（浅绿色背景）
- **AND** 卡片显示 API Base URL 和 Model Name
- **AND** 卡片状态区域显示绿色"● 已连接"文字

#### Scenario: 保存配置但联通失败
- **WHEN** 用户填写完整配置并点击"保存配置"按钮
- **AND** 连通性检测返回失败
- **THEN** 保持在编辑表单模式
- **AND** 不写入 chrome.storage.local
- **AND** 表单下方展示红色错误信息（沿用现有 showSaveError 行为）
- **AND** 不展示卡片

#### Scenario: 编辑模式下保存且联通正常
- **WHEN** 用户在编辑模式下修改配置并点击保存
- **AND** 连通性检测返回成功
- **AND** 系统完成配置写入 chrome.storage.local
- **THEN** 编辑表单隐藏
- **AND** 卡片区域展示浅绿色卡片并更新为最新配置

#### Scenario: 编辑模式下保存但联通失败
- **WHEN** 用户在编辑模式下修改配置并点击保存
- **AND** 连通性检测返回失败
- **THEN** 保持在编辑表单模式
- **AND** 不写入 chrome.storage.local
- **AND** 表单下方展示红色错误信息
- **AND** 不展示卡片

### Requirement: 卡片刷新按钮
系统 SHALL 在卡片右上方提供刷新按钮，点击后重新执行连通性检测并更新卡片状态颜色。刷新不涉及存储写入。

#### Scenario: 点击刷新后联通成功
- **WHEN** 用户点击卡片右上角刷新按钮
- **AND** 连通性检测返回成功
- **THEN** 卡片背景变为浅绿色
- **AND** 状态文字变为绿色"● 已连接"

#### Scenario: 点击刷新后联通失败
- **WHEN** 用户点击卡片右上角刷新按钮
- **AND** 连通性检测返回失败
- **THEN** 卡片背景变为浅红色
- **AND** 状态文字变为红色"● 连接失败"

#### Scenario: 刷新期间显示加载状态
- **WHEN** 用户点击刷新按钮
- **AND** 连通性检测正在执行中
- **THEN** 刷新按钮显示加载状态（禁用或旋转图标），防止重复点击

### Requirement: 卡片编辑按钮
系统 SHALL 在卡片右下方提供编辑按钮，点击后隐藏卡片并展示编辑表单，表单预填当前已保存的配置值。

#### Scenario: 点击编辑进入编辑模式
- **WHEN** 用户点击卡片右下角编辑按钮
- **THEN** 卡片区域隐藏
- **AND** 编辑表单展示
- **AND** 表单字段预填当前已保存的配置值（API Base URL、Model Name；API Key 不回显）

### Requirement: 已配置用户进入设置页展示卡片
系统 SHALL 在用户打开设置页时，若 chrome.storage.local 中已存在模型配置，默认展示卡片模式，并自动执行连通性检测来更新卡片颜色。

#### Scenario: 已配置用户首次进入设置页
- **WHEN** 用户打开设置页
- **AND** chrome.storage.local 中存在 `ai_helper_model_config`
- **THEN** 直接展示卡片模式（不展示表单）
- **AND** 自动执行一次连通性检测
- **AND** 根据检测结果显示绿色或红色卡片

#### Scenario: 未配置用户进入设置页
- **WHEN** 用户打开设置页
- **AND** chrome.storage.local 中不存在 `ai_helper_model_config`
- **THEN** 展示编辑表单
- **AND** 不展示卡片
