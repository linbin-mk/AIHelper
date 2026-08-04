## 1. 准备工作

- [x] 1.1 创建 `shared/`、`shared/css/`、`shared/lib/` 目录结构
- [x] 1.2 创建 `firefox-extension/`、`firefox-extension/src/`、`firefox-extension/src/popup/`、`firefox-extension/icons/` 目录结构
- [x] 1.3 确认 `chrome-extension/src/content/` 目录下所有 content script 文件无平台专有 API 调用
- [x] 1.4 Spike：编写最小 Firefox 扩展验证 `request-interceptor.js` 在 MAIN world 中 hook fetch/XHR 的行为一致性

## 2. 共享代码抽取

- [x] 2.1 将 `chrome-extension/src/panel/chat.js` 迁移到 `shared/chat.js`
- [x] 2.2 将 `chrome-extension/src/panel/config.js` 迁移到 `shared/config.js`
- [x] 2.3 将 `chrome-extension/src/panel/memory.js` 迁移到 `shared/memory.js`
- [x] 2.4 将 `chrome-extension/src/panel/knowledge.js` 迁移到 `shared/knowledge.js`
- [x] 2.5 将 `chrome-extension/src/panel/resource.js` 迁移到 `shared/resource.js`
- [x] 2.6 将 `chrome-extension/src/panel/session-manager.js` 迁移到 `shared/session-manager.js`
- [x] 2.7 将 `chrome-extension/src/panel/skill-registry.js` 迁移到 `shared/skill-registry.js`
- [x] 2.8 将 `chrome-extension/src/panel/i18n.js` 迁移到 `shared/i18n.js`
- [x] 2.9 将 `chrome-extension/src/panel/agents-md-cache.js` 迁移到 `shared/agents-md-cache.js`
- [x] 2.10 将 `chrome-extension/src/panel/output-files.js` 迁移到 `shared/output-files.js`
- [x] 2.11 将 `chrome-extension/src/panel/favorites-manager.js` 迁移到 `shared/favorites-manager.js`
- [x] 2.12 将 `chrome-extension/src/panel/panel.css` 迁移到 `shared/css/panel.css`
- [x] 2.13 将 `chrome-extension/src/panel/marked.min.js` 迁移到 `shared/lib/marked.min.js`
- [x] 2.14 将 `chrome-extension/skills/` 目录提升到项目根目录 `skills/`

## 3. Chrome 扩展适配

- [x] 3.1 更新 `chrome-extension/src/panel/panel.html` 中的 `<script>` 和 `<link>` 路径，指向 `src/shared/` 下的文件
- [x] 3.2 在 `chrome-extension/src/background.js` 开头添加 `browser` 兼容层代码（`if typeof browser === 'undefined': globalThis.browser = chrome`）
- [x] 3.3 在 `chrome-extension/src/panel/panel.js` 开头添加 `browser` 兼容层代码
- [x] 3.4 执行 `sync.sh`，验证 Chrome 扩展在 Chrome 浏览器中功能正常（零回归）

## 4. Firefox 扩展脚手架

- [x] 4.1 创建 `firefox-extension/manifest.json`：配置 `manifest_version: 3`、`background.scripts`（Event Pages）、`action.default_popup`、`host_permissions`、`browser_specific_settings`
- [x] 4.2 复制 `chrome-extension/icons/mainicon.png` 到 `firefox-extension/icons/`
- [x] 4.3 在 `firefox-extension/manifest.json` 中注册 content_scripts（两个：ISOLATED world 的 bridge + MAIN world 的 interceptor）

## 5. Firefox 后台脚本（background.js）

- [x] 5.1 创建 `firefox-extension/src/background.js`，基于 Chrome 版但替换 Side Panel 相关代码为 `action.onClicked` 处理
- [x] 5.2 添加 `browser` 兼容层代码
- [x] 5.3 保留消息路由、webRequest 监听、tabs 管理、cookies 查询等 Chrome 版逻辑（这些 API 跨平台兼容）
- [x] 5.4 将 `scripting.executeScript` 调用中的 `world: "MAIN"` 保持（MDN 确认支持）

## 6. Firefox 请求头管理（headerManager.js）

- [x] 6.1 创建 `firefox-extension/src/headerManager.js`，实现基于 `webRequest.onBeforeSendHeaders` 阻塞模式的 per-tab 请求头注入
- [x] 6.2 实现 `addHeader(tabId, headers)`：注册 webRequest 监听器，按 `sender.tab.id` 过滤并修改请求头
- [x] 6.3 实现 `removeHeader(tabId)`：移除对应 tab 的请求头规则
- [x] 6.4 确保与 `chrome.storage` 的 HEADERS_STORAGE_KEY 数据结构不变

## 7. Firefox Popup UI

- [x] 7.1 创建 `firefox-extension/src/popup/popup.html`，参照 `panel.html` 结构但适配 popup 环境
- [x] 7.2 创建 `firefox-extension/src/popup/popup.js`，参照 `panel.js` 逻辑
- [x] 7.3 在 `popup.html` 中引用 `src/shared/` 下所有共享 JS 文件（与 panel.html 相同的外部依赖）
- [x] 7.4 在 `popup.html` 中引用 `src/shared/css/panel.css`
- [x] 7.5 调整 CSS 变量使布局适配 popup 尺寸（移除 Side Panel 的 `min-width` 等约束）

## 8. 同步脚本（sync.sh）

- [x] 8.1 创建根目录 `sync.sh`：使用 `cp -r` 或 `rsync -a --delete` 同步共享文件
- [x] 8.2 sync.sh 同步 `shared/` → `chrome-extension/src/shared/` 和 `firefox-extension/src/shared/`
- [x] 8.3 sync.sh 同步 `skills/` → `chrome-extension/skills/` 和 `firefox-extension/skills/`
- [x] 8.4 sync.sh 同步 `chrome-extension/src/content/` → `firefox-extension/src/content/`
- [x] 8.5 设置 `sync.sh` 可执行权限

## 9. 集成与验证

- [x] 9.1 运行 `sync.sh`，确保所有共享文件已同步到两个扩展目录
- [x] 9.2 在 Firefox 中加载 `firefox-extension/` 为临时扩展，验证无 manifest 错误
- [x] 9.3 验证 Firefox 中网络请求捕获功能正常
- [x] 9.4 验证 Firefox 中请求头管理功能正常
- [x] 9.5 验证 Firefox 中 AI 对话功能正常（SSE 流式响应）
- [x] 9.6 验证 Firefox 中知识库、记忆管理、技能系统功能正常
- [x] 9.7 验证 Chrome 中所有功能零回归
- [x] 9.8 更新 `.gitignore` 忽略两个扩展目录中由 sync.sh 生成的副本文件
