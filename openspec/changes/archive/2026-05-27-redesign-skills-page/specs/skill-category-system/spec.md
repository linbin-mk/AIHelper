## ADDED Requirements

### Requirement: Skill 分类字段
`skillDefinition` SHALL 支持可选的 `category` 字段（字符串），标识 Skill 所属分类。未提供 `category` 的 Skill 归入"其他"分类。

#### Scenario: Skill 声明分类
- **WHEN** Skill 定义中包含 `category: '测试'` 字段
- **THEN** 该 Skill 被标记为"测试"分类，技能 Tab 中在对应分类分组下展示

#### Scenario: Skill 未声明分类
- **WHEN** Skill 定义中未提供 `category` 字段或其值为空
- **THEN** 该 Skill 归入"其他"分类分组

### Requirement: 技能 Tab 按分类分组展示
技能 Tab SHALL 按分类分组展示所有已注册 Skill。分类按固定顺序排列：通用、业务、产品、开发、测试、其他。每个分组显示分类名称标题和该分类下的技能行列表。

#### Scenario: 分类分组渲染
- **WHEN** 用户点击"技能"Tab
- **THEN** 页面以分类分组展示，每个分组包含分类标题和该分类下所有技能行，不包含 Skill 的分类不显示该分组

#### Scenario: 空分类隐藏
- **WHEN** "业务"分类下无 Skill
- **THEN** "业务"分组不显示

### Requirement: 技能行紧凑展示
技能行 SHALL 以紧凑形式展示：标题（字体加粗）在上，简短描述在下，一行一个 Skill。不再展示工具标签列表和使用提示文字。

#### Scenario: 技能行渲染
- **WHEN** 技能 Tab 渲染技能行
- **THEN** 每行仅包含 Skill 的 `name`（加粗）和 `description`（常规大小），左右占满宽度

#### Scenario: 技能行 hover 效果
- **WHEN** 用户鼠标悬停在技能行上
- **THEN** 该行背景色变化，指示可点击

### Requirement: 现有 Skill 添加分类
系统 SHALL 为现有 Skill 添加 `category` 字段：`test-data-generation` 归类为"测试"，`browser-page-refresh` 归类为"基础"。

#### Scenario: 现有 Skill 分类
- **WHEN** `test-data-generation` Skill 被注册
- **THEN** 其 `category` 字段值为 `'测试'`

#### Scenario: 页面刷新 Skill 分类
- **WHEN** `browser-page-refresh` Skill 被注册
- **THEN** 其 `category` 字段值为 `'基础'`

### Requirement: "基础"分类调试模式可见
"基础"分类及其包含的 Skill SHALL 仅在用户开启调试模式时在技能 Tab 中展示。非调试模式下该分类隐藏。

#### Scenario: 调试模式下可见
- **WHEN** 用户开启调试模式并查看技能 Tab
- **THEN** 技能 Tab 底部显示"基础"分类分组，包含"页面刷新"技能行

#### Scenario: 非调试模式下隐藏
- **WHEN** 用户未开启调试模式并查看技能 Tab
- **THEN** 技能 Tab 不显示"基础"分类分组，"页面刷新"技能行不可见

#### Scenario: 切换调试模式刷新展示
- **WHEN** 用户在"技能"Tab 页面打开的情况下切换调试模式开关
- **THEN** 技能 Tab 立即刷新，"基础"分类根据新模式显示或隐藏

### Requirement: 占位 Skill 定义
系统 SHALL 提供 7 个占位 Skill，每个包含 `id`、`name`、`description`、`category` 字段，`getPrompt()` 返回简短占位说明，`getTools()` 返回空数组，`getUIDelegate()` 返回 null。

#### Scenario: 占位 Skill 注册
- **WHEN** 页面加载完成后
- **THEN** 技能 Tab 展示所有 9 个 Skill（2个已有 + 7个新增），按分类分布

#### Scenario: 占位 Skill 分类分布
- **WHEN** 技能 Tab 分类分组渲染
- **THEN** "通用"分组包含"系统解答专家"、"系统功能使用"；"业务"分组包含"研发人天预估"、"业务问题反馈"；"产品"分组包含"需求分析总结"；"开发"分组暂无技能；"测试"分组包含"测试数据生成"、"智能测试"；"基础"分组包含"页面刷新"

#### Scenario: 占位 Skill 无实际工具
- **WHEN** 占位 Skill（如"系统解答专家"）被查询工具列表
- **THEN** `getTools()` 返回空数组，不影响 LLM 工具调用

#### Scenario: 占位 Skill 的 Prompt 为占位说明
- **WHEN** 占位 Skill 的 `getPrompt()` 被调用
- **THEN** 返回简短占位说明文字（如"（系统解答专家 - 待完善）"），而非完整 Prompt 规则
