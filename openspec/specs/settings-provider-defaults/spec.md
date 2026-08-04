## Purpose

定义设置页"大模型"配置模块的默认值和引导行为的规范。
## Requirements
### Requirement: 供应商模块默认值预填充
系统 SHALL 在首次加载设置页（无已保存配置）时自动将 API Base URL 预填为 `https://api.deepseek.com`，Model Name 预填为 `deepseek-v4-flash`。

#### Scenario: 用户首次打开设置页
- **WHEN** 用户首次打开设置页且 `ai_helper_model_config` 存储键不存在
- **THEN** API Base URL 输入框显示 `https://api.deepseek.com`
- **AND** Model Name 输入框显示 `deepseek-v4-flash`
- **AND** API Key 输入框为空

#### Scenario: 用户已有已保存配置
- **WHEN** 用户打开设置页且 `ai_helper_model_config` 存储键存在有效配置
- **THEN** 各输入框显示已保存的配置值（API Key 例外，出于安全考虑不显示）

### Requirement: DeepSeek 引导文案
系统 SHALL 在模型配置引导区域追加文案，说明本项目从想法到落地不到10天全流程使用 DeepSeek，鼓励用户使用 DeepSeek API 体验。

#### Scenario: 引导文案显示
- **WHEN** 用户查看设置页供应商模块
- **THEN** 在"请输入大模型 API 的连接信息，支持 OpenAI 兼容协议"之后追加显示 DeepSeek 推荐文案

### Requirement: 快捷获取 API Key 按钮
系统 SHALL 在引导区域提供一个"快捷获取APIkey"按钮，点击后在新标签页打开 `https://platform.deepseek.com/`。

#### Scenario: 点击快捷获取按钮
- **WHEN** 用户点击"快捷获取APIkey"按钮
- **THEN** 浏览器在新标签页中打开 `https://platform.deepseek.com/`

#### Scenario: 按钮与引导文案在同行显示
- **WHEN** 引导文案和快捷按钮同时存在
- **THEN** 按钮内联显示在引导文案之后，视觉上不换行

### Requirement: "大模型"导航标签
系统 SHALL 将设置页导航中显示"大模型"（英文 "Model"）作为模型配置区域的标签。

#### Scenario: 中文环境下显示"大模型"
- **WHEN** 用户语言设置为中文
- **AND** 用户查看设置页导航
- **THEN** 第一个导航项显示为"大模型"

#### Scenario: 英文环境下显示"Model"
- **WHEN** 用户语言设置为英文
- **AND** 用户查看设置页导航
- **THEN** 第一个导航项显示为"Model"

