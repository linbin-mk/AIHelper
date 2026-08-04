## ADDED Requirements

### Requirement: 技能分类翻译键

系统 SHALL 在 `i18n.js` 翻译映射表中 `skills` 层级下增加 `categories` 子对象，为每个技能分类提供中英翻译。分类键 SHALL 为英文标识符（`Business`、`Product`、`Development`、`Testing`、`Other`），中文值 SHALL 为对应的中文分类名，英文值 SHALL 与原键保持一致。

#### Scenario: 分类翻译键定义

- **WHEN** `i18n.js` 被加载
- **THEN** `window.__i18nMessages['zh-CN'].skills.categories` SHALL 包含 `{ Business: '业务', Product: '产品', Development: '开发', Testing: '测试', Other: '其他' }`
- **AND** `window.__i18nMessages['en'].skills.categories` SHALL 包含 `{ Business: 'Business', Product: 'Product', Development: 'Development', Testing: 'Testing', Other: 'Other' }`

#### Scenario: 通过 t() 获取分类中文翻译

- **WHEN** 当前语言为 `zh-CN` 且调用 `t('skills.categories.Development')`
- **THEN** 函数 SHALL 返回 `开发`

#### Scenario: 通过 t() 获取分类英文翻译

- **WHEN** 当前语言为 `en` 且调用 `t('skills.categories.Development')`
- **THEN** 函数 SHALL 返回 `Development`

#### Scenario: 未知分类降级

- **WHEN** 调用 `t('skills.categories.UnknownCat')` 但该键不存在
- **THEN** 函数 SHALL 返回 `UnknownCat`（按缺失键降级规则显示原始键名）
