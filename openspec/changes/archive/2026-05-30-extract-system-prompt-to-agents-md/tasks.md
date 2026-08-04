## 1. IndexedDB 升级

- [x] 1.1 将 `knowledge.js` 中 `DB_VERSION` 从 3 升至 4
- [x] 1.2 在 `onupgradeneeded` 中新增 `agents_md_cache` object store（keyPath 为 `id`，key 值格式 `agents_md_{lang}`），条件 `event.oldVersion < 4`

## 2. 创建 agents-md-cache.js 模块

- [x] 2.1 新建 `chrome-extension/src/panel/agents-md-cache.js` 文件
- [x] 2.2 实现 `ensureAgentsMdForLang(lang)` 函数：检查 `agents_md_{lang}` key 是否存在，不存在则从对应语言 i18n 组装 Markdown 并写入 IndexedDB
- [x] 2.3 实现 `getAgentsMd()` 函数：获取当前语言，调用 `ensureAgentsMdForLang()` 保证缓存就绪后返回内容
- [x] 2.4 实现 `saveAgentsMd(content, lang)` 函数：将指定语言的内容写入 IndexedDB `agents_md_{lang}` 记录
- [x] 2.5 实现 `regenerateAgentsMd(lang)` 函数：从 i18n 重新生成指定语言的原始 Markdown 并覆盖 IndexedDB 缓存
- [x] 2.6 Markdown 内容格式：`# AGENTS.md` 标题 + role + contextInfo + rulesLabel + 5 条规则 + taskCardHelp + JSON 示例

## 3. 修改 chat.js 使用缓存系统提示词

- [x] 3.1 在 `chat.js` 中引用 `window.getAgentsMd()`，新增 `getStaticSystemPrompt()` 异步函数
- [x] 3.2 修改 `buildMessages()` 的 system 消息构建逻辑，使用 `getStaticSystemPrompt()` 获取静态部分，再拼接 `buildRequestContext()` 的动态部分（URL、请求数据）
- [x] 3.3 移除 `buildRequestContext()` 中已转到缓存的部分（role、rules、taskCard 格式段），保留动态 URL/请求数据拼装

## 4. 插件初始化集成

- [x] 4.1 在 `panel.html` 中加载 `agents-md-cache.js`（在 `chat.js` 之前）
- [x] 4.2 在 `panel.js` 的 `init()` 函数中调用 `ensureAgentsMdForLang()` 确保当前语言缓存就绪

## 5. 语言切换时自动切换缓存文件

- [x] 5.1 在 `panel.js` 的语言切换逻辑中（`setLanguage()` 或语言选择器 change 事件）调用 `ensureAgentsMdForLang()`，确保新语言版本存在（不存在则创建）

## 6. 高级设置中系统提示词入口（调试模式下可见）

- [x] 6.1 在 `i18n.js` 中添加中英文翻译 key：
  - `settings.systemPrompt`: "系统提示词" / "System Prompt"
  - `settings.viewSystemPrompt`: "预览" / "Preview"
  - `settings.editSystemPrompt`: "编辑" / "Edit"
  - `settings.saveSystemPrompt`: "保存" / "Save"
  - `settings.resetSystemPrompt`: "重置为默认" / "Reset to Default"
  - `settings.systemPromptTitle`: "系统提示词" / "System Prompt"
- [x] 6.2 在 `panel.html` 的"高级"设置区域添加「系统提示词」按钮（初始隐藏，`id="viewAgentsMdBtn"`）
- [x] 6.3 在 `panel.js` 的 `applyDebugMode()` 中控制按钮显示/隐藏（调试模式开启显示，关闭隐藏）
- [x] 6.4 在 `panel.js` 中绑定按钮点击事件：弹出模态框展示 Markdown 渲染后的内容（预览模式）
- [x] 6.5 在模态框中添加「编辑」按钮：点击后切换到可编辑文本域模式，显示原始 Markdown
- [x] 6.6 在编辑模式下添加「保存」按钮：调用 `saveAgentsMd()` 写回 IndexedDB
- [x] 6.7 在编辑模式下添加「重置为默认」按钮：调用 `regenerateAgentsMd()` 恢复 i18n 原始版本
