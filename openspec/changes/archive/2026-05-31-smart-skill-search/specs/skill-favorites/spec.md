## ADDED Requirements

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
`FavoritesManager.createCollection(name, description, skillIds)` SHALL 创建新的收藏夹对象并持久化。参数校验：`name` 和 `description` 必须为非空字符串，`skillIds` 必须为非空数组。方法返回 `{ success: true, collectionId }` 或 `{ success: false, error }`。

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

#### Scenario: 空名称或空描述
- **WHEN** `name` 或 `description` 为空字符串
- **THEN** 返回 `{ success: false, error: "name and description are required" }`

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
