## Context

当前 `chat.js` 中的 `buildRequestContext()` 函数负责动态构建系统提示词，结合 i18n 文本和实时数据（标签页 URL、捕获的请求）。每次对话都重新拼接字符串，且系统提示词的静态部分（role、rules、taskCard 格式）散落在函数体中，用户无法查看完整内容。

项目已有 IndexedDB 缓存基础设施（`knowledge.js` 中的 `FileCacheManager`），数据库名 `ai_helper_code_cache`，当前版本 3，包含 `files` 和 `trees` 两个 object store。

## Goals / Non-Goals

**Goals:**
- 将系统提示词静态部分（i18n `systemPrompt` 分类的内容）抽离为独立缓存
- 提供新模块 `agents-md-cache.js` 管理缓存的生成、读取和语言更新
- 插件初始化时自动生成缓存，AI 聊天时从缓存读取
- 在"高级"设置调试模式下提供系统提示词的预览和修改入口
- 语言切换时自动切换到对应语言文件，不覆盖已有文件，不存在才新增

**Non-Goals:**
- 不修改系统提示词的内容和行为
- 不改变 `buildRequestContext()` 中动态部分（URL、请求数据）的构建逻辑
- 不创建真实的文件系统文件，仅使用 IndexedDB 模拟文件缓存
- 不删除旧语言缓存文件（多语言版本长期共存）

## Decisions

### Decision 1: 使用 IndexedDB 而非 chrome.storage.local

**选择**: 复用现有 `ai_helper_code_cache` 数据库，新增 `agents_md_cache` object store。

**理由**: 
- 系统提示词内容较长（约 2-3KB），chrome.storage.local 适合小键值对，IndexedDB 更适合文件内容缓存
- 与现有 `FileCacheManager` 架构一致，便于理解和维护
- 无需引入新的存储机制

**替代方案**: chrome.storage.local — 简单但对大文本不友好，且语义不符（这是文件缓存而非配置）。

### Decision 2: AGENTS.md 按语言分文件，key 为 `agents_md_{lang}`

**选择**: object store key 格式为 `agents_md_zh-CN`、`agents_md_en`，按语言区分存储，多语言版本长期共存。

**理由**:
- 切换语言时无需删除旧版本，直接读取对应 key 即可
- 旧版本保留有利于用户再次切换回原语言时无需重新生成
- 与知识库的 `files` store 分离，避免耦合

### Decision 3: 数据库版本升至 4，在 onupgradeneeded 中创建新 store

**选择**: `DB_VERSION` 从 3 升至 4，`onupgradeneeded` 中通过 `event.oldVersion < 4` 条件创建新 store。

**理由**:
- 保持向后兼容，旧用户升级时自动创建新 store
- 遵循现有数据库迁移模式

### Decision 4: 按语言懒创建，不存在才新增

**选择**: `agents-md-cache.js` 暴露 `ensureAgentsMdForLang(lang)` 函数，检查 `agents_md_{lang}` key 是否存在，不存在则从 i18n 组装并创建；`getAgentsMd()` 传入当前语言调用上述函数后返回内容。

**理由**:
- 首次使用某语言时自动生成，后续直接返回缓存
- 不需要主动清除旧版本，不同语言版本互不干扰
- 切换语言时仅改变查询 key，开销极小

### Decision 5: chat.js 中 `buildRequestContext()` 拆分静态和动态部分

**选择**: 新增 `getStaticSystemPrompt()` 函数调用 `getAgentsMd()` 返回缓存的 Markdown，`buildRequestContext()` 仅负责获取实时数据（URL、请求）并拼接到静态提示词后。

**理由**:
- 静态部分可缓存，动态部分仍需实时获取
- 保持 buildRequestContext 向后兼容，不改变消息结构

## Risks / Trade-offs

- [风险] DB_VERSION 升级若失败，可能影响已有数据 → 在 `onupgradeneeded` 中使用 `try-catch` 保护新 store 创建，已有 stores 不做变更
- [风险] AGENTS.md 内容与 i18n 不一致（修改 i18n 后未刷新对应语言缓存） → 提供 `regenerateAgentsMd()` 函数按需强制重新生成
- [风险] 用户手动修改 AGENTS.md 后保存的内容可能与 i18n 原始内容脱节 → 修改后的内容直接覆盖 IndexedDB 缓存，下次 AI 聊天即使用修改版，提供"重置为默认"按钮恢复 i18n 原始版本
- [权衡] 多语言版本长期共存不回收，但文件体积小（≤3KB），不影响性能

### Decision 6: 系统提示词入口仅在调试模式下可见

**选择**: "高级"设置中的系统提示词预览/修改入口通过 `debugMode` 开关控制显示/隐藏，与现有调试模式机制一致。

**理由**:
- 系统提示词内容属于底层调试信息，普通用户无需关注
- 与现有"请求监控"Tab 的调试门控策略保持一致
- 避免普通用户误修改导致 AI 行为异常

### Decision 7: 模态框支持预览和编辑双模式

**选择**: 点击入口后弹出模态框，默认显示 Markdown 渲染预览，提供「编辑」按钮切换到可编辑的文本域模式，保存后写回 IndexedDB 缓存。

**理由**:
- 预览模式便于完整阅读 Markdown 渲染后的系统提示词
- 编辑模式允许高级用户调试和定制系统提示词
- 复用现有 `fileModalOverlay` 模态框基础设施

## Migration Plan

1. 升级 `DB_VERSION` 从 3 到 4
2. `onupgradeneeded` 中条件创建 `agents_md_cache` store
3. 部署后，已有用户首次打开面板时自动创建 store 并生成缓存
4. 无需数据迁移，新 store 独立创建

## Open Questions

<!-- 无待解决问题 -->
