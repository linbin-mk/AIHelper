### Requirement: 插件初始化时自动生成 AGENTS.md 缓存

系统 SHALL 在插件面板初始化时自动生成当前语言对应的 `AGENTS.{lang}.md` 内容并存入 IndexedDB 缓存，内容来自对应语言的 i18n `systemPrompt` 分类。

#### Scenario: 首次初始化生成缓存

- **WHEN** 插件面板首次加载且 IndexedDB 中不存在 `agents_md_{lang}` 记录（如 `agents_md_zh-CN`）
- **THEN** 系统从对应语言的 `systemPrompt` i18n 数据组装 Markdown 内容，写入 IndexedDB `agents_md_cache` store，key 为 `"agents_md_{lang}"`

#### Scenario: 缓存已存在时跳过生成

- **WHEN** 插件面板加载且 IndexedDB 中已存在当前语言的 `agents_md_{lang}` 记录
- **THEN** 系统跳过生成步骤，不重复写入

---

### Requirement: AI 聊天时从缓存获取系统提示词

系统 SHALL 在 AI 聊天构建消息时从 IndexedDB 缓存读取当前语言对应的系统提示词静态部分，若读取失败则自动生成。

#### Scenario: 正常读取缓存

- **WHEN** `getAgentsMd()` 被调用且缓存中存在当前语言的 `agents_md_{lang}` 记录
- **THEN** 系统返回缓存的 Markdown 内容作为系统提示词静态部分

#### Scenario: 缓存缺失时自动生成

- **WHEN** `getAgentsMd()` 被调用但缓存中不存在当前语言对应的记录
- **THEN** 系统自动生成该语言的缓存并返回内容

---

### Requirement: 语言切换时切换到对应语言文件

系统 SHALL 在用户切换语言时自动切换到新语言的 `AGENTS.{lang}.md`，若该语言文件不存在则新增，旧语言文件保留不覆盖。

#### Scenario: 切换到已存在的语言文件

- **WHEN** 用户将语言从 `zh-CN` 切换为 `en` 且 `agents_md_en` 缓存已存在
- **THEN** 系统直接使用 `agents_md_en` 的内容，不执行生成操作

#### Scenario: 切换到不存在的语言文件

- **WHEN** 用户将语言从 `zh-CN` 切换为 `en` 但 `agents_md_en` 缓存不存在
- **THEN** 系统从英文 `systemPrompt` i18n 数据组装 Markdown 内容，写入 IndexedDB key `"agents_md_en"`

#### Scenario: 旧语言文件保留

- **WHEN** 语言切换完成后
- **THEN** 旧语言的 `agents_md_{old_lang}` 记录在 IndexedDB 中保持不变

---

### Requirement: 调试模式下查看和修改系统提示词

系统 SHALL 在"高级"设置区域提供「系统提示词」入口，仅在调试模式开启时可见，支持预览当前语言 `AGENTS.{lang}.md` 的 Markdown 渲染内容和直接编辑修改。

#### Scenario: 调试模式开启时显示入口

- **WHEN** 用户在"高级"设置中开启调试模式
- **THEN** 系统在"高级"设置区域显示「系统提示词」入口按钮

#### Scenario: 调试模式关闭时隐藏入口

- **WHEN** 用户在"高级"设置中关闭调试模式
- **THEN** 系统在"高级"设置区域隐藏「系统提示词」入口按钮

#### Scenario: 预览系统提示词

- **WHEN** 用户在"高级"设置中点击「系统提示词」按钮
- **THEN** 系统从缓存读取当前语言 `agents_md_{lang}` 内容，弹出模态框以 Markdown 渲染方式展示

#### Scenario: 编辑系统提示词

- **WHEN** 用户在预览模态框中点击「编辑」按钮
- **THEN** 系统将模态框内容切换为可编辑的文本域，文本域中显示原始 Markdown 文本

#### Scenario: 保存修改

- **WHEN** 用户在编辑模式下修改内容后点击「保存」
- **THEN** 系统将修改后的内容写入 IndexedDB 当前语言的 `agents_md_{lang}` 记录，后续 AI 聊天使用修改版

#### Scenario: 重置为默认

- **WHEN** 用户在编辑模式下点击「重置为默认」
- **THEN** 系统从 i18n 重新生成当前语言的原始 Markdown 内容并覆盖 IndexedDB 缓存

#### Scenario: 缓存不存在时点击入口

- **WHEN** 用户点击「系统提示词」按钮但缓存不存在
- **THEN** 系统自动生成当前语言缓存后再展示内容
