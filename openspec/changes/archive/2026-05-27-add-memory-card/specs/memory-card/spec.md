## ADDED Requirements

### Requirement: 记忆卡片在知识面板中展示
系统 SHALL 在知识面板中渲染一张"记忆"卡片，使用 `type: "memory"` 与普通知识卡片区分。记忆卡片在首次记忆生成时自动创建，用户可删除。

#### Scenario: 首次记忆生成时自动创建记忆卡片
- **WHEN** AI 对话完成后触发记忆生成且 `ai_helper_memory_item` 不存在
- **THEN** 系统自动创建一个 type 为 "memory" 的记忆条目，存入 `chrome.storage.local`
- **AND** 记忆卡片显示在知识列表最顶部（重新渲染列表后）

#### Scenario: 记忆卡片与普通知识卡片视觉区分
- **WHEN** 知识面板中同时存在记忆卡片和普通知识卡片
- **THEN** 记忆卡片使用不同背景色/边框色（主题色紫色调）与普通卡片区分
- **AND** 卡片上显示 🧠 图标或"记忆"标签标识

#### Scenario: 用户可删除记忆卡片
- **WHEN** 用户点击记忆卡片的删除按钮并确认
- **THEN** 系统删除 `ai_helper_memory_item`
- **AND** 同时清空该记忆卡片关联的所有记忆文件（IndexedDB 中 knowledgeId 匹配的文件和文件树）
- **AND** 记忆卡片从知识列表中移除

#### Scenario: 删除后下次对话自动重建
- **WHEN** 记忆卡片已被删除且用户完成新一轮 AI 对话
- **THEN** 系统在生成记忆时自动重新创建记忆卡片
- **AND** 新记忆文件存入重建的卡片中

#### Scenario: 记忆卡片仅有一张
- **WHEN** 系统生成记忆时已存在 memory 类型的条目
- **THEN** 复用已有记忆卡片，不创建新卡片
- **AND** 如果意外存在多个 memory 类型条目，仅保留第一个，合并其余

### Requirement: 记忆卡片展示文件和域名统计
记忆卡片 MUST 展示记忆文件总数和覆盖域名数。

#### Scenario: 记忆卡片显示文件统计
- **WHEN** 记忆卡片渲染
- **THEN** 卡片元数据区域显示"记忆: N个文件 / M个域名"

#### Scenario: 点击文件管理查看记忆文件
- **WHEN** 用户点击记忆卡片的"文件管理"按钮
- **THEN** 系统打开文件管理弹窗，展示以域名分组的记忆文件树

#### Scenario: 为空时展示引导提示
- **WHEN** 记忆卡片创建后尚无任何记忆文件
- **THEN** 卡片描述显示"暂无记忆，完成 AI 对话后将自动生成"

### Requirement: 记忆卡片使用专用存储 key
记忆卡片的元数据 SHALL 存储在 `chrome.storage.local` 中，key 为 `ai_helper_memory_item`，值为单对象（非数组）。记忆文件内容 MUST 通过 FileCacheManager 存储，knowledgeId 使用记忆卡片的 id。

#### Scenario: 读取记忆卡片元数据
- **WHEN** 系统需要获取记忆卡片信息
- **THEN** 从 `chrome.storage.local` 读取 `ai_helper_memory_item` key
- **AND** 返回 `{ id, displayName: "记忆", type: "memory", description, createdAt, fileCount }`

#### Scenario: 记忆文件存储在 IndexedDB 中
- **WHEN** 系统需要读取/写入记忆文件
- **THEN** 使用 FileCacheManager 以 `{knowledgeId: <memoryItem.id>, path, content}` 格式操作
- **AND** 使用 TreeCacheManager 以 memoryItem.id 保存/读取文件树
