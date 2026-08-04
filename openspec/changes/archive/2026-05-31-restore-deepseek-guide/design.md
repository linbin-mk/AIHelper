## Context

当前项目在提交 b63289f 中移除了设置面板的 DeepSeek 引导提示区和快捷获取 API Key 按钮。需要将这些 UI 元素和逻辑恢复，包括 i18n 文案、HTML 结构和 JavaScript 事件处理。CSS 样式（`.config-guide-deepseek`, `.config-get-apikey-btn`）仍保留在 `shared/css/panel.css` 中，无需修改。

项目架构采用 `shared/` 作为公共代码真相源，`sync.sh` 负责同步到 Chrome 和 Firefox 扩展目录。根据 AGENTS.md 规则：`shared/` 和 `chrome-extension/src/content/` 编辑后需执行 `bash sync.sh`。

## Goals / Non-Goals

**Goals:**
- 恢复 `shared/i18n.js` 中的 `configGuideDeepseek` 和 `getApiKeyBtn` 文案（中英文各 2 条）
- 恢复 `chrome-extension/src/panel/panel.html` 中的引导区域 HTML 结构
- 恢复 `chrome-extension/src/panel/panel.js` 中的按钮点击事件监听
- 通过 `sync.sh` 将变更同步到 Firefox 扩展

**Non-Goals:**
- 不修改 CSS 样式（已存在）
- 不修改 Firefox 文件（通过 sync.sh 自动同步）
- 不引入新的外部依赖

## Decisions

1. **编辑顺序**：先编辑 `shared/i18n.js`，再编辑 `chrome-extension/src/panel/panel.html` 和 `panel.js`，最后执行 `bash sync.sh` 同步到 Firefox。
   - 理由：遵循项目真相源规则，i18n 以 shared/ 为准，panel 以 chrome-extension/ 为准。

2. **HTML 插入位置**：在 `<div class="config-guide" ...>` 之后、`<div class="config-form">` 之前插入引导区域
   - 理由：与原提交前的布局一致，引导提示紧随通用配置说明之后

3. **JS 插入位置**：在 `init();` 调用之前添加按钮事件监听
   - 理由：DOM 元素在 init() 中确保已加载，事件绑定放在 init() 之前是可接受的模式（与旧代码一致）

4. **按钮行为**：点击按钮通过 `chrome.tabs.create` 打开 `https://platform.deepseek.com/` 新标签页
   - 理由：还原原始行为，不引入外部链接安全风险

## Risks / Trade-offs

- **[低风险] 跨浏览器兼容性**：`chrome.tabs.create` 在 Firefox 中兼容（MV2 polyfill 已处理）。Firefox 端通过 sync.sh 同步后正常使用同名 API。
- **[低风险] i18n Key 冲突**：`configGuideDeepseek` 和 `getApiKeyBtn` 为已移除的 key，当前项目无引用，恢复后不与其他文案冲突。
