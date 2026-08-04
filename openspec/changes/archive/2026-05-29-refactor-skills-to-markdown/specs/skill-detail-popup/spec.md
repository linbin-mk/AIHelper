## MODIFIED Requirements

### Requirement: 技能详情弹窗展示
系统 SHALL 提供技能详情弹窗：用户点击技能行后，弹出模态弹窗展示该 Skill 的完整信息。弹窗内容为该技能 MD 文件的正文部分（Markdown 格式），经 `renderMarkdown()` 渲染后展示。弹窗标题为 Skill 的 `name` 字段。

#### Scenario: 点击技能行弹出弹窗
- **WHEN** 用户在技能 Tab 点击某个技能行
- **THEN** 弹出模态弹窗，标题为该 Skill 的 `name`

#### Scenario: 弹窗渲染技能 MD 正文
- **WHEN** 弹窗展示 MD 格式技能的详情
- **THEN** 弹窗正文展示该技能 `skill.md` 文件的 Markdown 渲染内容（包含标题、列表、代码块等格式）

#### Scenario: 弹窗无正文内容
- **WHEN** Skill 的 `getPrompt()` 返回空字符串或仅空白
- **THEN** 弹窗显示"该技能暂无详细说明"

#### Scenario: 弹窗背景遮罩关闭
- **WHEN** 弹窗可见时用户点击背景遮罩区域
- **THEN** 弹窗关闭

#### Scenario: 弹窗右上角 × 关闭
- **WHEN** 弹窗可见时用户点击右上角 × 按钮
- **THEN** 弹窗关闭

### Requirement: 弹窗"使用"快捷按钮
弹窗右上角 SHALL 提供"使用"按钮。点击后执行：切换到聊天 Tab、激活该 Skill、聊天输入框填入 `/skill-id `（Skill id + 空格），光标定位在空格之后。

#### Scenario: 点击"使用"按钮
- **WHEN** 用户在技能弹窗中点击"使用"按钮
- **THEN** 面板切换到 "AI 聊天" Tab，该 Skill 被激活，聊天输入框内容变为 `/<skill-id> `，光标定位在空格之后

#### Scenario: "使用"按钮对 MD 技能同样可用
- **WHEN** 用户在 MD 格式技能弹窗中点击"使用"按钮
- **THEN** 面板切换到聊天 Tab，该 Skill 被激活，输入框填入 `/<skill-id> `
