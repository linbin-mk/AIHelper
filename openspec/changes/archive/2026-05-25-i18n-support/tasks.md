## 1. i18n 核心模块

- [x] 1.1 创建 `chrome-extension/src/panel/i18n.js`，定义 `zh-CN` 和 `en` 翻译映射表（嵌套对象）
- [x] 1.2 实现 `t(key, params?)` 函数：层级查找、插值替换 `{{param}}`、缺失降级返回 key
- [x] 1.3 实现 `getLanguage()` / `setLanguage(lang)` 函数，读写 `chrome.storage.local` 的 `ai_helper_language`，默认 `en`
- [x] 1.4 实现 `updatePageLanguage()` 函数：遍历 `[data-i18n]` 更新 `textContent`、遍历 `[data-i18n-placeholder]` 更新 `placeholder`，同步 `<html lang>`
- [x] 1.5 在 `panel.html` 中于 `panel.js` 之前加载 `i18n.js`，并在初始化时调用语言恢复逻辑
- [x] 2.1 在 `panel.html` 的基础配置区域（`#settings-basic`）添加语言选择下拉菜单 `#languageSelect`，选项为 `zh-CN`（中文）和 `en`（English）
- [x] 2.2 在 `panel.js` 中添加 `#languageSelect` change 事件处理：保存语言偏好并调用 `updatePageLanguage()`
- [x] 2.3 在 `populateBasicConfigForm()` 中初始化下拉菜单选中当前语言
- [x] 2.4 添加语言选择器对应的 CSS 样式（下拉菜单与现有表单样式一致）
- [x] 3.1 为 `panel.html` 中所有静态中文文本添加 `data-i18n` 或 `data-i18n-placeholder` 属性
- [x] 3.2 翻译映射表中补充 `panel.html` 静态文本对应的中英文键值
- [x] 4.1 替换 `panel.js` 中所有硬编码中文字符串为 `t()` 调用（错误提示、状态文本、Tab 标签等）
- [x] 4.2 翻译映射表中补充 `panel.js` 动态文本对应的中英文键值
- [x] 5.1 替换 `config.js` 中所有硬编码中文字符串为 `t()` 调用（验证错误提示）
- [x] 5.2 翻译映射表中补充 `config.js` 文本对应的中英文键值
- [x] 6.1 替换 `resource.js` 中所有硬编码中文字符串为 `t()` 调用（项目配置错误、同步状态、空状态提示等）
- [x] 6.2 翻译映射表中补充 `resource.js` 文本对应的中英文键值
- [x] 7.1 替换 `chat.js` 中所有硬编码中文字符串为 `t()` 调用（UI 提示文本、工具描述、空状态等）
- [x] 7.2 翻译映射表中补充 `chat.js` 文本对应的中英文键值

## 8. 验证与收尾

- [x] 8.1 手动验证：中英文切换后所有页面文本正确显示
- [x] 8.2 手动验证：刷新 Panel 后语言偏好保持
- [x] 8.3 检查是否有遗漏的硬编码中文文本（搜索中文正则）
