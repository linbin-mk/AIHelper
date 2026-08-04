## ADDED Requirements

### Requirement: 主题切换按钮可见性

系统 SHALL 在 Panel Header 的 Tab 栏（`.tab-bar`）内部最左侧渲染一个主题切换按钮，位置在 "AI 聊天" Tab 按钮之前。

#### Scenario: 按钮位置

- **WHEN** 页面加载完成
- **THEN** `.tab-bar` 内第一个子元素 SHALL 为主题切换按钮

#### Scenario: 暗色模式下的按钮图标

- **WHEN** 当前主题为暗色模式
- **THEN** 按钮 SHALL 显示月亮图标（🌙），提示文字为 "切换到亮色模式"

#### Scenario: 亮色模式下的按钮图标

- **WHEN** 当前主题为亮色模式
- **THEN** 按钮 SHALL 显示太阳图标（☀️），提示文字为 "切换到暗色模式"

### Requirement: 主题切换交互

点击主题切换按钮 SHALL 切换当前主题模式并立即更新 UI。

#### Scenario: 从暗色切换到亮色

- **WHEN** 当前为暗色模式且用户点击主题切换按钮
- **THEN** 系统 SHALL 将 `<html>` 的 `data-theme` 属性设为 `"light"`
- **AND** UI SHALL 立即渲染为亮色主题
- **AND** 按钮图标 SHALL 变为太阳图标
- **AND** 主题偏好 SHALL 持久化到 storage

#### Scenario: 从亮色切换到暗色

- **WHEN** 当前为亮色模式且用户点击主题切换按钮
- **THEN** 系统 SHALL 将 `<html>` 的 `data-theme` 属性设为 `"dark"`
- **AND** UI SHALL 立即渲染为暗色主题
- **AND** 按钮图标 SHALL 变为月亮图标
- **AND** 主题偏好 SHALL 持久化到 storage

### Requirement: 按钮样式

主题切换按钮 SHALL 与 Tab 按钮（`.tab-btn`）视觉风格一致，无背景、无边框、小尺寸。

#### Scenario: 按钮基础样式

- **WHEN** 页面加载完成
- **THEN** 按钮 SHALL 为透明背景、无边框、16px 字号、圆角、cursor: pointer

#### Scenario: 按钮悬停效果

- **WHEN** 用户鼠标悬停在按钮上
- **THEN** 按钮背景色 SHALL 变为 `--ctp-surface0`（与 Tab 按钮 active 态一致）
