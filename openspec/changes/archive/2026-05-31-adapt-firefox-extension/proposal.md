## Why

AIHelper 目前仅支持 Chrome/Chromium 浏览器，但 README 和早期设计文档已将 Firefox、Edge、Opera 列为支持目标。Firefox 是仅次于 Chrome 的第二大浏览器市场（~3-4% 桌面份额，在开发者群体中份额更高），且其扩展 API 与 Chrome MV3 存在多个关键差异，需要专项适配。此变更是 AIHelper 从"Chrome 专用"转向"跨浏览器"的第一步。

## What Changes

- **新增 `firefox-extension/` 目录**，包含 Firefox 扩展的 manifest、平台壳代码和 popup UI 入口
- **新增 `shared/` 目录**，抽取 `chrome-extension/src/` 中与浏览器无关的核心业务逻辑（chat、config、memory、knowledge、resource 等），由两个平台共同引用
- **新增 `sync.sh` 脚本**，将 `shared/`、`skills/`、`content/` 等公共文件同步到两个扩展目录中
- **Firefox manifest.json**：使用 `background.scripts`（Event Pages）、`sidebar_action`（替代 Side Panel），添加 `browser_specific_settings`
- **Firefox 请求头管理**：使用 `webRequest.onBeforeSendHeaders` 阻塞模式替代 `declarativeNetRequest` 的 `tabIds` 条件（Firefox 不支持）
- **Firefox popup UI**：将 Side Panel 页面适配为 `action.default_popup` 弹窗模式，调整布局和交互
- **浏览器抽象层**：对 `background.js` 中的平台差异 API 调用（sidePanel、DNR tabIds、scripting MAIN world）封装为平台适配函数
- **Edge/Opera 兼容**：复用 `chrome-extension/` 目录，无需额外工作

## Capabilities

### New Capabilities

- `firefox-platform-support`：Firefox 浏览器平台支持，包括 manifest 配置、Event Pages 后台、popup UI 入口、webRequest 请求头管理、MAIN world 内容脚本注入
- `cross-browser-code-sharing`：跨浏览器共享代码架构，包括 shared 目录结构、sync.sh 同步脚本、平台抽象层接口定义

### Modified Capabilities

无。现有功能规格（request-capture、multi-session-management、skill-system 等）的**需求定义不变**，仅实现层面需要适配不同浏览器 API。

## Impact

- **目录结构**：新增 `shared/`（公共业务逻辑）、`firefox-extension/`（Firefox 扩展）、`sync.sh`（同步脚本）
- **现有文件**：`chrome-extension/src/panel/` 中的 chat/config/memory/knowledge/resource 等 10+ 个 JS 文件迁移到 `shared/`，原位置由 sync 脚本填充
- **manifest.json**：Chrome 版不变，新增 Firefox 版（`firefox-extension/manifest.json`）
- **background.js**：抽取平台差异部分（sidePanel、DNR、MAIN world），保留 Chrome 版，新增 Firefox 版
- **headerManager.js**：保留 Chrome DNR 版，新增 Firefox webRequest 阻塞版
- **UI 入口**：保留 Chrome `panel/panel.html`，新增 Firefox `popup/popup.html`
- **依赖**：无需新增 npm 依赖。可选择性引入 webextension-polyfill 但非必需（直接用 `browser` + `chrome` 兼容 fallback）
