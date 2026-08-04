## MODIFIED Requirements

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

## ADDED Requirements

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
