## 1. i18n 文案恢复

- [x] 1.1 在 `shared/i18n.js` 中文区 `configGuide` 后添加 `configGuideDeepseek` 和 `getApiKeyBtn` 文案
- [x] 1.2 在 `shared/i18n.js` 英文区 `configGuide` 后添加 `configGuideDeepseek` 和 `getApiKeyBtn` 文案

## 2. HTML 结构恢复

- [x] 2.1 在 `chrome-extension/src/panel/panel.html` 的 `config-guide` 和 `config-form` 之间插入 DeepSeek 引导横幅 HTML

## 3. JS 事件处理恢复

- [x] 3.1 在 `chrome-extension/src/panel/panel.js` 的 `init()` 调用前添加 `getDeepSeekApiKeyBtn` 按钮点击事件监听

## 4. 同步到 Firefox

- [x] 4.1 执行 `bash sync.sh` 将 shared/ 和 chrome-extension 变更同步到 Firefox 扩展
