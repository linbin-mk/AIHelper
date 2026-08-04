## Why

当前项目所有 UI 文本均为中文硬编码，非中文用户无法使用。通过国际化改造使扩展支持多语言，首期增加英文支持，为后续更多语言扩展打下基础。

## What Changes

- 新增 i18n 消息 bundle 机制，将所有硬编码中文文本抽离为翻译键值对
- 新增英文翻译 bundle，覆盖所有 UI 文本
- 新增语言切换下拉选择器（位于"基础配置"面板内），默认英文
- 语言偏好持久化到 `chrome.storage.local`，页面加载时自动应用
- 新增 `updatePageLanguage()` API，切换语言时即时刷新所有 UI 文本
- 改造 `panel.html`、`panel.js`、`config.js`、`resource.js`、`chat.js` 中动态文本为翻译函数调用

## Capabilities

### New Capabilities
- `i18n-system`: 国际化基础设施 — 消息 bundle 定义、翻译函数 `t()`、语言检测与持久化、动态 UI 刷新、语言选择器组件

### Modified Capabilities
<!-- 无现有 spec 需求变更 -->

## Impact

- 所有包含中文硬编码文本的文件（`panel.html`、`panel.js`、`config.js`、`resource.js`、`chat.js`）
- Chrome 扩展存储新增 key `ai_helper_language`
- `panel.html` 的 `lang` 属性从固定 `zh-CN` 改为动态赋值
- settings 基础配置面板新增语言选择器 UI 控件
