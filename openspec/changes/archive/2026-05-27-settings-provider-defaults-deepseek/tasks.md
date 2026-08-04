## 1. JS 逻辑修改：默认值回退

- [x] 1.1 修改 `populateConfigForm` 函数，无配置时 `apiBaseUrl` 设为 `https://api.deepseek.com`，`modelName` 设为 `deepseek-v4-flash`（`config.js:36-40`）
- [x] 1.2 确保有配置时 `apiBaseUrl` 和 `modelName` 仍以存储值为准（`config.js:28,33` 逻辑不变）

## 2. HTML 结构修改：引导文案和快捷按钮

- [x] 2.1 在 `panel.html` 的 `.config-guide` 元素后追加 DeepSeek 推荐文案容器（`data-i18n="settings.configGuideDeepseek"`）
- [x] 2.2 在同容器内追加"快捷获取APIkey"按钮（`id="getDeepSeekApiKeyBtn"`，`data-i18n` 绑定）
- [x] 2.3 按钮使用 `target="_blank"` 和 `rel="noopener noreferrer"` 属性

## 3. i18n 国际化文本

- [x] 3.1 新增中文文本 `configGuideDeepseek` 和 `getApiKeyBtn` 到 `i18n.js` 的 `settings` 模块
- [x] 3.2 新增对应英文文本到 `i18n.js` 的英文翻译区域

## 4. CSS 样式

- [x] 4.1 为快捷按钮添加样式（`.config-guide-deepseek` 容器和 `.config-get-apikey-btn` 按钮）
- [x] 4.2 确保按钮与文案在同一行内联显示且视觉协调

## 5. JS 事件绑定

- [x] 5.1 在 `panel.js` 中为 `#getDeepSeekApiKeyBtn` 绑定点击事件
- [x] 5.2 使用 `chrome.tabs.create({ url: 'https://platform.deepseek.com/' })` 打开新标签页

## 6. 验证

- [x] 6.1 清除 `chrome.storage.local` 中的配置，刷新面板验证默认值是否正确显示
- [x] 6.2 填写并保存自定义配置后刷新，验证自定义值是否保留
- [x] 6.3 点击"快捷获取APIkey"按钮验证是否在新标签页打开 DeepSeek 平台
- [x] 6.4 切换中英文验证文案是否正确显示
