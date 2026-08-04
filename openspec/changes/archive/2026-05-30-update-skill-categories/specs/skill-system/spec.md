## MODIFIED Requirements

### Requirement: Panel "技能" Tab（分类目录）
系统 SHALL 在 Panel 导航栏中提供"技能"Tab，以分类分组形式展示所有已注册 Skill。每个分类分组显示该分类下的技能行列表，每行仅展示名称和描述。点击技能行弹出详情弹窗展示完整 Prompt 规则。此 Tab 不提供激活/停用控制。

#### Scenario: 查看技能分类目录
- **WHEN** 用户点击"技能"Tab
- **THEN** 页面按固定顺序展示分类分组（业务、产品、开发、测试、其他），每个分组下以紧凑行展示该分类的所有 Skill，每行包含名称（加粗）和描述

#### Scenario: 技能 Tab 默认为空状态
- **WHEN** 用户首次打开"技能"Tab 且未注册任何 Skill
- **THEN** 显示空状态提示"暂无可用的技能"，不显示任何分类分组

#### Scenario: 技能 Tab 无交互控制
- **WHEN** 用户查看"技能"Tab
- **THEN** 技能行上不存在开关、按钮等交互控件，但行本身可点击触发详情弹窗

#### Scenario: 点击技能行弹出详情
- **WHEN** 用户点击技能行
- **THEN** 弹出模态弹窗展示该 Skill 的 `getPrompt()` 完整内容，弹窗右上角提供"使用"按钮

### Requirement: OpenSpec 四个技能注册
系统 SHALL 在页面加载时注册 4 个 OpenSpec 技能：
- `openspec-explore`：id `openspec-explore`，名称 "OpenSpec 探索"，分类 "开发"，描述 "需求探索与分析，不产生文件"
- `openspec-propose`：id `openspec-propose`，名称 "OpenSpec 提案"，分类 "开发"，描述 "创建变更提案，生成 proposal/design/specs/tasks"
- `openspec-apply`：id `openspec-apply`，名称 "OpenSpec 实现"，分类 "开发"，描述 "按任务清单逐步实现变更"
- `openspec-archive`：id `openspec-archive`，名称 "OpenSpec 归档"，分类 "开发"，描述 "归档已完成的变更"

#### Scenario: 四个技能在目录中可见
- **WHEN** 用户查看技能 Tab
- **THEN** "开发"分类下出现四个 OpenSpec 技能行，各自显示对应名称和描述

#### Scenario: 斜杠命令可发现
- **WHEN** 用户在聊天输入框中输入 `/openspec`
- **THEN** 下拉面板展示 4 个 OpenSpec 技能行（探索 / 提案 / 实现 / 归档），每行包含技能名称和简短描述
