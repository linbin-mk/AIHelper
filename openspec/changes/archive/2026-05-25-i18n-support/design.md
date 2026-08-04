## Context

当前项目为纯 HTML/CSS/JS Chrome Extension，无构建步骤，所有 UI 文本直接硬编码为中文。需增加国际化支持，首期提供中英文切换，为后续多语言扩展预留机制。

现有架构特点：所有脚本通过 `<script>` 标签顺序加载，全局变量共享（如 `window.switchTab`），主题系统通过 `chrome.storage.local` + `data-theme` 属性实现切换，可作为语言切换的参考模式。

## Goals / Non-Goals

**Goals:**
- 提取所有硬编码中文文本到翻译键值对
- 提供英文翻译完整覆盖
- 在"基础配置"中增加语言下拉选择器，默认中文
- 切换语言后即时刷新页面所有 UI 文本，无需刷新页面
- 语言偏好持久化到 storage，跨会话保持
- 保持纯 JS 无构建步骤，不引入第三方 i18n 库

**Non-Goals:**
- 不修改 Chrome 扩展元数据（manifest.json 的 name/description）的国际化（保持中文）
- 不处理 Markdown 渲染内容中的中文（如 AI 对话内容）
- 不支持浏览器语言自动检测（首版按默认英文）
- 不处理外部技能模块（skills/ 目录）的国际化

## Decisions

### Decision 1: 自建轻量 i18n 模块，不使用 chrome.i18n API

**选择**: 创建 `i18n.js` 文件，内联翻译映射表，提供 `t(key)` 查询函数。

**理由**:
- `chrome.i18n` API 主要用于扩展元数据和 `_locales/` 目录下的 JSON，需要 `__MSG_` 占位符在 manifest 中声明，不适合动态切换
- 项目无构建步骤，无法使用 `i18next` 等库的 npm 版本
- 自建方案零依赖，与现有架构一致

**替代方案**: 使用 `chrome.i18n.getMessage()` 配合 `_locales/` → 不支持运行时动态切换语言，需重新加载扩展，不满足即时切换需求。

### Decision 2: HTML 文本通过 `data-i18n` 属性标记

**选择**: 在 HTML 元素上添加 `data-i18n="translation.key"` 属性，`updatePageLanguage()` 遍历所有 `[data-i18n]` 元素设置 `textContent`。

**理由**:
- 解耦 HTML 结构和翻译内容
- 无需在 JS 中手动查找每个 DOM 元素
- 与现有 DOM 操作模式一致（如 `data-section` 属性）

**特殊处理**: `<input placeholder>` 这类属性文本使用 `data-i18n-placeholder` 属性。

### Decision 3: 翻译键命名采用层级结构

**选择**: 使用 `.` 分隔的层级键名，如 `settings.basic.title`、`tabs.chat`、`config.validation.required`。

**理由**:
- 按模块/页面组织，易于维护和查找
- 支持嵌套对象定义翻译映射，编写方便
- 可扩展性好，新增语言只需添加同结构映射

### Decision 4: 语言存储键与默认值

**选择**: `chrome.storage.local` key 为 `ai_helper_language`，默认值 `en`。

**理由**:
- 与现有 `ai_helper_settings`、`ai_helper_theme` 命名一致
- 首版默认英文，降低非中文用户使用门槛

### Decision 5: 仅提供两种语言选项

**选择**: 首版提供 `zh-CN`（中文）和 `en`（英文）。

**理由**:
- 最小可用范围，快速交付
- 翻译映射结构已支持扩展，后续添加语言只需新增映射对象

## Risks / Trade-offs

- **[风险] 翻译遗漏**: 大型 JS 文件（chat.js 1287行、resource.js 1232行）中动态文本可能漏翻 → 缓解：按文件分步改造，tasks 中逐文件列出需替换的字符串
- **[风险] 键名不一致**: 多人/多阶段开发导致键名风格不同 → 缓解：统一使用模块前缀（`tabs.`、`settings.`、`config.` 等），遵循命名规范
- **[取舍] HTML 文本替换粒度**: `data-i18n` 直接设置 `textContent`，不支持带 HTML 标签的复杂文本 → 接受此限制，需要富文本的场景使用独立翻译键拼接
- **[取舍] 不处理动态拼接文本**: 如 `"已捕获 " + count + " 个请求"` 这类需要在模板中嵌入参数 → 设计 `t(key, { count: 5 })` 支持插值，使用 `{{param}}` 占位符
