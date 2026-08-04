## Context

AI Helper 是 Chrome 扩展的 DevTools Panel，当前只有一套硬编码的暗色主题（Catppuccin Mocha 风格），所有颜色以十六进制值直接写在 `panel.css`（1136 行）中。项目无构建工具、无 CSS 预处理器，样式单文件管理。

## Goals / Non-Goals

**Goals:**
- 引入 CSS 自定义属性（CSS Variables）将颜色 token 化
- 提供暗色（dark）和亮色（light）两套主题，默认暗色
- 在 header 的 Tab 栏左侧添加主题切换按钮（太阳/月亮图标）
- 主题偏好持久化到 `chrome.storage.local`
- 重构 `panel.css`，所有硬编码颜色替换为 CSS 变量引用

**Non-Goals:**
- 不引入 CSS 预处理器或构建工具
- 不支持系统级 `prefers-color-scheme` 自动跟随（后续可扩展）
- 不添加主题动画/过渡效果
- 不修改 HTML 结构之外的 JS 逻辑

## Decisions

### 1. 主题方案：`<html>` 上的 `data-theme` 属性 + CSS 变量

**选择**: 在 `<html>` 上设置 `data-theme="dark|light"` 属性，CSS 通过 `[data-theme="dark"]` / `[data-theme="light"]` 选择器定义变量值。

**替代方案**:
- `body` class 切换 — 可行，但 `:root` 伪类比 body 更符合 CSS 变量惯例
- `@media (prefers-color-scheme)` — 仅支持系统级，无法让用户手动切换
- CSS 文件替换（link rel 切换）— 对于无构建工具的项目过于复杂

**选择 `html` 而非 `body`**: 部分 CSS 属性如 `::-webkit-scrollbar` 不依赖 body，使用 `:root` / `html` 更通用。

### 2. CSS 变量命名：语义化 token 名称

**选择**: `--ctp-<category>` 模式，如 `--ctp-base`、`--ctp-text`、`--ctp-surface0`。

每个颜色使用场景映射到 Catppuccin 调色板 token：

| Token | 用途 | Dark (Mocha) | Light (Latte) |
|-------|------|-------------|---------------|
| `--ctp-base` | 页面背景 | `#1e1e2e` | `#eff1f5` |
| `--ctp-mantle` | 卡片/输入框/容器 bg | `#181825` | `#e6e9ef` |
| `--ctp-crust` | 更深层背景 | `#11111b` | `#dce0e8` |
| `--ctp-surface0` | 边框/分割线/选中 Tab | `#313244` | `#ccd0da` |
| `--ctp-surface1` | 悬停态/hover bg | `#45475a` | `#bcc0cc` |
| `--ctp-surface2` | placeholder/禁用态文字 | `#585b70` | `#acb0be` |
| `--ctp-text` | 主文字 | `#cdd6f4` | `#4c4f69` |
| `--ctp-subtext0` | 次要文字/标签 | `#a6adc8` | `#5c5f77` |
| `--ctp-overlay1` | 最弱文字 | `#7f849c` (also `#7c7f93`) | `#7c7f93` |
| `--ctp-blue` | 链接/蓝色强调 | `#89b4fa` | `#1e66f5` |
| `--ctp-blue-btn` | 蓝色按钮背景 | `#1e66f5` | `#1e66f5` |
| `--ctp-blue-btn-hover` | 蓝色按钮悬停 | `#89b4fa` | `#89b4fa` |
| `--ctp-green` | 成功文字 | `#a6e3a1` | `#40a02b` |
| `--ctp-green-btn` | 绿色按钮背景 | `#40a02b` | `#40a02b` |
| `--ctp-red` | 错误文字 | `#f38ba8` | `#d20f39` |
| `--ctp-red-btn` | 红色按钮背景 | `#d20f39` | `#d20f39` |
| `--ctp-pink` | 粉色强调 | `#f5c2e7` | `#ea76cb` |
| `--ctp-yellow` | 黄色文字 | `#f9e2af` | `#df8e1d` |
| `--ctp-teal` | 青色强调 | `#94e2d5` | `#179299` |
| `--ctp-error-bg` | 错误背景 | `#3a1a1a` | `#f7d6d6` |
| `--ctp-success-bg` | 成功背景 | `#1a3a1a` | `#d6f0d6` |

特殊不跟随主题的颜色：
| Token | 值 | 用途 |
|-------|---|------|
| `--ctp-white` | `#ffffff` | 按钮上白色文字 |
| `--ctp-blockquote-bg` | dark:`#1a1a2e`, light:`#eaedf2` | 引用块背景 |

**替代方案**:
- 功能语义命名（`--bg-primary`, `--text-primary`）— 更直观但调色板 token 与实际设计系统更契合 Catppuccin 风格，且后续扩展主题颜色更容易

### 3. 主题切换按钮位置与样式

**选择**: 放在 `panel.html` 中 `.header > .tab-bar` 内部最左侧，即 Tab 按钮（"AI 聊天"）之前。

```html
<button id="themeToggleBtn" class="theme-toggle-btn" title="切换主题">
  <!-- 通过 CSS content 切换图标 -->
</button>
```

图标使用纯 CSS/Unicode 文字（☀️/🌙），无需额外 SVG 文件。

**替代方案**:
- 放在 header 右侧（关闭按钮旁）— 容易与关闭按钮混淆
- SVG inline 图标 — 增加 HTML 复杂度，Unicode 够用

### 4. 主题持久化与初始化

**选择**: 
- 存储 key: `ai_helper_theme`，值: `"dark"` | `"light"`
- 使用 `chrome.storage.local` 与现有存储方案一致
- 初始化顺序: 读 storage → 无值时默认 `"dark"` → 设置 `data-theme`
- 在 `panel.js` 的 `init()` 函数开头调用

## Risks / Trade-offs

- **CSS 变量重构范围大**：1136 行 CSS 需要逐行替换颜色为变量引用。过程中可能遗漏边界颜色。
  → 缓解：使用 `rg` 全局搜索所有 `#` 颜色值，逐一核对替换
- **亮色模式可能未充分测试**：部分组件（如 Markdown 渲染、工具调用卡片）在亮色下视觉效果可能不佳。
  → 缓解：tasks 中包含完整亮色模式走查步骤
- **不添加过渡动画**：主题切换时颜色瞬变，可能感觉生硬。
  → 有意识排除（Non-Goal），保持简洁，后续可加 `transition: background-color 0.2s, color 0.2s`

## Migration Plan

无需迁移。新功能，用户首次加载默认暗色模式（与当前行为一致）。

## Open Questions

无。
