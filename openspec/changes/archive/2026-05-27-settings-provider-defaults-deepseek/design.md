## Context

当前设置页的"供应商"模块中，API Base URL 和 Model Name 虽然在 HTML 中有硬编码默认值，但 `populateConfigForm` 函数在无已保存配置时会将它们重置为空字符串，导致首次使用时用户需要手动填写所有字段。同时，项目缺乏对 DeepSeek 平台的引导推荐，用户不知道可以从哪里获取 API Key。

## Goals / Non-Goals

**Goals:**
- 无已保存配置时，`apiBaseUrl` 和 `modelName` 自动回退到 DeepSeek 默认值，用户只需填写 API Key
- 在引导文案中追加 DeepSeek 推荐内容，鼓励用户使用 DeepSeek API
- 新增"快捷获取APIkey"快捷按钮，点击跳转 DeepSeek 平台页面

**Non-Goals:**
- 不修改保存逻辑和验证逻辑
- 不修改 `modelType` 的默认值（已为 `deepseek-v4-flash`）
- 不添加其他供应商的默认值
- 不修改 HTML 中已有的硬编码默认值

## Decisions

1. **默认值回退策略**：在 `populateConfigForm` 中，当无配置时，`apiBaseUrl` 设为 `https://api.deepseek.com`，`modelName` 设为 `deepseek-v4-flash`。HTML 中的硬编码默认值保持不变，作为首次渲染时的视觉兜底。

2. **引导文案实现方式**：直接在 `config-guide` div 中追加 HTML 内容（包含文字和按钮），使用 `data-i18n` 属性处理国际化文案。这样按钮可以在同一条目内内联显示，视觉效果自然。

3. **快捷按钮实现**：使用 `<a>` 标签 + `target="_blank"` 方式，通过 `panel.js` 绑定点击事件使用 `chrome.tabs.create` 打开外部链接，确保在浏览器中正确打开新标签页。同时添加 `rel="noopener noreferrer"` 安全属性。

4. **HTML 硬编码默认值保留**：现有 `input` 元素的 `value` 属性保留 `https://api.deepseek.com` 和 `deepseek-v4-flash`，作为 JS 加载前的初始显示值，与 JS 回退逻辑保持一致。

## Risks / Trade-offs

- **[风险] 用户可能不理解为什么默认值是指向 DeepSeek 的** — 通过在引导文案中说明项目背景来缓解
- **[风险] 默认值可能与某些用户使用的其他供应商不兼容** — 用户可以随时修改默认值，不影响功能
- **[风险] 国际化英文文案可能不够 native** — 作为 V1 可接受，后续优化
