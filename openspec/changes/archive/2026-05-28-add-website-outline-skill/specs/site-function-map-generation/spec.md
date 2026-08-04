## ADDED Requirements

### Requirement: AI 驱动探索生成功能地图
系统 SHALL 支持 AI 在单一 Agent Loop 中执行完整的导航探索流程：从获取页面交互元素开始，自主识别导航区域，逐一点击导航项，汇总各页面的功能信息，最终生成结构化的系统功能地图 Markdown 文档。

#### Scenario: 完整探索流程
- **WHEN** 用户输入 `/website-outline 分析当前系统功能`
- **THEN** AI 执行以下步骤：
  - 调用 `get_page_interactive_elements` 获取当前页面所有可交互元素
  - 分析元素列表，识别导航区域（按位置、语义角色、文本内容）
  - 制定点击顺序计划（记录在思维中）
  - 依次调用 `click_element` 点击每个导航项
  - 每次点击后调用 `get_page_interactive_elements` 确认是否进入新页面
  - 汇总探索结果，生成功能地图 Markdown
  - 将地图存入记忆系统

#### Scenario: 跳过危险按钮的探索
- **WHEN** AI 在元素列表中识别到文本为"删除"、"退出登录"的按钮
- **THEN** AI 标记这些元素为"已跳过（危险操作）"，不调用 `click_element`

#### Scenario: 探索无导航元素的页面
- **WHEN** `get_page_interactive_elements` 返回空数组或所有元素不在导航相关区域
- **THEN** AI 告知用户当前页面无可探索的导航结构，建议在包含导航栏的页面（如后台管理首页）触发

### Requirement: 功能地图 Markdown 格式
生成的功能地图 SHALL 采用结构化 Markdown 格式，包含页面元信息（域名、URL、生成时间）、各功能点的定位路径（导航路径、页面路径、选择器）和功能描述。

#### Scenario: 功能地图标准格式
- **WHEN** AI 完成导航探索后生成功能地图
- **THEN** 文件内容包含以下章节：
  - `# {系统名称} 功能地图`（标题，尝试从页面 title 推导）
  - `**域名**: {hostname}`
  - `**URL**: {起始页面 URL}`
  - `**生成时间**: {日期时间}`
  - `**探索统计**: 共 {N} 个功能页面`
  - `## 功能目录`（编号列表，简要列出所有功能名称）
  - `## 功能详情`（每个功能一行：`- **[功能名]** → 点击 [{导航名}](选择器) → 页面路径: {URL} → {功能描述}`）

#### Scenario: 功能地图含选择器信息
- **WHEN** AI 生成每个功能点的条目
- **THEN** 条目中包含触发该功能的导航元素选择器（`click_element` 所使用的选择器），供后续快速定位

### Requirement: 功能地图存储
功能地图 SHALL 通过 `saveMemoryFile` 存储到记忆系统中，文件路径为 `{hostname}/功能地图.md`。

#### Scenario: 存入记忆文件夹
- **WHEN** AI 完成功能地图 Markdown 生成且当前 hostname 为 `admin.example.com`
- **THEN** AI 调用记忆存储逻辑，将地图内容存入 `admin.example.com/功能地图.md`
- **AND** 如果该文件已存在，自动追加序号（如 `功能地图(2).md`）

#### Scenario: 语言自适应
- **WHEN** 页面 title 为中文
- **THEN** 功能地图默认使用中文命名（"功能地图.md"），功能描述使用中文
- **WHEN** 页面 title 为非中文
- **THEN** 功能地图使用英文命名（"function-map.md"），功能描述使用英文
