## ADDED Requirements

### Requirement: CSS 变量主题 token 定义

系统 SHALL 在 `:root` 下定义暗色主题的 CSS 自定义属性，并在 `[data-theme="light"]` 下覆盖为亮色主题值。所有颜色 SHALL 使用 `--ctp-<name>` 命名规范。

#### Scenario: 暗色主题变量生效

- **WHEN** `<html>` 元素的 `data-theme` 属性为 `"dark"` 或未设置
- **THEN** 所有 CSS 变量 SHALL 使用 Catppuccin Mocha 调色板值（如 `--ctp-base: #1e1e2e`）

#### Scenario: 亮色主题变量生效

- **WHEN** `<html>` 元素的 `data-theme` 属性为 `"light"`
- **THEN** 所有 CSS 变量 SHALL 使用 Catppuccin Latte 调色板值（如 `--ctp-base: #eff1f5`）

#### Scenario: 覆盖的颜色 token 完整性

- **WHEN** 定义了暗色主题变量集
- **THEN** 亮色主题 SHALL 覆盖所有相同的变量名，不遗漏任何一个 token

### Requirement: panel.css 颜色 token 化

`panel.css` 中所有硬编码的十六进制颜色 SHALL 替换为对应的 CSS 变量引用（如 `var(--ctp-base)`），不再直接使用颜色值（除 `#fff` 部分可保留作为白色文字）。

#### Scenario: 暗色模式视觉一致

- **WHEN** 系统处于暗色模式
- **THEN** UI 的所有颜色 SHALL 与当前硬编码版本完全一致

#### Scenario: 亮色模式颜色正确

- **WHEN** 系统处于亮色模式
- **THEN** 页面背景、文字、边框、按钮等所有组件 SHALL 使用亮色调色板颜色，确保可读性

### Requirement: 主题偏好持久化

系统 SHALL 将用户的主题选择存储到 `chrome.storage.local`，key 为 `ai_helper_theme`，值为 `"dark"` 或 `"light"`。

#### Scenario: 保存主题偏好

- **WHEN** 用户切换主题
- **THEN** 新主题值 SHALL 写入 `chrome.storage.local` 的 `ai_helper_theme` key

#### Scenario: 读取主题偏好初始化

- **WHEN** 页面首次加载
- **THEN** 系统 SHALL 读取 `chrome.storage.local` 中的 `ai_helper_theme` 值
- **AND** 若不存在，默认使用 `"dark"`
- **AND** 将值应用到 `<html>` 的 `data-theme` 属性

#### Scenario: 主题偏好跨会话保持

- **WHEN** 用户选择亮色模式后重新打开 Panel
- **THEN** Panel SHALL 自动以亮色模式渲染
