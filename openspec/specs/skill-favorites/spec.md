## ADDED Requirements

### Requirement: 技能右键收藏菜单
用户在技能列表中右键技能行时，系统 SHALL 弹出上下文菜单，其中包含"收藏"选项。

#### Scenario: 右键弹出收藏菜单
- **WHEN** 用户在技能行上执行右键点击（contextmenu）
- **THEN** 系统在鼠标位置显示上下文菜单，包含"收藏"选项
- **AND** 技能原有的点击行为（打开详情弹窗）不触发

#### Scenario: 右键非技能区域
- **WHEN** 用户在技能行的空白区域或技能分类标题上执行右键点击
- **THEN** 系统不显示收藏上下文菜单（浏览器默认右键菜单正常显示）

### Requirement: 收藏夹选择悬浮框
点击"收藏"后，系统 SHALL 弹出模态悬浮框，展示已有收藏夹列表和新建收藏夹入口。

#### Scenario: 展示收藏夹列表
- **WHEN** 用户点击上下文菜单中的"收藏"选项
- **THEN** 系统显示带遮罩层的悬浮框，列出所有已有收藏夹（名称和技能数量）
- **AND** 每个收藏夹可被点击进行选择

#### Scenario: 新建收藏夹
- **WHEN** 悬浮框显示且已有收藏夹
- **THEN** 悬浮框底部显示"新建收藏夹"按钮
- **AND** 点击后创建一个默认名称为"收藏"的新收藏夹，自动将当前技能加入该收藏夹，关闭悬浮框

#### Scenario: 无需选择时直接收藏
- **WHEN** 用户点击"收藏"且尚未创建任何收藏夹
- **THEN** 系统自动创建一个默认名称为"收藏"的收藏夹，将当前技能加入，关闭悬浮框，无需用户额外操作

### Requirement: 收藏夹重命名
用户对收藏夹进行重命名。

#### Scenario: 重命名收藏夹
- **WHEN** 用户在收藏夹选择悬浮框中，点击某个收藏夹名称旁边的编辑图标
- **THEN** 收藏夹名称变为可编辑的输入框
- **AND** 用户输入新名称并按 Enter 或点击确认后，名称被保存
- **AND** 按 Escape 或点击取消，恢复原有名称

#### Scenario: 空名称校验
- **WHEN** 用户尝试将收藏夹名称改为空字符串
- **THEN** 系统阻止保存，保持原有名称

### Requirement: 收藏卡展示
技能页面顶部 SHALL 展示用户的所有收藏卡，每张收藏卡显示收藏夹名称及其中包含的技能列表。

#### Scenario: 展示收藏卡
- **WHEN** 用户打开技能 Tab 且存在至少一个收藏夹
- **THEN** 系统在技能分类列表上方渲染所有收藏卡
- **AND** 每张收藏卡标题显示收藏夹名称
- **AND** 每张收藏卡内容区显示该收藏夹包含的技能名称列表

#### Scenario: 无收藏时不显示
- **WHEN** 用户打开技能 Tab 且没有任何收藏夹
- **THEN** 顶部不渲染任何收藏卡，技能列表正常展示

#### Scenario: 收藏卡中的技能仍可见于分类列表
- **WHEN** 某个技能已被收藏
- **THEN** 该技能仍然显示在原有的分类列表中，不影响分类视图

### Requirement: 收藏卡名称编辑
用户 SHALL 能够修改收藏卡的名称。

#### Scenario: 单击编辑名称
- **WHEN** 用户单击收藏卡标题文字
- **THEN** 标题变为可编辑的输入框，自动聚焦并选中全部文字

#### Scenario: 保存新名称
- **WHEN** 用户在输入框中按下 Enter 或点击输入框外区域
- **THEN** 新名称被保存并更新显示

#### Scenario: 空名称回退
- **WHEN** 用户确认名称时输入框为空
- **THEN** 系统恢复为原有名称或默认名称"收藏"

### Requirement: 收藏卡删除
用户 SHALL 能够删除收藏卡。

#### Scenario: 右键删除
- **WHEN** 用户在收藏卡上执行右键点击
- **THEN** 系统弹出上下文菜单，包含"删除收藏卡"选项

#### Scenario: 确认删除
- **WHEN** 用户点击"删除收藏卡"
- **THEN** 该收藏夹及其所有收藏数据被移除，收藏卡从页面消失

