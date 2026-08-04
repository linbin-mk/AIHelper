## 1. CSS 变量定义

- [x] 1.1 在 `panel.css` 的 `:root` 中定义暗色主题（Mocha）CSS 变量，覆盖所有 sematic token（`--ctp-base`, `--ctp-mantle`, `--ctp-crust`, `--ctp-surface0`, `--ctp-surface1`, `--ctp-surface2`, `--ctp-text`, `--ctp-subtext0`, `--ctp-overlay1`, `--ctp-blue`, `--ctp-blue-btn`, `--ctp-blue-btn-hover`, `--ctp-green`, `--ctp-green-btn`, `--ctp-red`, `--ctp-red-btn`, `--ctp-pink`, `--ctp-yellow`, `--ctp-teal`, `--ctp-error-bg`, `--ctp-success-bg`, `--ctp-white`, `--ctp-blockquote-bg`）
- [x] 1.2 在 `[data-theme="light"]` 中定义亮色主题（Latte）变量覆盖
- [x] 1.3 在 `<html>` 上添加默认 `data-theme="dark"` 属性（`panel.html`）

## 2. CSS 颜色重构

- [x] 2.1 替换 body 和全局样式中的硬编码颜色为 CSS 变量（`body`, `#app`, `.header`, `.close-btn`, `::-webkit-scrollbar`）
- [x] 2.2 替换监控 Tab 样式中的颜色（`.url-text`, `.request-list`, `.request-row`, `.request-method`, `.request-path`, `.request-status`, `.empty-hint`, `.cookie-text`, `.header-status`, `.header-form-section`, `.header-input`, `.header-item`, `.header-item-name`, `.header-item-value`, `.header-item-delete`, `.add-btn`）
- [x] 2.3 替换聊天 Tab 样式中的颜色（`.tab-bar`, `.tab-btn`, `.toolbar-btn`, `.chat-bubble`, `.chat-bubble-user`, `.chat-bubble-assistant`, `.chat-bubble-error`, Markdown 渲染样式、`.chat-bubble-thinking`, `.thinking-header`, `.thinking-content`, `.chat-bubble-tool`, `.tool-args`, `.chat-bubble-tool-result`, `.chat-bubble-info`, `.chat-input`, `.send-btn`, `.stop-btn`）
- [x] 2.4 替换配置和资源管理 Tab 样式（`.config-container`, `.config-guide`, `.config-label`, `.config-input`, `.config-hint`, `.config-error`, `.save-btn`, `.back-btn`, `.resource-toolbar`, `.resource-title`, `.project-card`, `.project-btn`, `.sync-status`, `.project-form`, `.form-title`, `.char-count`, `.spinner`, `.task-card` 系列样式）
- [x] 2.5 逐行检查 `panel.css` 确保没有遗漏的硬编码颜色（用 `rg` 搜索 `#[0-9a-fA-F]` 验证）

## 3. 主题切换按钮 UI

- [x] 3.1 在 `panel.html` 的 `.tab-bar` 内部最左侧添加 `<button id="themeToggleBtn" class="theme-toggle-btn">` 元素
- [x] 3.2 在 `panel.css` 中添加 `.theme-toggle-btn` 样式：透明背景、无边框、font-size 16px、padding 4px 8px、border-radius 4px、cursor pointer
- [x] 3.3 添加 `.theme-toggle-btn:hover` 样式：背景色 `var(--ctp-surface0)`
- [x] 3.4 实现按钮图标切换：`[data-theme="dark"] .theme-toggle-btn` 内容为 🌙，`[data-theme="light"] .theme-toggle-btn` 内容为 ☀️

## 4. 主题切换逻辑

- [x] 4.1 在 `panel.js` 的 `init()` 中调用 `initTheme()`：读取 `chrome.storage.local` 的 `ai_helper_theme`，无值时默认 `"dark"`，设置 `document.documentElement.setAttribute('data-theme', theme)`
- [x] 4.2 添加 `themeToggleBtn` 点击事件处理：读取当前 `data-theme` → 切换为相反值 → 更新 `data-theme` 属性 → 保存到 `chrome.storage.local`
- [x] 4.3 更新按钮 `title` 属性：暗色模式时 title 为 "切换到亮色模式"，亮色模式时 title 为 "切换到暗色模式"

## 5. 验证

- [x] 5.1 在暗色模式下打开 Panel，确认所有 UI 组件颜色与重构前完全一致
- [x] 5.2 点击切换按钮切换到亮色模式，逐 Tab 检查 "AI 聊天"、"请求监控"、"资源管理"、"配置" 页面的可读性和视觉效果
- [x] 5.3 关闭 Panel 后重新打开，确认主题偏好保持（如选择亮色，再打开仍是亮色）
- [x] 5.4 检查聊天消息气泡（用户/助手/错误/思考块/工具调用）、Markdown 渲染（代码块、表格、引用块）在亮色模式下的可读性
