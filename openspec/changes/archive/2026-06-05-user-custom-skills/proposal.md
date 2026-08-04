## Why

当前技能系统依赖三个 storage 键协同工作，架构复杂且存在冗余：

- `ai_helper_skill_overrides`：内置于出厂 .md 的补丁（删除/编辑），本质上只是 user diff
- `ai_helper_user_skills`：用户技能 DTO 数组，独立存储
- `ai_helper_skill_history`：编辑版本历史

内置技能每次打开扩展都从 `.md` 文件重新 fetch，然后叠加 overrides 补丁。这导致扩展更新后无法感知用户是否手动编辑过技能，要么全量覆盖要么全量保留，缺乏精细的合并能力。

此外，当前代码通过 `getTools()` / `getUIDelegate()` 预留了从未使用的抽象层，`loadAllSkills()` 已耦合加载+存储恢复+覆盖应用三个职责。

## What Changes

**存储层统一**：
- **新增** `ai_helper_skills` 键作为技能唯一真源：内置技能、用户技能全部存于同一 key，以 `type: 'builtin' | 'user'` 区分
- **移除** `ai_helper_skill_overrides` 键：删除/编辑不再走补丁层，直接在 skill 对象上修改，`deleted` 布尔字段标记软删除
- **移除** `ai_helper_user_skills` 键：用户技能并入 `ai_helper_skills`
- **保留** `ai_helper_skill_history`：编辑历史不变

**初始化策略转变**：
- 首次安装时：从 `.md` 文件种子写入 `ai_helper_skills`，后续直接从 storage 读取，不再每次 fetch .md
- 扩展版本更新时：通过 `_seededAt` 版本号 + `_originalPrompt` 对比，自动合并 .md 变更与用户编辑（用户改过的保留，没改过的更新）
- 语言切换时：重新从 .md 种子对应语言的 builtin 技能，但不触碰 `type: 'user'` 的技能

**对象模型简化**：
- **新增** `source: 'builtin' | 'user'` 字段，替代布尔标记
- **新增** `createSkill(dto)` 工厂函数，DTO → 运行时对象
- **重构** `loadAllSkills()` 为 `bootstrap()`
- **移除** `getTools()` 和 `getUIDelegate()`

**重置逻辑调整**：
- 重置技能不再 fetch .md，改为从 `ai_helper_skill_history` 第一条记录恢复

## Capabilities

### New Capabilities
- `unified-skill-storage`：基于 `ai_helper_skills` 的统一持久化，含首次种子、版本合并、语言切换重种子
- `user-skill-crud`：用户技能的创建/编辑/删除，与 builtin 在同一存储中平级管理

### Modified Capabilities
- `skill-system`：移除 getTools/getUIDelegate，新增 source 字段
- `skill-md-loader`：._parseSkillMd() 返回值调整为纯 DTO

### Removed Capabilities
- `skill-overrides`（原 ai_helper_skill_overrides 补丁体系）

## Impact

- `shared/skill-storage.js` — 重构为统一读写 `ai_helper_skills`
- `shared/skill-registry.js` — bootstrap() / createSkill() / _seedFromMd() / _mergeUpdate()
- `shared/skill-user-storage.js` — **废弃**（用户技能并入统一存储）
- `shared/skill-history.js` — 不变
- `shared/chat.js` — 移除 getTools 遍历
- `chrome-extension/src/panel/panel.js` — init() 调用 bootstrap()，技能 Tab 新增创建/编辑/删除 UI
- `chrome-extension/src/panel/panel.html` — 新增创建表单 HTML
- `shared/css/panel.css` — 新增表单样式
- `firefox-extension/` 对应文件 — 通过 sync.sh 同步
