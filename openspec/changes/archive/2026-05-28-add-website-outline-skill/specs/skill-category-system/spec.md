## MODIFIED Requirements

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

### Requirement: 现有 Skill 添加分类
系统 SHALL 为现有 Skill 添加 `category` 字段：`test-data-generation` 归类为"测试"，`browser-page-refresh` 归类为"基础"，`website-outline` 归类为"基础"。

#### Scenario: 现有 Skill 分类
- **WHEN** `test-data-generation` Skill 被注册
- **THEN** 其 `category` 字段值为 `'测试'`

#### Scenario: 页面刷新 Skill 分类
- **WHEN** `browser-page-refresh` Skill 被注册
- **THEN** 其 `category` 字段值为 `'基础'`

#### Scenario: 建立网站大纲 Skill 分类
- **WHEN** `website-outline` Skill 被注册
- **THEN** 其 `category` 字段值为 `'基础'`

### Requirement: "基础"分类调试模式可见
"基础"分类及其包含的 Skill SHALL 仅在用户开启调试模式时在技能 Tab 中展示。非调试模式下该分类隐藏。

#### Scenario: 调试模式下可见
- **WHEN** 用户开启调试模式并查看技能 Tab
- **THEN** 技能 Tab 底部显示"基础"分类分组，包含"页面刷新"和"建立网站大纲"两个技能行

#### Scenario: 非调试模式下隐藏
- **WHEN** 用户未开启调试模式并查看技能 Tab
- **THEN** 技能 Tab 不显示"基础"分类分组

#### Scenario: 切换调试模式刷新展示
- **WHEN** 用户在"技能"Tab 页面打开的情况下切换调试模式开关
- **THEN** 技能 Tab 立即刷新，"基础"分类根据新模式显示或隐藏
