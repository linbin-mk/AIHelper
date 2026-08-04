## 1. Phase 1: 架构重构 — 统一存储（无用户可见变化）

### 1.1 skill-storage.js — 重构为统一读写 + 两集合模型
- [x] 1.1.1 新增 `loadAiHelperSkills()` → 返回 `{ cn: {...}, en: {...}, _seededVersion }` 或 `null`
- [x] 1.1.2 新增 `saveAiHelperSkills(data)` → 全量写入 `ai_helper_skills`
- [x] 1.1.3 新增 `getSeededVersion()` / `setSeededVersion(ver)` — 读写 `_seededVersion`
- [x] 1.1.4 保留旧 `loadOverrides()` / `saveOverrides()` 标记 deprecated

### 1.2 skill-registry.js — createSkill() + type 字段
- [x] 1.2.1 新增 `createSkill(dto)` — 接收纯 DTO，返回 `Object.assign(Object.create(null), dto, { getPrompt: () => dto.prompt })`
- [x] 1.2.2 修改 `_parseSkillMd()` — 返回值仅 `{ id, name, description, category, prompt }`，移除 getPrompt/getTools/getUIDelegate
- [x] 1.2.3 修改 `_loadOneSkill()` — 接收 `langSuffix` 参数，调用 `this.register(createSkill({ ...dto, type: 'builtin', deleted: false }))`

### 1.3 skill-registry.js — bootstrap() + _seedLanguage()
- [x] 1.3.1 新增 `_seedLanguage(lang)` — fetch skills.json → 并行 _loadOneSkill(skillId, lang) → 设置 `_editVersion: 0` → 写入 `data[lang]` → saveAiHelperSkills
- [x] 1.3.2 新增 `_loadFromStorage(lang)` — 从 `data[lang]` 加载 `deleted !== true` 的技能 → register(createSkill(dto))
- [x] 1.3.3 新增 `bootstrap()` — 决策链：无 data → _seedLanguage(currentLang); data[currentLang] 不存在 → _seedLanguage(currentLang) 懒种子; 版本不匹配 → _mergeBuiltinUpdate(currentLang); _loadFromStorage(currentLang)
- [x] 1.3.4 修改 `register()` / `unregister()` — 不再操作 `_deletedIds` Set，改为操作 skill 对象 `deleted` 字段 + 同步 `data[currentLang]`
- [x] 1.3.5 新增 `_syncToStorage()` — 将内存 _skills 序列化到 `data[currentLang]` + `saveAiHelperSkills()`
- [x] 1.3.6 修改 `getAll()` — 过滤条件改为 `!s.deleted`

### 1.4 skill-registry.js — _mergeBuiltinUpdate(lang) 扩展更新合并
- [x] 1.4.1 实现合并逻辑：对 `data[lang]` 中每个 `type === 'builtin'` 的技能，fetch 新版 .md。`_editVersion === 0` → 全量覆盖；`_editVersion > 0` → 完全保留
- [x] 1.4.2 更新 `_seededVersion`

### 1.5 skill-registry.js — switchLanguage() 语言切换
- [x] 1.5.1 新增 `switchLanguage(targetLang)`：
  - `_syncToStorage()` 保存当前集合
  - `data[targetLang]` 不存在 → `_seedLanguage(targetLang)` 懒种子
  - 清空 `_skills` / `_activeIds`
  - `_loadFromStorage(targetLang)`
- [x] 1.5.2 `panel.js` 语言切换事件中调用 `skillRegistry.switchLanguage(newLang)` 替代 `loadAllSkills()`

### 1.6 skill-registry.js — 用户编辑 Builtin Skill
- [x] 1.6.1 修改 `update()` — 编辑前 addHistoryEntry(skillId, currentLang, ...) → 直接改 skill 对象字段 → skill._editVersion++（仅 builtin）→ _syncToStorage()
- [x] 1.6.2 移除 `resetSkill()` 方法 — 由 UI 通过历史系统直接实现恢复功能
- [x] 1.6.3 移除 `getOverrides()` / `applyOverrides()` 及所有 `saveOverrides()` 调用

### 1.7 迁移旧 overrides 数据
- [x] 1.7.1 bootstrap 中检测旧 `ai_helper_skill_overrides` 键存在 → 读取 → 将 deletedIds/editedSkills 应用到当前语言集合 → 删除旧键

### 1.8 chat.js — 移除 getTools 遍历
- [x] 1.8.1 `executeToolCall()` — 移除 `registry.getAll()` 遍历 `getTools()` 的 for 循环
- [x] 1.8.2 `buildMergedTools()` — 移除遍历 `all[i].getTools()` 的 for 循环

### 1.9 调用入口切换
- [x] 1.9.1 `panel.js init()` — `loadAllSkills()` → `bootstrap()`
- [x] 1.9.2 `popup.js`（Firefox）— 同上
- [x] 1.9.3 `panel.js` / `popup.js` 语言切换 — `loadAllSkills()` → `switchLanguage(targetLang)`

### 1.10 测试
- [x] 1.10.1 更新 `skill-registry.test.js` — 移除 getTools/getUIDelegate，新增 type / seedLanguage / switchLanguage / _editVersion / merge 测试
- [x] 1.10.2 更新 `test-runner.js` — 适配两集合结构、新 DTO、新 API

---

## 2. Phase 2: 用户技能功能

### 2.1 用户技能注册到当前语言集合
- [x] 2.1.1 `_loadFromStorage()` 中 `type === 'user'` 与 builtin 统一 register
- [x] 2.1.2 新增 `createUserSkill(name, desc, category, prompt)` — 生成 user-xxx ID → register → _syncToStorage

### 2.2 用户技能编辑
- [x] 2.2.1 复用 `update()` — addHistoryEntry → 改字段 → _syncToStorage
- [x] 2.2.2 历史恢复 — UI 通过调用 `getHistory()` + 覆写字段 + `_syncToStorage()` 实现，不走专用 reset 方法

### 2.3 用户技能删除
- [x] 2.3.1 复用 unregister — `skill.deleted = true` → _syncToStorage
- [x] 2.3.2 恢复 — `skill.deleted = false` → register → _syncToStorage

---

## 3. Phase 3: 用户技能 UI

- [x] 3.1 `panel.html` — 创建技能「+」按钮和表单弹窗 HTML 模板
- [x] 3.2 `panel.js` — 创建表单交互（打开/关闭/保存/验证）
- [x] 3.3 `panel.js` — 编辑交互（复用现有编辑流程）
- [x] 3.4 `panel.js` — 删除交互（确认 → unregister）
- [x] 3.5 `panel.js` — 用户技能显示"自定义"标签（`type === 'user'`）
- [x] 3.6 `panel.css` — 表单和标签样式
- [x] 3.7 Firefox `popup.js` / `popup.html` — 同 Chrome

---

## 4. 同步与验证

- [x] 4.1 运行 `bash sync.sh`，确保持久化修改同步到 Chrome / Firefox
- [x] 4.2 运行 `node test-runner.js`，所有测试通过
- [x] 4.3 手动验证 Chrome
- [x] 4.4 手动验证 Firefox
