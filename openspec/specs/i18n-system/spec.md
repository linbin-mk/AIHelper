## ADDED Requirements

### Requirement: 翻译消息 bundle 定义

系统 SHALL 在 `i18n.js` 中以嵌套对象形式定义翻译映射表，支持 `zh-CN` 和 `en` 两种语言。翻译键 SHALL 使用 `.` 分隔的层级结构（如 `tabs.chat`、`settings.basic.title`）。每个语言键 SHALL 对应其翻译值，英文值 SHALL 覆盖所有中文键。

#### Scenario: 中英文 bundle 完整性

- **WHEN** `i18n.js` 被加载
- **THEN** 全局变量 `window.__i18nMessages` SHALL 包含 `zh-CN` 和 `en` 两个顶级键
- **AND** `zh-CN` 下的所有叶子键 SHALL 在 `en` 下存在对应翻译

#### Scenario: 翻译键层级访问

- **WHEN** 代码调用 `t('tabs.chat')`
- **THEN** 系统 SHALL 从嵌套对象 `messages[lang].tabs.chat` 中获取翻译值

### Requirement: 翻译函数 t() API

系统 SHALL 提供全局翻译函数 `window.t(key, params?)`，参数 `key` 为翻译键字符串，可选 `params` 为插值参数对象。当键不存在时 SHALL 返回键名本身作为降级处理。

#### Scenario: 简单翻译查询

- **WHEN** 当前语言为 `zh-CN` 且调用 `t('settings.basic.title')`
- **THEN** 函数 SHALL 返回中文翻译值 `"🔧 基础配置"`

#### Scenario: 英文翻译查询

- **WHEN** 当前语言为 `en` 且调用 `t('settings.basic.title')`
- **THEN** 函数 SHALL 返回英文翻译值（如 `"Basic Settings"`）

#### Scenario: 缺失键降级

- **WHEN** 调用 `t('nonexistent.key')` 但键不存在
- **THEN** 函数 SHALL 返回字符串 `"nonexistent.key"`

#### Scenario: 带插值参数翻译

- **WHEN** 当前语言为 `en` 且调用 `t('request.count', { n: 5 })`
- **AND** `en` 映射中该键值为 `"{{n}} requests captured"`
- **THEN** 函数 SHALL 返回 `"5 requests captured"`

### Requirement: 语言偏好持久化

系统 SHALL 将用户选择的语言存储到 `chrome.storage.local`，key 为 `ai_helper_language`，默认值为 `en`。页面加载时 SHALL 读取存储值并应用到全局语言状态。

#### Scenario: 默认语言为英文

- **WHEN** 用户首次使用且 storage 中无 `ai_helper_language` 值
- **THEN** 系统 SHALL 使用 `en` 作为当前语言

#### Scenario: 保存语言偏好

- **WHEN** 用户切换语言
- **THEN** 新语言值 SHALL 写入 `chrome.storage.local` 的 `ai_helper_language` key

#### Scenario: 跨会话语言保持

- **WHEN** 用户选择 `en` 后重新打开 Panel
- **THEN** Panel SHALL 自动以英文渲染

### Requirement: 动态 UI 语言刷新

系统 SHALL 提供 `updatePageLanguage()` 函数，调用时 SHALL 遍历所有含 `data-i18n` 属性的 DOM 元素并更新其 `textContent`，同时更新 `<html>` 元素的 `lang` 属性。含 `data-i18n-placeholder` 属性的元素 SHALL 更新其 `placeholder` 属性。

#### Scenario: 静态文本刷新

- **WHEN** 调用 `updatePageLanguage()` 后
- **AND** 当前语言为 `en`
- **THEN** 所有 `[data-i18n]` 元素的 `textContent` SHALL 更新为英文翻译值

#### Scenario: placeholder 属性刷新

- **WHEN** 调用 `updatePageLanguage()` 后
- **AND** 当前语言为 `en`
- **THEN** 所有 `[data-i18n-placeholder]` 元素的 `placeholder` 属性 SHALL 更新为英文翻译值

#### Scenario: lang 属性同步

- **WHEN** 调用 `updatePageLanguage()` 后
- **AND** 当前语言为 `en`
- **THEN** `<html>` 元素的 `lang` 属性 SHALL 设为 `"en"`

#### Scenario: 动态 JS 文本刷新

- **WHEN** 语言切换后
- **AND** JS 代码中通过 `t()` 调用生成 UI 文本（如错误提示、状态消息）
- **THEN** 这些文本 SHALL 在重新渲染时自动使用新语言的翻译值

### Requirement: 语言选择器 UI 控件

系统 SHALL 在"基础配置"面板（`#settings-basic`）中渲染一个语言选择下拉菜单，位于调试模式开关之后、黑夜模式开关之前。下拉菜单 SHALL 列出 `zh-CN`（中文）和 `en`（English）两个选项，默认选中当前语言。

#### Scenario: 语言选择器位置

- **WHEN** 页面加载完成
- **THEN** `#settings-basic` 页面内 SHALL 存在 `#languageSelect` 下拉菜单元素

#### Scenario: 选项列表

- **WHEN** 用户打开语言下拉菜单
- **THEN** SHALL 显示两个选项：`zh-CN` 显示为"中文"，`en` 显示为"English"

#### Scenario: 默认选中当前语言

- **WHEN** 页面加载且存储中语言为 `en`
- **THEN** 下拉菜单 SHALL 默认选中 `en` 选项

#### Scenario: 切换语言触发刷新

- **WHEN** 用户在下拉菜单中选择 `en`
- **THEN** 系统 SHALL 保存语言偏好到 storage
- **AND** SHALL 调用 `updatePageLanguage()` 即时刷新页面所有文本
- **AND** 下拉菜单标签本身 SHALL 不受 `data-i18n` 影响（始终保持中文/English 选项固定）

### Requirement: 翻译文件加载顺序

`i18n.js` SHALL 在所有依赖翻译函数的脚本之前加载。SHALL 在 DOM 加载完成后调用初始化逻辑，完成语言状态初始化。

#### Scenario: 加载顺序正确

- **WHEN** Panel 页面加载
- **THEN** `i18n.js` SHALL 在 `panel.js`、`config.js`、`resource.js`、`chat.js` 之前通过 `<script>` 标签加载
- **AND** 这些脚本中的 `t()` 调用 SHALL 能访问到已初始化的翻译函数和映射表

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