### Requirement: 收藏数据持久化
收藏数据 SHALL 通过 `chrome.storage.local` 持久化存储。

#### Scenario: 数据保存
- **WHEN** 用户执行任何收藏操作（新建收藏夹、添加技能到收藏夹、重命名、删除）
- **THEN** 系统立即将更新后的收藏数据写入 `chrome.storage.local` 键 `ai_helper_skill_favorites`

#### Scenario: 跨会话恢复
- **WHEN** 用户关闭并重新打开扩展面板
- **THEN** 之前保存的收藏夹数据完整恢复，收藏卡正常展示

### Requirement: 多语言支持
收藏功能的所有用户可见文本 SHALL 支持中英文。

#### Scenario: 中文环境
- **WHEN** 用户语言设置为中文
- **THEN** 菜单显示"收藏"、"新建收藏夹"、"删除收藏卡"等中文文本，默认收藏夹名为"收藏"

#### Scenario: 英文环境
- **WHEN** 用户语言设置为英文
- **THEN** 菜单显示"Add to Favorites"、"New Collection"、"Delete Collection"等英文文本，默认收藏夹名为"Favorites"

### Requirement: 收藏夹管理独立模块
系统 SHALL 提供 `FavoritesManager` 全局模块（`favorites-manager.js`），封装所有技能收藏夹的增删改查操作。模块在 `panel.html` 中 `config.js` 之后、`chat.js` 之前加载。`panel.js` 中的原有收藏操作 SHALL 改为调用 `FavoritesManager` 的方法。

#### Scenario: 模块全局可访问
- **WHEN** 页面初始化完成
- **THEN** `window.FavoritesManager` 对象存在，包含 `createCollection`、`deleteCollection`、`addSkills`、`removeSkills` 四个方法

#### Scenario: panel.js 通过模块操作收藏
- **WHEN** 用户在技能页面右键收藏技能
- **THEN** `handleAddToFavorite()` 调用 `FavoritesManager.addSkills(collectionId, [skillId])` 完成操作
- **AND** 不再直接操作 `chrome.storage.local`

#### Scenario: chat.js 通过模块实现工具 handler
- **WHEN** AI 调用 `create_skill_collection` 工具
- **THEN** handler 调用 `FavoritesManager.createCollection(name, description, skillIds)` 完成操作

### Requirement: 创建收藏夹
`FavoritesManager.createCollection(name, description, skillIds)` SHALL 创建新的收藏夹对象并持久化。参数校验：`name` 必须为非空字符串，`description` 允许为空，`skillIds` 必须为非空数组。方法返回 `{ success: true, collectionId }` 或 `{ success: false, error }`。

#### Scenario: 创建成功
- **WHEN** 调用 `createCollection("UI测试工具集", "用于前端UI自动化测试的技能集合", ["test-data-generation", "code-master"])`
- **THEN** 生成 UUID 作为收藏夹 ID
- **AND** 创建 `{ id, name, description, skillIds, createdAt }` 对象追加到存储
- **AND** 调用 `renderFavorites()` 刷新 UI
- **AND** 返回 `{ success: true, collectionId: "<uuid>" }`

#### Scenario: 无效技能 ID 被过滤
- **WHEN** `skillIds` 包含未在 `SkillRegistry.getAll()` 中注册的 ID
- **THEN** 无效 ID 被过滤，仅保存有效 ID
- **AND** 若过滤后为空，返回 `{ success: false, error: "no valid skill ids" }`

#### Scenario: 空名称
- **WHEN** `name` 为空字符串
- **THEN** 返回 `{ success: false, error: "name is required" }`

#### Scenario: 空技能列表
- **WHEN** `skillIds` 为空数组
- **THEN** 返回 `{ success: false, error: "skillIds is empty" }`

### Requirement: 删除收藏夹
`FavoritesManager.deleteCollection(collectionId)` SHALL 从存储中移除指定收藏夹。方法返回 `{ success: true }` 或 `{ success: false, error }`。

#### Scenario: 删除成功
- **WHEN** 调用 `deleteCollection("<existing-id>")`
- **AND** 该收藏夹存在
- **THEN** 从存储数组中移除该对象
- **AND** 调用 `renderFavorites()` 刷新 UI
- **AND** 返回 `{ success: true }`

