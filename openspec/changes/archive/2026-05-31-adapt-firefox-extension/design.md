## Context

AIHelper 是一个 Chrome 浏览器扩展（Manifest V3），提供 AI 对话 Agent、网络请求监控、请求头管理、Cookie 监控、知识库、记忆管理等功能。当前代码库 100% 使用 Chrome 专有 API（`chrome.sidePanel`、`chrome.declarativeNetRequest` with `tabIds`、`chrome.scripting.executeScript` with `world: "MAIN"`、Service Worker background），无跨浏览器兼容层。

Firefox 从 109 版本开始支持 Manifest V3，但其 MV3 实现与 Chrome 存在关键差异：
- 无 `sidePanel` API（改为 `sidebarAction`）
- 后台使用 Event Pages（`background.scripts`），不支持 Service Worker
- DNR 不支持 `tabIds` 条件（但保留了 `webRequest` 阻塞模式）
- 支持 `content_scripts` 的 `world: "MAIN"`（MDN 文档确认，但需验证对 fetch/XHR hook 的行为一致性）

此设计的目标是在不引入复杂构建工具链的前提下，以最小代价实现 Firefox 支持，同时为 Edge/Opera 等 Chromium 浏览器提供零额外成本的兼容。

## Goals / Non-Goals

**Goals:**
- 使 AIHelper 扩展可在 Firefox 中完整运行（所有现有功能）
- 建立共享代码架构，避免 Chrome/Firefox 代码分叉
- 保持零构建依赖的开发体验（直接加载扩展目录开发）
- Chrome 版行为零回归

**Non-Goals:**
- 不在本次引入 npm 构建系统（webpack/vite/rollup）
- 不引入 webextension-polyfill（直接使用 `chrome.*`/`browser.*` 兼容 fallback 更轻量）
- 不调整现有功能规格
- 不处理 Firefox AMO 签名/发布流程（仅代码适配）

## Decisions

### 决策 1：双目录 + sync 脚本 vs 统一构建

**选择**：双平台目录（`chrome-extension/` + `firefox-extension/`）+ `shared/` 公共源码 + `sync.sh` 复制脚本。

```
AIHelper/
├── shared/                  ← 公共业务逻辑（单一真相源）
│   ├── chat.js
│   ├── config.js
│   ├── memory.js
│   ├── knowledge.js
│   ├── resource.js
│   ├── session-manager.js
│   ├── skill-registry.js
│   ├── i18n.js
│   ├── agents-md-cache.js
│   ├── output-files.js
│   ├── favorites-manager.js
│   ├── css/panel.css
│   └── lib/marked.min.js
│
├── skills/                  ← 技能定义（两边共享）
│
├── chrome-extension/        ← Chromium 家族（直接加载/打包）
│   ├── manifest.json
│   ├── icons/
│   ├── skills        → sync.sh: cp -r ../skills .
│   └── src/
│       ├── background.js        ← Chrome 平台壳
│       ├── headerManager.js     ← Chrome DNR 实现
│       ├── content/             ← 公共 content scripts
│       ├── panel/               ← Side Panel 入口
│       └── shared       → sync.sh: cp -r ../../shared/* .
│
├── firefox-extension/      ← Firefox（直接加载/打包）
│   ├── manifest.json
│   ├── icons/
│   ├── skills        → sync.sh: cp -r ../skills .
│   └── src/
│       ├── background.js        ← Firefox 平台壳
│       ├── headerManager.js     ← Firefox webRequest 实现
│       ├── content/      → sync.sh: cp -r ../../chrome-extension/src/content .
│       ├── popup/               ← action popup 入口
│       └── shared       → sync.sh: cp -r ../../shared/* .
│
└── sync.sh                  ← 一键同步所有共享文件
```

**理由**：
- 只有 2 个平台变体（Chromium 家族统一），不会指数膨胀
- shared 目录中 10+ 文件已成熟稳定，改动频率低，手动 sync 负担很轻
- 不引入构建步骤意味着保留"改完刷新"的开发体验
- 打包时每个目录自包含，直接 zip 即可

**未选择方案**：
- 软链（symlink）：跨 OS 行为不一致，zip 打包可能断裂
- 统一构建（npm + esbuild/webpack）：过度工程化，当前项目完全没有构建依赖
- webextension-polyfill：50KB 额外体积，而实际的 chrome.*/browser.* 差异只需 5 行兼容代码即可处理

### 决策 2：Firefox 后台使用 Event Pages

**选择**：在 `firefox-extension/manifest.json` 中使用 `background.scripts`，共享 `background.js` 核心逻辑，仅抽取平台差异。

manifest 配置：
```json
// chrome-extension/manifest.json
"background": { "service_worker": "src/background.js" }

// firefox-extension/manifest.json
"background": { "scripts": ["src/background.js"] }
```

**理由**：
- Firefox 不支持 Service Worker，Event Pages 是唯一选择
- `background.js` 事件驱动模式（`chrome.runtime.onMessage.addListener`、`chrome.tabs.onActivated` 等）与 Event Pages 天然兼容
- 生命周期差异（SW 销毁/重启 vs Event Pages 挂起/恢复）不影响现有代码：所有状态存储在 `chrome.storage` 中

