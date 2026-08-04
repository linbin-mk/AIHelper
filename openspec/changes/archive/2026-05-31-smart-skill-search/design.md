## Context

当前技能页面展示所有已注册技能的二维分类列表，上方为收藏卡片。用户需要手动浏览分类才能发现技能，缺乏自然语言搜索和智能推荐能力。该应用是 Chrome 扩展的单页面板应用，通过 Tab 切换控制不同内容区的 CSS 可见性，AI 聊天页面支持通过 Skill 机制注入系统提示和自定义消息渲染。

现有能力：
- `testConnectivity()` 函数（`config.js`）可检测 AI 模型联通性（GET `{apiBaseUrl}/v1/models`，10秒超时）
- `switchTab('chat')` 切换至聊天 Tab
- `activateSkill(skillId)` 激活技能并更新状态栏
- `ask_user` 内置工具已支持多选卡片（`multiSelect: true`），可渲染带 checkbox 和确认按钮的交互卡片
- 收藏夹数据存储在 `chrome.storage.local` 键 `ai_helper_skill_favorites`，格式为 `{ id, name, description, skillIds, createdAt }[]`，创建/保存逻辑当前在 `panel.js` 中（将提取为 `favorites-manager.js`）
- MD 格式技能通过 `skills/manifest.json` 注册，`loadAllSkills()` 自动扫描加载

## Goals / Non-Goals

**Goals:**
- 在技能页面"收藏"卡片上方新增"智慧搜索"搜索框，仅在 AI 模型联通时显示
- 用户输入场景描述点击搜索后，自动跳转到聊天 Tab 并激活"推荐Skill"技能，将用户输入作为首条消息发送
- "推荐Skill"技能通过多轮对话引导用户澄清场景，利用 `ask_user` 工具提问和展示推荐结果
- 提取 `favorites-manager.js` 独立模块，提供收藏夹 CRUD 四个方法（create / delete / addSkills / removeSkills）
- 将四个方法封装为 AI 工具（`create_skill_collection` / `delete_skill_collection` / `add_skills_to_collection` / `remove_skills_from_collection`），供 AI 和技能页面共用
- 支持中英文多语言

**Non-Goals:**
- 不在技能页面内置搜索过滤功能（不是本地搜索）
- 不改变现有的技能列表、收藏卡、详情弹窗的任何行为
- 不涉及 AI 聊天页面本身的改动（除新工具注册和技能定义外）
- 不改变收藏数据持久化机制

## Decisions

### 1. 搜索框展示时机：切换到技能 Tab 时主动检测联通性

**选择**：每次切换到技能 Tab 时，调用 `testConnectivity()` 检测联通性。联通成功则显示搜索框，失败或超时则隐藏。

**理由**：联通状态可能随时间变化（网络恢复、Token 过期），每次切换 Tab 时主动检测可确保状态实时。仅在联通时显示搜索框，避免用户点击后因未配置或网络不通而困惑。

**备选方案**：页面加载时检测一次并缓存结果。**不采用**，因为用户可能在会话中途修改配置或网络恢复，缓存会导致状态过时。

### 2. 搜索框跳转方式：switchTab + activateSkill + 自动发送消息

**选择**：用户点击搜索按钮后，(1) `switchTab('chat')` → (2) `activateSkill('recommend-skill')` → (3) 将用户输入文本作为消息自动发送。

**理由**：与技能详情弹窗"使用"按钮的模式一致（`switchTab` + `activateSkill`），额外增加自动发送消息步骤以启动对话。用户无需在聊天页手动粘贴内容。

**备选方案**：仅切换 Tab 并预填输入框，由用户手动发送。**不采用**，增加用户操作步骤，与"智慧搜索"的"一键直达"体验不符。

### 3. "推荐Skill"技能实现方式：MD 格式纯 Prompt 技能

**选择**：该技能通过 MD 文件注册（`skills/recommend-skill/skill.{cn,en}.md`），不注册 `SkillUIDelegate`，不声明专属工具。技能 prompt 详细指导 AI 如何使用现有内置工具（`ask_user`、`create_skill_collection`）完成推荐流程。

**理由**：
- 系统的 `ask_user` 工具已支持多选卡片（`multiSelect: true`），无需自定义渲染
- MD 格式技能无需编写 JS 代码，维护成本低
- AI 驱动的对话内容灵活性高，技能 prompt 可随时调整引导策略

**备选方案**：使用 `SkillUIDelegate` 拦截 `<!--RECOMMEND_RESULT-->` 自定义渲染。**不采用**，因为 `ask_user` 的多选卡片已完整覆盖推荐场景的交互需求，自定义渲染增加不必要的复杂度。

### 4. 推荐流程设计：ask_user 提问 + ask_user 多选 + create_skill_collection

