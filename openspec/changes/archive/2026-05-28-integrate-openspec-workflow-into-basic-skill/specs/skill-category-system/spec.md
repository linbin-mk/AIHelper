## MODIFIED Requirements

### Requirement: Skill 分类字段
`skillDefinition` SHALL 支持可选的 `category` 字段（字符串），标识 Skill 所属分类。未提供 `category` 的 Skill 归入"其他"分类。

#### Scenario: Skill 声明分类
- **WHEN** Skill 定义中包含 `category: '测试'` 字段
- **THEN** 该 Skill 被标记为"测试"分类，技能 Tab 中在对应分类分组下展示

#### Scenario: Skill 未声明分类
- **WHEN** Skill 定义中未提供 `category` 字段或其值为空
- **THEN** 该 Skill 归入"其他"分类分组

### Requirement: "基础"分类调试模式可见
"基础"分类及其包含的 Skill SHALL 仅在用户开启调试模式时在技能 Tab 中展示。非调试模式下该分类隐藏。

#### Scenario: 调试模式下可见
- **WHEN** 用户开启调试模式并查看技能 Tab
- **THEN** 技能 Tab 底部显示"基础"分类分组，包含所有基础分类技能行：页面刷新、建立网站大纲、OpenSpec 探索、OpenSpec 提案、OpenSpec 实现、OpenSpec 归档

#### Scenario: 非调试模式下隐藏
- **WHEN** 用户未开启调试模式并查看技能 Tab
- **THEN** 技能 Tab 不显示"基础"分类分组，所有基础分类技能行不可见

#### Scenario: 切换调试模式刷新展示
- **WHEN** 用户在"技能"Tab 页面打开的情况下切换调试模式开关
- **THEN** 技能 Tab 立即刷新，"基础"分类根据新模式显示或隐藏

## ADDED Requirements

### Requirement: OpenSpec 四个技能归入基础分类
4 个 OpenSpec 技能 SHALL 各声明 `category: '基础'`，在技能 Tab 的"基础"分类分组下展示，遵循"基础"分类仅在调试模式可见的规则。

#### Scenario: 技能在基础分类中展示
- **WHEN** 用户在调试模式下查看技能 Tab 的基础分类分组
- **THEN** 分组包含六个技能行：页面刷新、建立网站大纲、OpenSpec 探索、OpenSpec 提案、OpenSpec 实现、OpenSpec 归档

### Requirement: 4 个技能按 OpenSpec 工作流顺序排列
"基础"分类分组内，4 个 OpenSpec 技能 SHALL 按工作流顺序排列：OpenSpec 探索 → OpenSpec 提案 → OpenSpec 实现 → OpenSpec 归档，排在现有基础技能（页面刷新、建立网站大纲）之后。

#### Scenario: 技能排列顺序
- **WHEN** 调试模式下查看"基础"分类分组
- **THEN** 技能行按以下顺序排列：页面刷新、建立网站大纲、OpenSpec 探索、OpenSpec 提案、OpenSpec 实现、OpenSpec 归档
