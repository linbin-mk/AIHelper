## Context

当前技能列表加载自扩展包内的静态 Markdown 文件（`skills/*/skill.{cn,en}.md`），通过 `SkillRegistry` 解析 YAML 前置元数据和 Markdown 正文注册到内存。技能详情弹窗只展示内容并提供「使用」按钮，右键菜单仅有「收藏」功能。用户无法在 UI 中删除不需要的技能或编辑技能内容。

本设计需要同时工作在 Chrome (Side Panel) 和 Firefox (Sidebar) 两个平台，共享 `shared/skill-registry.js` 中的核心逻辑。

## Goals / Non-Goals

**Goals:**
- 支持用户右键删除技能，被删除的技能从技能列表中隐藏，状态持久化到 `chrome.storage.local`
- 支持用户在技能详情弹窗点击编辑按钮，进入编辑模式修改技能名称、描述、提示内容，保存后即时生效并持久化
- 提供重置功能，允许用户将编辑过的技能恢复为内置默认值，或恢复被删除的技能

**Non-Goals:**
- 不支持用户创建全新技能（仅编辑现有技能）
- 不修改扩展包内的静态技能文件（所有修改仅在运行时内存和 storage 中生效）
- 不改变技能的加载顺序或扩展打包流程

## Decisions

### 决策 1: 编辑/删除状态存储在 `chrome.storage.local`，按语言分版本

**选型**: `chrome.storage.local` 的键 `ai_helper_skill_overrides`

**数据结构**（编辑按语言分版本，删除不区分语言）:
```json
{
  "deletedIds": ["skill-id-1", "skill-id-2"],
  "editedSkills": {
    "skill-id-3": {
      "cn": {
        "name": "自定义名称",
        "description": "自定义描述",
        "_prompt": "自定义提示内容（中文版）",
        "category": "Development"
      },
      "en": {
        "name": "Custom Name",
        "description": "Custom Description",
        "_prompt": "Custom prompt content (English version)",
        "category": "Development"
      }
    }
  }
}
```

**语言感知逻辑**:
- 编辑时根据当前 UI 语言（`window.__i18nMessages._lang` → `zh-CN` 或 `en`）决定编辑哪个语言版本
- 中文模式编辑 → 保存到 `editedSkills.<id>.cn`，预览时显示中文内容
- 英文模式编辑 → 保存到 `editedSkills.<id>.en`，预览时显示英文内容
- 删除是全局操作，不区分语言版本
- 重置按语言维度：中文模式重置 → 仅清除 `cn` 编辑，恢复中文内置内容

**理由**: 
- 与收藏夹 `FavoritesManager` 使用相同的存储机制，模式一致
- `chrome.storage.local` 支持跨扩展页面（panel/popup、background、content scripts）读写
- 无需额外依赖或权限

**替代方案**:
- IndexedDB：过于复杂，数据量小（几个字段），不需要
- 文件系统（修改源文件）：扩展打包后文件只读，无法实现

### 决策 2: SkillRegistry 新增方法而非重建实例

**选型**: 在现有 `SkillRegistry` 类上新增 `unregister(skillId)` 和 `update(skillId, fields)` 方法。

```js
// 移除技能（标记删除，被删除的技能从 getAll() 中过滤掉）
unregister(skillId) {
  this._deletedIds.add(skillId);
  this._notify({ type: 'unregister', skillId });
}

// 更新技能字段（覆盖内置属性），langSuffix 为 'cn' 或 'en'
update(skillId, fields, langSuffix) {
  var skill = this._skills.get(skillId);
  if (!skill) return false;
  if (fields.name !== undefined) skill.name = fields.name;
  if (fields.description !== undefined) skill.description = fields.description;
  if (fields._prompt !== undefined) skill._prompt = fields._prompt;
  if (fields.category !== undefined) skill.category = fields.category;
  skill._edited = true;
  skill._editedLang = langSuffix;
  this._notify({ type: 'update', skillId });
  return true;
}

// 获取用户修改过的技能数据（按语言结构存储）
getOverrides() {
  var deletedIds = Array.from(this._deletedIds);
  var editedSkills = {};
  this._skills.forEach(function(skill, id) {
    if (skill._edited) {
      var lang = skill._editedLang || 'cn';
      if (!editedSkills[id]) editedSkills[id] = {};
      editedSkills[id][lang] = {
        name: skill.name,
        description: skill.description,
        _prompt: skill._prompt,
        category: skill.category
      };
    }
  });
  return { deletedIds, editedSkills };
}
```

