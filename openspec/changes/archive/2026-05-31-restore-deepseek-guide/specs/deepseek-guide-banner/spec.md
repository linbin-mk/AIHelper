## ADDED Requirements

### Requirement: DeepSeek 引导横幅展示
设置面板中 MUST 在模型配置区域展示 DeepSeek 引导横幅，包含推荐使用 DeepSeek 的提示文案和快捷获取 API Key 的链接按钮。

#### Scenario: 中文环境下展示引导横幅
- **WHEN** 用户打开设置面板且当前语言为中文
- **THEN** 配置说明下方 SHALL 显示中文版的 DeepSeek 引导提示和「快捷获取APIkey →」按钮

#### Scenario: 英文环境下展示引导横幅
- **WHEN** 用户打开设置面板且当前语言为英文
- **THEN** 配置说明下方 SHALL 显示英文版的 DeepSeek 引导提示和「Get API Key →」按钮

### Requirement: 快捷获取 API Key 按钮点击行为
点击「快捷获取APIkey →」按钮 MUST 在新标签页中打开 DeepSeek 平台网站。

#### Scenario: 点击按钮打开 DeepSeek 平台
- **WHEN** 用户点击「快捷获取APIkey →」按钮
- **THEN** 浏览器 SHALL 在新标签页中打开 `https://platform.deepseek.com/`
