## Why

提交 b63289f 移除了设置面板中的 DeepSeek 引导提示和快捷获取 API Key 按钮。该引导功能帮助用户了解推荐使用 DeepSeek 模型，并提供一键跳转到 DeepSeek 平台获取 API Key 的便捷入口，降低新用户上手门槛。

## What Changes

- 恢复 `shared/i18n.js` 中的 `configGuideDeepseek`（中英文）和 `getApiKeyBtn`（中英文）国际化文案
- 恢复 `chrome-extension/src/panel/panel.html` 中的 DeepSeek 引导提示区域和快捷获取按钮 HTML 结构
- 恢复 `chrome-extension/src/panel/panel.js` 中的按钮点击事件监听，点击后在新标签页打开 DeepSeek 平台
- 恢复 `firefox-extension/src/popup/popup.html` 中对应的 HTML 结构（通过 sync.sh 同步）
- 恢复 `firefox-extension/src/popup/popup.js` 中对应的按钮点击事件监听（通过 sync.sh 同步）

## Capabilities

### New Capabilities
- `deepseek-guide-banner`: 设置面板中的 DeepSeek 引导横幅，包含推荐文案和快捷获取 API Key 链接按钮

### Modified Capabilities
<!-- No existing specs to modify -->

## Impact

- `shared/i18n.js`: 新增 4 条 i18n 文案（2 中文 + 2 英文）
- `chrome-extension/src/panel/panel.html`: 在 config-guide 下方新增引导区域 HTML
- `chrome-extension/src/panel/panel.js`: 末尾 init() 前新增按钮事件监听
- `firefox-extension/src/popup/popup.html`: sync.sh 从 Chrome 同步
- `firefox-extension/src/popup/popup.js`: sync.sh 从 Chrome 同步
- CSS 样式 `.config-guide-deepseek` 和 `.config-get-apikey-btn` 已存在于 `shared/css/panel.css`，无需修改
