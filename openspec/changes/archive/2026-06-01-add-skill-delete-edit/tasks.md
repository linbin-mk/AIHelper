## 1. SkillRegistry 增强

- [x] 1.1 新增 `_deletedIds` Set 成员，保持 `_editedSkills` Map 成员（追踪哪些技能有编辑）
- [x] 1.2 新增 `unregister(skillId)` 方法：将技能 ID 加入 `_deletedIds`，发送 `unregister` 事件通知
- [x] 1.3 新增 `update(skillId, fields, langSuffix)` 方法：更新技能字段（name、description、_prompt、category），标记 `_edited=true`、`_editedLang=langSuffix`，发送 `update` 事件通知
- [x] 1.4 修改 `getAll()` 方法：过滤掉 `_deletedIds` 中的技能
- [x] 1.5 新增 `getOverrides()` 方法：返回 `{ deletedIds, editedSkills: { <id>: { cn/en: {...} } } }` 按语言分版本的结构
- [x] 1.6 新增 `applyOverrides(overrides)` 方法：恢复已删除技能，按当前语言应用编辑覆盖
- [x] 1.7 新增 `resetSkill(skillId, langSuffix)` 方法：清除当前语言版本的编辑记录，从源文件重新加载该语言版本的技能内容

## 2. 持久化存储

- [x] 2.1 在 `shared/` 下新增 `skill-storage.js`：封装 `ai_helper_skill_overrides` 键的 `saveOverrides()` / `loadOverrides()` 函数（遵循 favorites-manager.js 的 chrome.storage.local 模式）
- [x] 2.2 修改 `SkillRegistry.loadAllSkills()`：加载完所有内置技能后，从 storage 读取 overrides 并调用 `applyOverrides()`（按当前语言应用编辑，全局应用删除）
- [x] 2.3 修改 `SkillRegistry.unregister()`：标记删除后调用 `saveOverrides()` 持久化
- [x] 2.4 修改 `SkillRegistry.update()`：更新字段后调用 `saveOverrides()` 持久化

## 3. 技能删除 UI

- [x] 3.1 在 `panel.html` / `popup.html` 的技能右键菜单 `#skillContextMenu` 中新增「删除」选项（`data-action="delete"`，danger 样式）
- [x] 3.2 在 `panel.js` / `popup.js` 中新增 `handleDeleteSkill(skillId)` 函数：调用 `registry.unregister(skillId)`，关闭菜单，刷新技能列表，显示 Toast 提示
- [x] 3.3 修改右键菜单行为：将 `data-skill-id` 属性绑定到菜单容器（而非仅 favorite 操作），统一处理点击事件

## 4. 技能编辑 UI（语言感知）

- [x] 4.1 在 `panel.html` / `popup.html` 的 `#skillDetailOverlay` 详情弹窗 header 中：
  - 新增「编辑」按钮（`id="skillDetailEditBtn"`）
  - 新增「已编辑」标签（`id="skillDetailEditedTag"`，默认隐藏，显示时标注语言如「已编辑(中文)」）
  - 新增「重置」按钮（`id="skillDetailResetBtn"`，默认隐藏）
- [x] 4.2 在 `#skillDetailOverlay` 弹窗 body 中新增编辑模式表单 `#skillDetailEditForm`（默认隐藏），包含：
  - 名称输入框 `#skillEditName`
  - 描述文本框 `#skillEditDesc`
  - 提示内容多行文本框 `#skillEditPrompt`
  - 「保存」按钮 `#skillEditSaveBtn` 和「取消」按钮 `#skillEditCancelBtn`
- [x] 4.3 新增 `getCurrentLangSuffix()` 工具函数：根据 `window.__i18nMessages._lang` 返回 `'cn'` 或 `'en'`
- [x] 4.4 新增 `enterSkillEditMode(skill)` 函数：
  - 将详情内容区 `#skillDetailBody` 隐藏
  - 显示 `#skillDetailEditForm`，预填当前技能字段（当前语言版本的值）
  - 隐藏「使用」和「编辑」按钮
- [x] 4.5 新增 `exitSkillEditMode()` 函数：
  - 隐藏 `#skillDetailEditForm`
  - 显示 `#skillDetailBody`
  - 显示「使用」和「编辑」按钮
- [x] 4.6 新增 `saveSkillEdit()` 函数：
  - 读取表单字段值
  - 调用 `registry.update(skillId, { name, description, _prompt, category }, getCurrentLangSuffix())`
  - 调用 `exitSkillEditMode()`，刷新详情弹窗内容
  - 调用 `renderSkillsList()` 刷新技能列表
  - 显示 Toast 提示「保存成功」
- [x] 4.7 修改 `showSkillDetail(skill)` 函数：
  - 根据 `getCurrentLangSuffix()` 检查当前语言版本 `_edited` 状态
  - 如果当前语言版本已编辑，显示「已编辑(中文)」或「已编辑(英文)」标签和「重置」按钮
  - 如果当前语言版本未编辑，隐藏标签和「重置」按钮
- [x] 4.8 新增 `resetSkillEdit(skillId)` 函数：
  - 调用 `registry.resetSkill(skillId, getCurrentLangSuffix())`
  - 刷新详情弹窗内容
  - 调用 `renderSkillsList()` 刷新技能列表
  - 显示 Toast 提示「已重置为默认值」

## 5. 事件绑定与集成

- [x] 5.1 绑定编辑按钮点击事件：`#skillDetailEditBtn` → `enterSkillEditMode()`
- [x] 5.2 绑定保存按钮点击事件：`#skillEditSaveBtn` → `saveSkillEdit()`
- [x] 5.3 绑定取消按钮点击事件：`#skillEditCancelBtn` → `exitSkillEditMode()`
- [x] 5.4 绑定重置按钮点击事件：`#skillDetailResetBtn` → `resetSkillEdit()`
- [x] 5.5 修改技能右键菜单点击处理：支持 `data-action="delete"` → `handleDeleteSkill()`
- [x] 5.6 监听 SkillRegistry 的 `unregister` 和 `update` 事件，自动触发 UI 刷新（可选优化）

## 6. 同步与验证

- [x] 6.1 运行 `bash sync.sh` 将 shared/ 修改同步到 chrome-extension 和 firefox-extension
- [x] 6.2 在 Chrome 中加载扩展，测试删除/编辑/重置技能功能
- [x] 6.3 重启扩展面板，验证删除和编辑状态持久化
- [x] 6.4 在 Firefox 中加载扩展，测试删除/编辑/重置技能功能