#### Scenario: 删除不存在的收藏夹
- **WHEN** 调用 `deleteCollection("<non-existent-id>")`
- **THEN** 返回 `{ success: false, error: "collection not found" }`

### Requirement: 向收藏夹添加技能
`FavoritesManager.addSkills(collectionId, skillIds)` SHALL 向指定收藏夹添加技能。若某技能已存在则跳过（去重）。方法返回 `{ success: true, addedCount }`。

#### Scenario: 添加成功
- **WHEN** 调用 `addSkills("<existing-id>", ["code-master", "test-data-generation"])`
- **AND** 该收藏夹中原有 `["code-master"]`
- **THEN** 去重后仅添加 `test-data-generation`，`addedCount` 为 1
- **AND** 写回存储，调用 `renderFavorites()` 刷新

#### Scenario: 收藏夹不存在
- **WHEN** 调用 `addSkills("<non-existent-id>", ["code-master"])`
- **THEN** 返回 `{ success: false, error: "collection not found" }`

#### Scenario: 无效技能 ID 被过滤
- **WHEN** `skillIds` 包含未注册的 ID
- **THEN** 无效 ID 被过滤，仅添加有效且不重复的 ID

### Requirement: 从收藏夹移除技能
`FavoritesManager.removeSkills(collectionId, skillIds)` SHALL 从指定收藏夹中移除技能。方法返回 `{ success: true, removedCount }`。

#### Scenario: 移除成功
- **WHEN** 调用 `removeSkills("<existing-id>", ["code-master"])`
- **AND** 该收藏夹原有 `["code-master", "test-data-generation"]`
- **THEN** 移除后剩余 `["test-data-generation"]`，`removedCount` 为 1
- **AND** 写回存储，调用 `renderFavorites()` 刷新

#### Scenario: 移除不存在的技能
- **WHEN** 调用 `removeSkills("<existing-id>", ["non-existent-skill"])`
- **THEN** `removedCount` 为 0，返回 `{ success: true, removedCount: 0 }`

#### Scenario: 收藏夹不存在
- **WHEN** 调用 `removeSkills("<non-existent-id>", ["code-master"])`
- **THEN** 返回 `{ success: false, error: "collection not found" }`

### Requirement: 四个收藏管理 AI 工具
系统 SHALL 在 `chat.js` 的 `buildMergedTools()` 中注册四个收藏管理工具，handler 均调用 `FavoritesManager` 对应方法。工具描述清楚说明参数和用途。

#### Scenario: create_skill_collection 工具定义
- **WHEN** 系统构建工具列表
- **THEN** 工具 `create_skill_collection` 存在，参数包括 `name`(必填)、`description`(必填)、`skillIds`(必填)

#### Scenario: delete_skill_collection 工具定义
- **WHEN** 系统构建工具列表
- **THEN** 工具 `delete_skill_collection` 存在，参数包括 `collectionId`(必填)

#### Scenario: add_skills_to_collection 工具定义
- **WHEN** 系统构建工具列表
- **THEN** 工具 `add_skills_to_collection` 存在，参数包括 `collectionId`(必填)、`skillIds`(必填)

#### Scenario: remove_skills_from_collection 工具定义
- **WHEN** 系统构建工具列表
- **THEN** 工具 `remove_skills_from_collection` 存在，参数包括 `collectionId`(必填)、`skillIds`(必填)

#### Scenario: AI 可通过工具完整管理收藏夹
- **WHEN** AI 在对话中需要管理收藏夹
- **THEN** AI 可根据用户意图调用这四个工具完成创建、删除、添加技能、移除技能操作

### Requirement: 程序化创建与手动创建数据一致
通过 `FavoritesManager` 创建或修改的收藏夹 SHALL 与用户手动创建的收藏夹使用相同的数据格式，在技能页面正常展示并支持所有交互（名称编辑、描述编辑、右键删除、技能标签点击）。

#### Scenario: 收藏卡统一展示
- **WHEN** 收藏夹通过 `createCollection()` 或手动操作创建
- **THEN** 该收藏夹在技能页面的"收藏"卡片中正常展示
- **AND** 卡片支持名称编辑、描述编辑、右键删除
- **AND** 技能标签点击后弹出详情弹窗
