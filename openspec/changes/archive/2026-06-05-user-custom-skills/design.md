## Context

当前架构存在三重冗余：

```
                   每次打开都重新 fetch .md
                   ┌─────────────────┐
  skills/*.md ────▶│ _parseSkillMd() │──▶ register()
                   └────────┬────────┘
                            │
  ai_helper_skill_overrides │  补丁叠加
  { deletedIds, edits } ────┘
                            │
  ai_helper_user_skills     │  用户技能
  [ DTO, ... ] ─────────────┘
```

目标：`ai_helper_skills` 作为唯一真源，内置技能首次种子后从 storage 读取，用户编辑直接在对象上修改，`type` 字段区分来源。

### 约束
- 所有持久化数据存储在 `chrome.storage.local`
- 用户技能使用单一 `prompt` 字段，不跟随 UI 语言切换
- 中英文技能各自独立存储为两套集合（cn / en），用户编辑按语言隔离
- 扩展更新时需感知 builtin 技能的 .md 变更并自动合并用户编辑
- 通过 `sync.sh` 保持 Chrome / Firefox 双平台一致

## Goals / Non-Goals

**Goals:**
- `ai_helper_skills` 作为技能唯一真源，淘汰 overrides 和 user_skills
- 首次安装从 .md 种子当前语言集合，后续从 storage 加载
- 扩展更新时自动合并 .md 变更：用户编辑过的字段保留，未编辑的更新
- 中英文技能集合独立演化，用户编辑按语言隔离
- 用户技能与内置技能在同一集合中平级管理
- 统一软删除：`deleted` 布尔字段替代 `_deletedIds` Set
- 用 `_editVersion` 计数器替代 `_original*` 字符串比对，判断用户是否编辑过
- 移除 getTools / getUIDelegate

**Non-Goals:**
- 用户技能不支持中英文双语 prompt（V1 单语言）
- 不提供导入/导出/分享
- 不支持跨设备同步（chrome.storage.local 限制）

## Decisions

### 1. 统一存储键 `ai_helper_skills` — 两集合模型

**数据结构**：

```json
{
  "_seededVersion": "1.5.0",

  "cn": {
    "code-master": {
      "id": "code-master",
      "name": "代码大师",
      "description": "AI 向导式代码开发...",
      "category": "Development",
      "prompt": "你是\"代码大师\"...（用户可能在中文下编辑过）",
      "_editVersion": 3,
      "type": "builtin",
      "deleted": false
    },
    "user-m2k3n8x1": {
      "id": "user-m2k3n8x1",
      "name": "我的PRD专家",
      "description": "帮我写产品需求文档",
      "category": "Product",
      "prompt": "你是一名资深产品经理...",
      "type": "user",
      "deleted": false,
      "createdAt": 1700000000000,
      "updatedAt": 1700000001000
    }
  },
  "en": {
    "code-master": {
      "id": "code-master",
      "name": "Code Master",
      "description": "AI-guided code development...",
      "category": "Development",
      "prompt": "You are Code Master...",
      "_editVersion": 0,
      "type": "builtin",
      "deleted": false
    }
  }
}
```

| 层级 | 字段 | 说明 |
|---|---|---|
| 根级 | `_seededVersion` | 两个语言集合共用，记录上次 .md 种子写入时的扩展版本 |
| `cn` / `en` | — | 按语言隔离的技能 Map `{ id → skill对象 }` |
| skill | `id` | 唯一标识（builtin 为 .md 中定义的 id，user 为 `user-xxx`） |
| skill | `name` / `description` | 展示用，按语言不同 |
| skill | `category` | Business / Product / Development / Testing / Other |
| skill | `prompt` | 当前生效的提示词正文（用户可能编辑过） |
| skill | `_editVersion` | builtin 编辑次数计数器，种子时为 0，每次用户编辑 +1 |
| skill | `type` | `'builtin'` 或 `'user'` |
| skill | `deleted` | 软删除标记（cn 和 en 各自独立管理） |
| skill | `createdAt` / `updatedAt` | 仅 user 技能 |

**关键语义**：

| | cn 集合 | en 集合 |
|---|---|---|
| builtin 技能 | 从 `skill.cn.md` 种子 | 从 `skill.en.md` 种子 |
| 编辑 | 中文编辑只影响 cn | 英文编辑只影响 en |
| 删除 | 删除中文版不影响英文版 | 删除英文版不影响中文版 |
| user 技能 | 用户在中文环境创建的，只存于 cn | 用户在英文环境创建的，只存于 en |
| 名称/描述 | 各语言 .md 中的对应值 | 各语言 .md 中的对应值 |

**原因**：中英文技能的名称、描述、prompt 正文完全不同（是两套 .md 文件），它们在语义上就是两个独立的技能实例。用顶层 `cn` / `en` 键隔离，结构扁平清晰，每条语言路径下所有技能平级存储，不需要在单个 skill 对象内部嵌套语言维度的子字段。

### 2. 初始化流程