**选择**：AI 执行三段式流程：
1. **澄清阶段**：使用 `ask_user`（单选/选项模式）向用户提问，逐步收窄需求范围
2. **推荐阶段**：使用 `ask_user`（`multiSelect: true`）展示推荐技能列表，每项为技能名称+简短描述，默认全选
3. **创建阶段**：获取用户勾选结果后，调用 `create_skill_collection` 工具（传入 AI 生成的 `name`、`description` 和用户选中的 `skillIds`）创建收藏夹。后续对话中 AI 还可使用 `add_skills_to_collection`、`remove_skills_from_collection`、`delete_skill_collection` 帮用户调整收藏夹。**理由**：全部复用现有内置工具，零额外 UI 渲染代码。`ask_user` 多选卡片的交互模式（checkbox + 确认按钮）与推荐场景完美匹配。收藏夹操作封装为独立工具模块。

### 5. 提取收藏夹管理模块为独立 JS 文件

**选择**：新建 `chrome-extension/src/panel/favorites-manager.js`，将收藏夹的数据操作逻辑从 `panel.js` 中提取出来。该模块向全局暴露 `FavoritesManager` 对象，提供四个方法：
- `createCollection(name, description, skillIds)` → 返回 `{ success, collectionId }`
- `deleteCollection(collectionId)` → 返回 `{ success }`
- `addSkills(collectionId, skillIds)` → 返回 `{ success, addedCount }`
- `removeSkills(collectionId, skillIds)` → 返回 `{ success, removedCount }`

每个方法内部校验参数有效性（skillId 是否在 SkillRegistry 中存在）、操作原始存储数据、写回并触发 UI 刷新。模块加载顺序：在 `config.js` 之后、`chat.js` 之前（`panel.html` 第 371 行前插入）。

**理由**：
- 解耦：`panel.js` 和 `chat.js` 都依赖收藏夹操作，提取为独立模块避免循环引用和重复代码
- 共用：`panel.js` 的右键菜单/收藏卡交互 和 `chat.js` 的 AI 工具 handler 都调用同一个模块，保证行为一致
- 可测试：独立模块便于单独测试数据完整性

**备选方案**：保持收藏逻辑在 `panel.js` 中，`chat.js` 通过全局函数引用。**不采用**，因为 `chat.js` 在 `panel.js` 之前加载，无法引用后者中的函数。

### 6. AI 工具集：收藏夹 CRUD 四个工具

**选择**：在 `chat.js` 的 `buildMergedTools()` 中注册 4 个收藏管理工具，handler 全部调用 `FavoritesManager` 的对应方法：

| 工具名 | 参数 | 返回 |
|--------|------|------|
| `create_skill_collection` | `name`, `description`, `skillIds` | `{ success, collectionId }` |
| `delete_skill_collection` | `collectionId` | `{ success }` |
| `add_skills_to_collection` | `collectionId`, `skillIds` | `{ success, addedCount }` |
| `remove_skills_from_collection` | `collectionId`, `skillIds` | `{ success, removedCount }` |

**理由**：
- AI 不仅需要创建收藏夹（推荐场景），还需要后续调整（增删技能、删除收藏夹）
- 四个工具完整覆盖 CRUD，使技能收藏管理完全可通过对话完成
- 工具模式与 `activate_skill` 一致，AI 通过 tool call 直接操作数据

### 8. 搜索框与收藏卡的位置关系

**选择**：搜索框独立容器 `#smartSearchContainer`，放置在 `#favoritesContainer` 之前（`#tab-skills` 的第一个子元素）。收藏卡保持原有位置不变。

**理由**：搜索框作为"发现入口"应置于页面顶部优先展示；收藏卡是用户已保存的内容，位于搜索框之下符合信息架构惯例（先发现，后管理）。

## Risks / Trade-offs

- **联通性检测超时（5秒）可能造成切换技能 Tab 时短暂延迟** → 检测期间搜索框区域显示加载状态，检测完成后异步渲染
- **AI 推荐的技能 ID 可能在注册表中不存在** → `FavoritesManager` 的 `createCollection` 和 `addSkills` 在写入前校验 `skillIds` 有效性，过滤无效 ID
- **"推荐Skill" 可能推荐过多技能导致 `ask_user` 选项过长** → prompt 中限制最多推荐 5 个技能
- **搜索框在非聊天 Tab 展示，可能让用户困惑结果在哪** → 点击搜索后自动跳转至聊天 Tab，消息气泡清晰可见
- **favorites-manager.js 需同时被 chat.js 和 panel.js 引用** → 在 `panel.html` 中 `config.js` 之后、`chat.js` 之前加载，确保两个消费者都能访问 `FavoritesManager`
