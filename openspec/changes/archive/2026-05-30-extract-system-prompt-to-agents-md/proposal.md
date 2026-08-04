## Why

当前 AI 聊天的系统提示词硬编码在 `chat.js` 的 `buildRequestContext()` 函数中，每次对话都重新构建，用户无法查看完整的系统提示词内容。将系统提示词抽离为独立的 `AGENTS.md` 缓存文件，既能提升性能（避免重复构建），又能在调试模式下查看和修改完整内容，提升透明度和可调试性。

## What Changes

- 新增 `agents-md-cache.js` 模块，负责生成和管理 `AGENTS.md` 缓存文件
- 系统提示词内容从 `i18n.js` 的 `systemPrompt` 分类中读取，支持中英文
- 缓存文件按语言命名：`AGENTS.zh-CN.md`、`AGENTS.en.md`，存储在 IndexedDB 中
- 插件初始化时自动生成当前语言对应的 `AGENTS.{lang}.md` 到缓存（不存在才创建）
- AI 聊天时从缓存读取系统提示词，若缓存不存在则自动创建
- "高级"设置中新增「系统提示词」入口（仅在调试模式下可见），支持预览当前语言的 `AGENTS.{lang}.md` 内容和直接修改保存
- 用户切换语言时自动切换到对应语言文件，旧文件保留不覆盖，新语言文件不存在才新增

## Capabilities

### New Capabilities

- `agents-md-cache`: 系统提示词缓存模块，负责从 i18n 内容生成 `AGENTS.md` 文件，存入 IndexedDB，提供读取和按语言更新能力

### Modified Capabilities

<!-- 无现有能力需要修改 -->

## Impact

- **新增文件**: `chrome-extension/src/panel/agents-md-cache.js`
- **修改文件**: `chrome-extension/src/panel/panel.html`（高级设置 UI）、`chrome-extension/src/panel/panel.js`（初始化流程、语言切换、高级设置绑定）、`chrome-extension/src/panel/i18n.js`（可能需要新增 systemPrompt 分类的 Markdown 格式化输出）、`chrome-extension/src/panel/chat.js`（改用缓存读取系统提示词）
- **数据存储**: IndexedDB 新增 `agents_md_cache` object store
- **无破坏性变更**: 系统提示词内容和行为不变，仅改变存储和获取方式
