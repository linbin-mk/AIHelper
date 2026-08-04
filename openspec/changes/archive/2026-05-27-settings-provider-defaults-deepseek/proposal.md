## Why

降低用户在设置页填写大模型 API 配置的门槛，将 DeepSeek 供应商信息作为默认值预填充，用户只需填写 API Key 即可开始使用。同时通过引导文案和快捷入口向用户推荐 DeepSeek 平台，提升新用户的配置体验和转化率。

## What Changes

- 设置页供应商模块：API Base URL 和模型名称默认预填 DeepSeek 的值（`https://api.deepseek.com` / `deepseek-v4-flash`）
- `populateConfigForm` 逻辑优化：无已保存配置时，`apiBaseUrl` 和 `modelName` 回退到 DeepSeek 默认值而非空字符串
- 配置引导文案优化：在现有文案后追加项目使用 DeepSeek 开发的说明，引导用户使用 DeepSeek API
- 新增"快捷获取APIkey"按钮：点击后打开 DeepSeek 平台官网 `https://platform.deepseek.com/`
- i18n 更新：新增引导文案（中/英文）和按钮文本

## Capabilities

### New Capabilities
- `settings-provider-defaults`: 设置页供应商模块的默认值预填充、引导文案优化及 DeepSeek 快捷获取 API Key 入口

### Modified Capabilities
<!-- None -->

## Impact

- `chrome-extension/src/panel/panel.html` — HTML 结构变更（已有默认值保留，新增引导文案和快捷按钮）
- `chrome-extension/src/panel/config.js` — 表单填充逻辑调整（无配置时默认值回退）
- `chrome-extension/src/panel/panel.css` — 新增按钮样式
- `chrome-extension/src/panel/i18n.js` — 新增 i18n key
- `chrome-extension/src/panel/panel.js` — 新增快捷按钮点击事件绑定