**理由**:
- `SkillRegistry` 是技能数据的唯一来源，在 registry 层过滤/覆盖最简单
- 对外接口 `getAll()` 自动过滤被删除的技能，UI 层无需感知删除逻辑
- 对外接口 `getAll()` 返回的 Skill 对象已包含编辑后的值，UI 层无需感知编辑逻辑

**替代方案**:
- 在 `renderSkillsList()` 中做过滤和覆盖：需要修改多处 UI 代码，且其他调用 `getAll()` 的地方（如 `/` 自动补全面板、`FavoritesManager.validateSkillIds()`）也需要同步修改，容易遗漏

### 决策 3: 编辑后技能在详情弹窗显示「已编辑」标识和「重置」按钮

**选型**: 详情弹窗 header 区增加状态标识：
- 内置技能：不显示标识
- 当前语言版本被用户编辑过：显示「已编辑」标签（标注语言，如「已编辑(中文)」或「已编辑(英文)」）+ 「重置」按钮（重置当前语言版本为内置默认值）

### 决策 4: 编辑按语言维度操作

**选型**: 用户编辑时，根据扩展当前 UI 语言决定编辑哪个语言版本：
- 中文模式（`zh-CN`）→ 编辑 `skill.cn.md` 对应的内容，持久化到 `editedSkills.<id>.cn`
- 英文模式（`en`）→ 编辑 `skill.en.md` 对应的内容，持久化到 `editedSkills.<id>.en`
- 每个语言版本的编辑独立，互不影响
- 重置操作仅重置当前语言版本（不重置另一语言版本的编辑）

**理由**: 技能本身就分为中文和英文两个版本（`skill.cn.md` / `skill.en.md`），编辑应遵循同样的语言分离逻辑。用户在不同语言下可能需要不同的定制内容。

### 决策 5: 编辑模式使用内联表单替换详情内容

**选型**: 点击「编辑」按钮后，将详情弹窗的内容区替换为表单：
- 名称：`<input type="text">`
- 描述：`<textarea>` （单行）
- 提示内容：`<textarea>` （多行，较大高度）
- 底部：「保存」按钮 + 「取消」按钮

保存时调用 `SkillRegistry.update()` 并持久化到 storage，然后刷新详情展示和技能列表。

**理由**:
- 避免弹窗内再嵌套弹窗，简化交互
- 编辑模式复用现有详情弹窗容器，减少 DOM 开销
- 保存后即时刷新列表和详情，视觉反馈及时

### 决策 6: `loadAllSkills()` 完成后加载 overrides 并应用

**选型**: 在 `loadAllSkills()` 末尾新增步骤：
1. 加载所有内置技能（现有流程）
2. 从 `chrome.storage.local` 读取 `ai_helper_skill_overrides`
3. 遍历 `deletedIds`，对每个 ID 调用 `unregister()`
4. 遍历 `editedSkills`，对每个 ID 调用 `update()`

**理由**: 确保扩展启动时已持久化的编辑/删除状态被正确恢复。

## Risks / Trade-offs

- **[风险] 扩展更新后内置技能内容可能有变更，但用户旧编辑内容会覆盖新版本**
  → 缓解：在存储中记录编辑时间戳和原始内容 hash，未来可提示用户内置技能已更新

- **[风险] 用户删除技能后可能影响收藏夹中已收藏的该技能**
  → 缓解：`FavoritesManager.validateSkillIds()` 已通过 `registry.getAll()` 校验技能 ID 有效性，被删除的技能会自动从验证结果中过滤

- **[取舍] 编辑后的技能 category 变更可能导致排序位置变化**
  → 接受：这对用户而言是预期行为——修改 category 就是为了调整分类