```
bootstrap()
│
├─ currentLang = 'cn' | 'en'
├─ data = chrome.storage.local.get('ai_helper_skills')
│
├─ if (data 不存在):
│     _seedLanguage(currentLang)      ← 首次安装，种子当前语言
│     return
│
├─ // ──── data 已存在 ────
│
├─ if (!data[currentLang]):
│     _seedLanguage(currentLang)      ← 新语言集合不存在，懒种子
│     return
│
├─ if (_seededVersion !== 当前扩展版本):
│     _mergeBuiltinUpdate(currentLang) │ 当前语言版本比对新 .md 合并编辑
│
└─ _loadFromStorage(currentLang)       ← 从 data[currentLang] 加载未删除技能
```

**首次种子 `_seedLanguage(lang)`**：
```
fetch skills.json → parallel _loadOneSkill × N (指定 lang 后缀)
  └─ for each builtin:
       dto = _parseSkillMd(text)
       dto._editVersion = 0          ← 出厂标记，未编辑
       dto.type = 'builtin'
       dto.deleted = false
       register(createSkill(dto))

data = loadAiHelperSkills() || {}
data[lang] = serializeAll()
data._seededVersion = CURRENT_VERSION
saveAiHelperSkills(data)
```

**懒种子** — 用户首次切换到另一种语言时：
```
data[en] 不存在:
  _seedLanguage('en')  ← 只种子 en 集合，cn 集合不动
  // data._seededVersion 已设为当前版本号
  _loadFromStorage('en')
```

**扩展更新合并 `_mergeBuiltinUpdate(lang)`**：
```
for each skill in data[lang] where type === 'builtin':
  newDto = fetch + _parseSkillMd from .md (对应 lang 后缀)

  if (skill._editVersion === 0):
    // 用户从未编辑 → 直接用新版覆盖全部字段
    全部字段 = newDto
  else:
    // _editVersion > 0 → 用户编辑过 → 全部保留，不做任何覆盖

  // 无论如何 _editVersion 保持不变（用户编辑状态不受更新影响）

data._seededVersion = CURRENT_VERSION
saveAiHelperSkills(data)
```

**从存储加载 `_loadFromStorage(lang)`**：
```
for each [id, dto] in Object.entries(data[lang]):
  if (!dto.deleted):
    register(createSkill({ ...dto }))
```

### 3. 语言切换

```
switchLanguage(targetLang):
  1. 当前内存中的技能状态（编辑/删除/激活）已在运行时通过
     update() / unregister() / 直接赋值 同步到了 data[currentLang]。
     如有未持久化的变更 → saveAiHelperSkills(data) 写回

  2. 检查 data[targetLang]:
     ├─ 存在 → 直接进入步骤 3
     └─ 不存在 → _seedLanguage(targetLang)  懒种子

  3. 清空内存 _skills / _activeIds

  4. _loadFromStorage(targetLang)

  5. re-render UI
```

**user 技能跨语言行为**：用户在中文环境创建的自定义技能只存在于 `cn` 集合。切换到英文时不可见。切回中文后恢复。这是合理的——中文技能的 prompt 内容在英文环境无意义。

### 4. 用户编辑 Builtin Skill 的流程

```
registry.update(skillId, fields)
  ├─ addHistoryEntry(skillId, currentLang, { ...当前字段值 })  ← 编辑前快照
  ├─ skill.prompt = newValue                                    ← 直接改写内存对象
  ├─ skill._editVersion++                                       ← 标记已编辑（仅 builtin）
  ├─ data[currentLang][skillId] = serialize(skill)              ← 同步到 storage
  └─ saveAiHelperSkills(data)
```

**关键**：`_editVersion` 一旦从 0 变为 >0，扩展更新时该技能不再被自动覆盖。用户可通过历史系统手动恢复任意版本（包括出厂版），恢复操作不重置 `_editVersion`——恢复也是一种编辑。

### 5. 删除策略

```
删除:
  data[currentLang][skillId].deleted = true
  saveAiHelperSkills(data)

加载时:
  filter(dto => !dto.deleted)

恢复:
  data[currentLang][skillId].deleted = false
  saveAiHelperSkills(data)
```

`_deletedIds` Set 消失，deleted 直接在对象上标记。cn 和 en 各自独立管理。

### 6. 移除 getTools / getUIDelegate

从 skill 运行时对象移除这两个方法，清理 `chat.js` 中 `executeToolCall()` 和 `buildMergedTools()` 的遍历代码。

## 架构总览

