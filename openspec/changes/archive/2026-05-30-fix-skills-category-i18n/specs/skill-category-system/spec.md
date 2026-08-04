## MODIFIED Requirements

### Requirement: Skill 分类字段
Skill SHALL 支持通过两种方式声明分类：
1. **MD 方式**：YAML front matter 中的 `category` 字段（字符串），值为 `Business`、`Product`、`Development`、`Testing` 之一
2. **代码方式**：`skillDefinition.category` 字段（向后兼容）

未提供 `category` 或值为无效分类的 Skill 归入 `Other` 分类。

#### Scenario: MD 技能声明分类
- **WHEN** 技能 MD 文件的 front matter 包含 `category: 'Testing'`
- **THEN** 该 Skill 被标记为 `Testing` 分类，技能 Tab 中在对应分类分组下展示

#### Scenario: Skill 未声明分类
- **WHEN** Skill 定义中未提供 `category` 字段或其值为空
- **THEN** 该 Skill 归入 `Other` 分类分组

### Requirement: 技能 Tab 按分类分组展示
技能 Tab SHALL 按分类分组展示所有已注册 Skill。分类按固定顺序排列：Business、Product、Development、Testing、Other。每个分组显示分类标题和该分类下的技能行列表。分类标题 SHALL 通过 `t('skills.categories.<CategoryKey>')` 获取当前语言的翻译值。

#### Scenario: 分类分组渲染
- **WHEN** 用户点击"技能"Tab
- **THEN** 页面以分类分组展示，每个分组包含分类标题和该分类下所有技能行，不包含 Skill 的分类不显示该分组
- **AND** 分类标题使用当前语言的翻译值

#### Scenario: 空分类隐藏
- **WHEN** `Development` 分类下无 Skill
- **THEN** `Development` 分组不显示

#### Scenario: 英文分类标题
- **WHEN** 当前语言为 `en`
- **AND** 技能 Tab 渲染 `Development` 分类
- **THEN** 分类标题显示为 `Development`

#### Scenario: 中文分类标题
- **WHEN** 当前语言为 `zh-CN`
- **AND** 技能 Tab 渲染 `Development` 分类
- **THEN** 分类标题显示为 `开发`

### Requirement: MD 技能分类分布
所有 MD 格式技能 SHALL 在 front matter 中声明 `category` 字段，使用英文值（`Business`、`Product`、`Development`、`Testing`）。成功加载后，技能按声明的分类在技能 Tab 中分布展示。

#### Scenario: MD 技能分类分布
- **WHEN** `loadAllSkills()` 完成，技能按 front matter 中声明的分类注册
- **THEN** 技能 Tab 各分组展示对应分类的技能行
