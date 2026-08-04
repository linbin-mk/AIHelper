## ADDED Requirements

### Requirement: Max Tool Rounds Configuration
系统 SHALL 在「设置 → 基础配置」子页面中提供「工具调用最大轮次」输入框，允许用户配置 AI Agent Loop 的最大 tool calling 轮次，默认值为 5000。

#### Scenario: Max tool rounds input displays default value
- **WHEN** 用户首次进入「基础配置」且从未设置过该值
- **THEN** 输入框显示默认值 5000

#### Scenario: Max tool rounds input loads saved value
- **WHEN** 用户进入「基础配置」且之前已保存过该值
- **THEN** 输入框显示已保存的值

#### Scenario: Max tool rounds validation
- **WHEN** 用户输入非正整数值后点击保存
- **THEN** 系统显示校验错误提示

#### Scenario: Max tool rounds save success
- **WHEN** 用户输入合法值并点击保存
- **THEN** 系统将值持久化到 chrome.storage.local，AI 聊天中的 tool calling 循环使用该值作为上限

### Requirement: Debug Mode Toggle
系统 SHALL 在「设置 → 基础配置」子页面中提供调试模式开关（toggle），默认关闭。

#### Scenario: Debug mode default state
- **WHEN** 用户首次使用且从未设置过调试模式
- **THEN** 开关处于关闭状态

#### Scenario: Debug mode toggle on
- **WHEN** 用户在「基础配置」中打开调试模式开关
- **THEN** 系统将调试模式状态持久化到 chrome.storage.local

### Requirement: Theme Toggle
系统 SHALL 在「设置 → 基础配置」子页面中提供黑夜/白天模式开关（toggle），替换原来顶部栏中的主题切换按钮。开关状态与 `html[data-theme]` 属性同步，并持久化到 chrome.storage.local。

#### Scenario: Theme toggle displays current theme
- **WHEN** 用户进入「基础配置」子页面
- **THEN** 开关显示当前主题状态（黑夜模式 ON，白天模式 OFF）

#### Scenario: Theme toggle switches theme
- **WHEN** 用户切换主题开关
- **THEN** 页面主题实时切换，状态持久化到 storage，原有顶部栏主题切换按钮被移除

### Requirement: Debug Mode Controls UI Visibility
当调试模式开启时，系统 SHALL 显示「AI 聊天」页面中的「导出日志」按钮和顶部 Tab 栏中的「请求监控」Tab。当调试模式关闭时，系统 SHALL 隐藏上述元素（通过 CSS display 属性，不移除 DOM）。

#### Scenario: Debug mode ON shows debug UI
- **WHEN** 调试模式已开启
- **THEN** 「请求监控」Tab 按钮和「导出日志」按钮可见

#### Scenario: Debug mode OFF hides debug UI
- **WHEN** 调试模式已关闭
- **THEN** 「请求监控」Tab 按钮和「导出日志」按钮不可见（display:none）

#### Scenario: Toggle debug mode updates UI immediately
- **WHEN** 用户在「基础配置」中切换调试模式开关
- **THEN** 「请求监控」Tab 和「导出日志」按钮的显隐状态实时更新