```
┌──────────────────────────────────────────────────────────────────────┐
│                         SkillRegistry                                │
│                                                                      │
│  bootstrap()                                                         │
│  ├── 无数据?         → _seedLanguage(currentLang)                   │
│  ├── 目标语言集合无?   → _seedLanguage(targetLang)  懒种子            │
│  ├── _seededVersion 旧? → _mergeBuiltinUpdate(currentLang)          │
│  └── _loadFromStorage(currentLang) ──────────────────┐              │
│                                                       │              │
│  switchLanguage(targetLang)                           │              │
│  ├── save current → data[currentLang]                 │              │
│  ├── data[targetLang] 不存在? → _seedLanguage()       │              │
│  └── _loadFromStorage(targetLang) ────────────────────┤              │
│                                                       │              │
│  register(createSkill(dto))      → _skills.set(id, skill)            │
│  update(id, fields)              → 直接改对象 → _editVersion++       │
│                                   → addHistoryEntry → save            │
│  activate(id) / deactivate(id)   → 纯内存 Set                      │
└───────────────────────────────────┬──────────────────────────────────┘
                                    │
┌───────────────────────────────────▼──────────────────────────────────┐
│                    Storage Layer (chrome.storage.local)               │
│                                                                      │
│  ai_helper_skills: {                                                 │
│    _seededVersion: "1.5.0",                                         │
│    cn: {                                                             │
│      "code-master": { id, name, desc, category, prompt,             │
│                      _editVersion: 0, type:"builtin", deleted },     │
│      "user-xxx":    { id, name, desc, category, prompt,             │
│                      type:"user", deleted, createdAt }              │
│    },                                                                │
│    en: { ... }                                                       │
│  }                                                                   │
│                                                                      │
│  ai_helper_skill_history: { "code-master:cn": [snapshot, ...] }      │
└──────────────────────────────────────┬───────────────────────────────┘
                                       │
┌──────────────────────────────────────▼───────────────────────────────┐
│                          chat.js 消费端                               │
│                                                                      │
│  buildSkillDirectory()    → getAll()                                 │
│  buildActiveSkillPrompt() → getActive() → skill.getPrompt()          │
│  showSlashPanel()         → getAll()                                 │
│  activateSkill(id)        → activate(id)                             │
│  executeToolCall()        → 全局 if-else（不再遍历 getTools）         │
│  buildMergedTools()       → 仅合并全局 TOOLS                         │
└──────────────────────────────────────────────────────────────────────┘
```

## 完整生命周期时间线

```
时间线─────────────────────────────────────────────────────▶

T1: 首次安装 (zh-CN)
  seedLanguage('cn') → 11 个 builtin 写入 data.cn
  _seededVersion = "1.2.0"
  loadFromStorage('cn') → 内存有 11 个技能，_editVersion 全为 0

T2: 用户编辑 code-master 的 prompt
  update('code-master', { prompt: '...用户加了规则...' })
  → data.cn["code-master"].prompt = 新值
  → data.cn["code-master"]._editVersion = 1
  → addHistoryEntry('code-master:cn', 编辑前快照)

T3: 切换到英文
  switchLanguage('en')
  → data.en 不存在 → seedLanguage('en') → 从 .en.md 种子
  → loadFromStorage('en') → 内存有 11 个英文技能，_editVersion 全为 0

T4: 扩展升级 v1.3.0，code-master 的中文 .md 有变更
  bootstrap() → _seededVersion "1.2.0" ≠ "1.3.0"
  → _mergeBuiltinUpdate('cn'):
    code-master._editVersion = 1 (> 0) → 用户编辑过，全字段保留不覆盖
    其他 builtin._editVersion = 0 → 用新版 .md 全量覆盖
  → _mergeBuiltinUpdate('en'):
    全部 _editVersion = 0 → 用新版 .en.md 全量覆盖
  _seededVersion = "1.3.0"

T5: 切回中文
  switchLanguage('cn')
  → data.cn 已有，直接 loadFromStorage('cn')
  → code-master.prompt 仍是用户编辑过的值 ✅
  → code-master._editVersion = 1, 其他 builtin 已被更新 ✅
```

## Risks / Trade-offs

- [种子一致性问题] 首次安装时网络异常导致 .md fetch 失败 → 种子失败不写 storage，下次 bootstrap 重新尝试
- [存储写入频率] 每次编辑/删除都全量写回 → 每个技能 DTO ≤ 10KB，两集合 100 个技能 = 2MB，全量写入可接受
- [扩展更新合并策略] 用户编辑一次后 `_editVersion > 0`，后续所有 .md 更新都不再覆盖该技能的任何字段。即使用户只改了 prompt 一个字段，其他字段也不会随新版 .md 更新。这是有意为之：一旦用户编辑过，技能内容完全归用户管理。如需新版内容，用户可查看历史版本
- [懒种子延迟] 首次切换到英文时需 fetch 11 个 .en.md 文件 → 约 50-200ms，可接受

## Migration Plan

1. 部署后首次打开扩展 → `ai_helper_skills` 不存在 → `_seedLanguage(currentLang)` 从 .md 初始化当前语言集合 → 写入 storage
2. 用户已有的编辑（旧 overrides 中的 editedSkills）→ 迁移步骤：bootstrap 检测到旧 key 存在 → 读取旧 overrides → 应用到种子后的当前语言集合 → 删除旧 key
3. 另一语言集合在用户首次切换时懒种子
4. 回滚：删除 `ai_helper_skills` 键；恢复旧 `ai_helper_skill_overrides` 键（迁移时有备份）
