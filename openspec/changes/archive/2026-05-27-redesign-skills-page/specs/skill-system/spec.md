## MODIFIED Requirements

### Requirement: Skill 定义接口
系统 SHALL 支持通过 `window.__registerSkill(skillDefinition)` 注册 Skill。`skillDefinition` 必须包含 `id`（唯一标识）、`name`（显示名称）、`description`（描述）、`getPrompt()`（返回 prompt 片段）、`getTools()`（返回工具定义数组），可选 `getUIDelegate()`（返回 UI 扩展点）、`category`（所属分类，默认归入"其他"）。注册即激活。

#### Scenario: Skill 文件自注册
- **WHEN** `skills/test-data-generation/index.js` 在页面加载时调用 `window.__registerSkill({id: "test-data-generation", name: "测试数据生成", category: "测试", ...})`
- **THEN** 该 Skill 被添加到注册表，且立即进入激活状态（`isActive("test-data-generation")` 返回 `true`）

#### Scenario: 注册一个无 UI 的 Skill
- **WHEN** 注册的 Skill 不提供 `getUIDelegate` 和 `category`
- **THEN** 该 Skill 正常注册并激活，`getUIDelegate()` 返回 `null`，`category` 未定义

#### Scenario: 注册带分类的 Skill
- **WHEN** 注册的 Skill 包含 `category: '开发'`
- **THEN** 该 Skill 被标记为"开发"分类

### Requirement: Panel "技能" Tab（分类目录）
系统 SHALL 在 Panel 导航栏中提供"技能"Tab，以分类分组形式展示所有已注册 Skill。每个分类分组显示该分类下的技能行列表，每行仅展示名称和描述。点击技能行弹出详情弹窗展示完整 Prompt 规则。此 Tab 不提供激活/停用控制。

#### Scenario: 查看技能分类目录
- **WHEN** 用户点击"技能"Tab
- **THEN** 页面按固定顺序展示分类分组（通用、业务、产品、开发、测试、其他），每个分组下以紧凑行展示该分类的所有 Skill，每行包含名称（加粗）和描述

#### Scenario: 技能 Tab 默认为空状态
- **WHEN** 用户首次打开"技能"Tab 且未注册任何 Skill
- **THEN** 显示空状态提示"暂无可用的技能"，不显示任何分类分组

#### Scenario: 技能 Tab 无交互控制
- **WHEN** 用户查看"技能"Tab
- **THEN** 技能行上不存在开关、按钮等交互控件，但行本身可点击触发详情弹窗

#### Scenario: 点击技能行弹出详情
- **WHEN** 用户点击技能行
- **THEN** 弹出模态弹窗展示该 Skill 的 `getPrompt()` 完整内容，弹窗右上角提供"使用"按钮
