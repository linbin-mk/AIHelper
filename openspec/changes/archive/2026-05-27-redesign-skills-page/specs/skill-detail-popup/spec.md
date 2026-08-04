## ADDED Requirements

### Requirement: 技能详情弹窗展示
系统 SHALL 提供技能详情弹窗：用户点击技能行后，弹出模态弹窗展示该 Skill 的完整信息。弹窗按顺序展示四个区块：描述（`description`）、方法集合（`getTools()` 工具名称标签）、技能规则（`getPrompt()` Markdown 渲染）、使用方式。弹窗标题为 Skill 的 `name` 字段。

#### Scenario: 点击技能行弹出弹窗
- **WHEN** 用户在技能 Tab 点击某个技能行
- **THEN** 弹出模态弹窗，标题为该 Skill 的 `name`

#### Scenario: 弹窗展示描述区块
- **WHEN** 弹窗展示 Skill 详情
- **THEN** 弹窗正文顶部展示"描述"区段，内容为 Skill 的 `description` 字段

#### Scenario: 弹窗展示方法集合区块
- **WHEN** 弹窗展示 Skill 详情
- **THEN** 弹窗正文展示"方法集合"区段，以标签形式列出 `getTools()` 中每个工具的 `function.name`

#### Scenario: 弹窗无工具时的展示
- **WHEN** Skill 的 `getTools()` 返回空数组
- **THEN** "方法集合"区段内容显示"无"

#### Scenario: 弹窗展示技能规则区块
- **WHEN** 弹窗展示 Skill 详情
- **THEN** 弹窗正文展示"技能规则"区段，内容为 `getPrompt()` 经 `renderMarkdown()` 渲染后的格式化内容

#### Scenario: 弹窗无 Prompt 时的处理
- **WHEN** Skill 的 `getPrompt()` 返回空字符串或仅空白
- **THEN** "技能规则"区段显示"该技能暂无详细规则说明"

#### Scenario: 弹窗展示使用方式区块
- **WHEN** 弹窗展示 Skill 详情
- **THEN** 弹窗正文底部展示"使用方式"区段，内容为"输入 /{skill-id} 或直接描述需求即可使用"

#### Scenario: 弹窗背景遮罩关闭
- **WHEN** 弹窗可见时用户点击背景遮罩区域
- **THEN** 弹窗关闭

#### Scenario: 弹窗右上角 × 关闭
- **WHEN** 弹窗可见时用户点击右上角 × 按钮
- **THEN** 弹窗关闭

### Requirement: 弹窗"使用"快捷按钮
弹窗右上角 SHALL 提供"使用"按钮。点击后执行：切换到聊天 Tab、激活该 Skill、聊天输入框填入 `/skill-id `（Skill id + 空格），光标定位在空格之后。

#### Scenario: 点击"使用"按钮
- **WHEN** 用户在"测试数据生成"弹窗中点击"使用"按钮
- **THEN** 面板切换到"AI 聊天"Tab，`test-data-generation` Skill 被激活，聊天输入框内容变为 `/test-data-generation `，光标定位在空格之后

#### Scenario: "使用"按钮对占位 Skill 同样可用
- **WHEN** 用户在占位 Skill（如"系统解答专家"）弹窗中点击"使用"按钮
- **THEN** 面板切换到聊天 Tab，该 Skill 被激活，输入框填入 `/system-qa `，但由于该 Skill 无实际 prompt，AI 仅能通过技能目录中的描述信息判断意图
