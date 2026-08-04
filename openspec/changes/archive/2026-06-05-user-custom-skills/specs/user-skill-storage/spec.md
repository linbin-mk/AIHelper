## ADDED Requirements

### Requirement: 统一技能持久化存储 — 两集合模型
系统 SHALL 使用 `chrome.storage.local` 键 `ai_helper_skills` 作为所有技能的唯一持久化存储。键内部按语言隔离为 `cn` / `en` 两个平级集合，每个集合为 `{ skillId → skillObject }` Map。每个 skill 对象包含 `id`、`name`、`description`、`category`、`prompt`、`type`、`deleted`，builtin 技能额外包含 `_originalPrompt`。根级含 `_seededVersion` 记录扩展版本。

#### Scenario: 内置技能和用户技能共存于同一语言集合
- **WHEN** 用户已在中文环境创建 1 个自定义技能
- **THEN** `data.cn` 中同时包含 `type: 'builtin'` 和 `type: 'user'` 的技能

#### Scenario: 首次安装种子当前语言集合
- **WHEN** 新用户首次打开扩展，`ai_helper_skills` 不存在，当前语言 zh-CN
- **THEN** 从 skill.cn.md 种子全部 builtin 写入 `data.cn`，`_seededVersion` 记为当前版本，`data.en` 不创建

#### Scenario: 后续启动从当前语言集合直接读取
- **WHEN** 已种子过的用户重新打开扩展，`data.cn` 存在且版本匹配
- **THEN** 直接从 `data.cn` 加载技能，不发 .md fetch

#### Scenario: 编辑后持久化到当前语言集合
- **WHEN** 用户在中文环境编辑 code-master 的 prompt
- **THEN** `data.cn["code-master"].prompt` 直接更新并写回 storage

### Requirement: 用户技能 CRUD 操作
系统 SHALL 支持对当前语言集合中 `type: 'user'` 技能的创建、编辑、删除操作。用户技能仅存在于创建时的语言集合中。

#### Scenario: 创建用户技能写入当前语言集合
- **WHEN** 用户在中文环境创建自定义技能
- **THEN** 新技能以 `user-{timestamp36}-{random4}` 为 id 写入 `data.cn`，`type` 为 `'user'`，自动注册到 SkillRegistry

#### Scenario: 切换到英文后用户技能不可见
- **WHEN** 用户在中文环境创建了自定义技能，切换到英文
- **THEN** 英文环境技能列表中不显示该自定义技能

#### Scenario: 切回中文后用户技能恢复可见
- **WHEN** 用户从英文切回中文
- **THEN** 之前在中文环境创建的自定义技能重新出现在列表中

#### Scenario: 编辑用户技能
- **WHEN** 用户编辑自定义技能的 prompt 并保存
- **THEN** 当前语言集合中该技能的 prompt 直接更新，编辑前快照写入 `ai_helper_skill_history`

#### Scenario: 删除用户技能
- **WHEN** 用户删除自定义技能
- **THEN** 当前语言集合中该技能的 `deleted` 设为 `true`，从技能列表消失

#### Scenario: 恢复已删除的用户技能
- **WHEN** 用户在"已删除"列表中恢复某个用户技能
- **THEN** 该技能的 `deleted` 设为 `false`，重新出现在技能列表中

### Requirement: 用户技能 ID 生成
用户技能 ID SHALL 以 `user-` 为前缀，确保与内置技能 ID 无冲突。

#### Scenario: 生成唯一 ID
- **WHEN** 用户创建新技能
- **THEN** 生成的 ID 以 `user-` 开头，后跟时间戳和随机字符串

### Requirement: 用户技能 UI 创建表单
系统 SHALL 在"技能"Tab 提供创建技能的入口。

#### Scenario: 创建入口可见
- **WHEN** 用户查看"技能"Tab
- **THEN** 页面显示「+ 创建技能」按钮

#### Scenario: 创建表单字段
- **WHEN** 用户点击创建
- **THEN** 弹出表单，包含名称（必填）、描述、分类（下拉选择）、prompt 正文（必填）

#### Scenario: 创建成功
- **WHEN** 用户填写并保存
- **THEN** 新技能立即出现在分类列表中，附"自定义"标签

### Requirement: 用户技能复用编辑历史
系统 SHALL 复用 `ai_helper_skill_history` 记录用户技能的编辑历史。key 格式为 `{userSkillId}:{currentLang}`。用户可通过历史系统恢复任意历史版本。

#### Scenario: 编辑产生历史版本
- **WHEN** 用户编辑自定义技能并保存
- **THEN** 编辑前的 name/description/prompt 作为快照写入历史（key 为 `user-xxx:cn`）

#### Scenario: 通过历史恢复版本
- **WHEN** 用户对自定义技能的某个历史版本执行恢复
- **THEN** 从历史中读取该版本快照，覆盖 name/description/prompt 并写回 storage