### 决策 3：sidebarAction 替代 Side Panel

**选择**：Firefox 使用 `sidebar_action`（浏览器侧边栏），不使用 `action.default_popup`。

对比：

| 方案 | 优点 | 缺点 |
|------|------|------|
| `sidebar_action` | 持久存在不关闭，空间更大可拖拽调整，IME 输入法联想框正常显示 | API 与 Chrome `sidePanel` 不同 |
| `action.default_popup` | 开发简单 | 失焦关闭，IME 联想框 z-index 有问题，尺寸受限 |

**理由**：
- sidebarAction 的行为最接近 Chrome Side Panel（持久面板、充足空间）
- IME 输入法联想框问题在 popup 中无法修复（popup 渲染在独立图层）
- popup 关闭后状态丢失影响 AI 对话体验

**实现**：
```json
// firefox-extension/manifest.json
"action": { "default_title": "AI Helper - 控制面板" },
"sidebar_action": {
  "default_panel": "src/popup/popup.html",
  "default_title": "AI Helper"
}
```

### 决策 4：请求头管理改用 webRequest 阻塞模式

**选择**：Firefox 版 `headerManager.js` 使用 `webRequest.onBeforeSendHeaders`（阻塞模式）替代 DNR `tabIds`。

Chrome 路径：
```
headerManager.addHeader(tabId, headers)
  → chrome.declarativeNetRequest.updateDynamicRules({ addRules: [{ condition: { tabIds } }] })
```

Firefox 路径：
```
headerManager.addHeader(tabId, headers)
  → 注册 webRequest.onBeforeSendHeaders 监听器
  → 检查 sender.tab.id === tabId
  → 修改 requestHeaders
```

**理由**：
- Firefox 保留 `webRequest` 阻塞模式（这是它与 Chrome MV3 最大的分歧之一）
- 功能完全等价：按标签页注入请求头
- DNR 的 `tabIds` 条件在 Firefox 中不支持，`webRequest` 阻塞模式是唯一的按标签页过滤方案

### 决策 5：MAIN world 内容脚本

**选择**：在 Firefox 中保持 `request-interceptor.js` 使用 MAIN world 注入（`scripting.executeScript({ world: 'MAIN' })` 和 `content_scripts[].world: "MAIN"`）。

**理由**：
- MDN 文档确认 Firefox MV3 支持 `content_scripts` 的 `world` 属性和 `scripting.executeScript` 的 `ExecutionWorld.MAIN`
- 需要实际 spike 验证 fetch/XHR hook 在 Firefox MAIN world 中的行为一致性

### 决策 6：无 polyfill 的 browser 兼容层

**选择**：不引入 webextension-polyfill，在 `background.js` 开头添加标准兼容代码：

```js
// Firefox 原生支持 browser.*，Chrome 只有 chrome.*
if (typeof browser === 'undefined') {
  globalThis.browser = chrome;
}
```

**理由**：
- 项目使用的 API（storage、runtime、tabs、webRequest）在两种命名空间下语义完全一致
- `chrome.storage.local.get` 在 Firefox 中也直接可用（Firefox 同时支持 `chrome.*` 和 `browser.*`）
- 唯一的差异是 Promise vs callback 风格，但当前代码全部使用 `chrome.*` callback 风格，在 Firefox 中也正常工作

## Risks / Trade-offs

| Risk | 影响 | 缓解措施 |
|------|------|----------|
| **MAIN world fetch/XHR hook 在 Firefox 中行为不一致** | 请求体捕获功能可能失效 | 第一优先级做 spike 验证；若不可行，改用 Firefox `webRequest` filter 捕获（但仅限请求头，请求体需另寻方案） |
| **sync.sh 手动执行可能被遗忘** | shared 改动后扩展不同步 | sync.sh 放在根目录显眼位置；可在 README 添加开发流程说明 |
| **Popup 关闭后状态丢失** | AI 对话内容在用户切换注意力时消失 | Popup 关闭是浏览器行为无法避免；核心对话状态已存储在 `chrome.storage`，重新打开可恢复 |
| **Event Pages 与 Service Worker 生命周期差异** | 长时间空闲后状态行为不同 | 所有持久状态已在 `chrome.storage` 中，不依赖内存状态 |
| **Firefox 用户量小使得 bug 发现慢** | 功能回归难以及时发现 | 保持 Chrome 版为主要测试目标；Firefox 版功能与 Chrome 版共享核心逻辑，减少平台专属 bug 面 |

## Open Questions

1. **MAIN world 注入验证**：`request-interceptor.js` 在 Firefox 的 MAIN world 中是否能正常 hook `fetch`/`XMLHttpRequest`？需要写最小案例在 Firefox 中实测。
2. **Popup 最大尺寸**：Firefox `action.default_popup` 的实际可用尺寸是多少？是否需要调整 panel.css 的布局常量？
3. **`browser_specific_settings` 的 id**：发布时需要生成 `gecko.id`（如 `aihelper@example.org`），可使用临时 id 开发。
