## ADDED Requirements

### Requirement: Skill 定义接口
系统 SHALL 支持通过 `window.__registerSkill(skillDefinition)` 注册 Skill。`skillDefinition` 必须包含 `id`（唯一标识）、`name`（显示名称）、`description`（描述）、`getPrompt()`（返回 prompt 片段）、`getTools()`（返回工具定义数组），可选 `getUIDelegate()`（返回 UI 扩展点）。注册即激活。

#### Scenario: Skill 文件自注册
- **WHEN** `skills/test-data-generation/index.js` 在页面加载时调用 `window.__registerSkill({id: "test-data-generation", name: "测试数据生成", ...})`
- **THEN** 该 Skill 被添加到注册表，且立即进入激活状态（`isActive("test-data-generation")` 返回 `true`）

#### Scenario: 注册一个无 UI 的 Skill
- **WHEN** 注册的 Skill 不提供 `getUIDelegate`
- **THEN** 该 Skill 正常注册并激活，`getUIDelegate()` 返回 `null`

### Requirement: SkillRegistry 管理 Skill 生命周期
系统 SHALL 提供 `SkillRegistry` 单例，通过 `window.__registerSkill(skill)` 注册（注册即激活）、支持 `getActive()` 获取所有激活 Skill、`getAll()` 获取所有已注册 Skill。

#### Scenario: 注册即激活
- **WHEN** 调用 `window.__registerSkill(testDataGenSkill)`
- **THEN** 该 Skill 同时被注册和激活，`isActive("test-data-generation")` 返回 `true`

#### Scenario: 重复注册同一 ID
- **WHEN** 以相同 `id` 调用 `__registerSkill()` 两次
- **THEN** 后注册的 Skill 覆盖前者，仍保持激活状态

### Requirement: 系统 Prompt 由 Skill 动态注入
聊天系统 SHALL 在构建系统消息时按两层结构注入 Skill 信息：
1. **技能目录**（始终注入）：所有已注册 Skill 的 `name` 和 `description`，无论激活状态
2. **已激活规则**（条件注入）：所有激活 Skill 的 `getPrompt()` 完整规则片段

#### Scenario: 有激活 Skill 时构建 prompt
- **WHEN** 有 2 个 Skill 激活，各自 `getPrompt()` 返回不同内容
- **THEN** 系统 prompt 包含基础上下文，后接 "## 已注册技能" 目录（所有 Skill），再后接 "## 已激活技能规则"（仅激活 Skill 的完整 prompt）

#### Scenario: 无激活 Skill 时构建 prompt
- **WHEN** 所有 Skill 均未激活
- **THEN** 系统 prompt 仍包含 "## 已注册技能" 目录（名称+描述），但不包含 "## 已激活技能规则" 章节

#### Scenario: 技能目录仅含轻量信息
- **WHEN** 技能目录被注入到系统 prompt 中
- **THEN** 每个 Skill 仅包含 `name` 和 `description` 字段，不包含完整 prompt 规则、工具定义或 handler 函数

### Requirement: 工具分发由 Skill 声明驱动
系统 SHALL 在处理 Agent 工具调用时，遍历所有激活 Skill 的工具列表查找匹配的工具名称，找到后调用其 `handler` 函数。找不到匹配时回退到内置工具处理。

#### Scenario: Skill 工具被匹配
- **WHEN** Agent 调用工具 "execute_request"，且激活的 Skill `test-data-generation` 的 `getTools()` 中包含匹配该名称的工具定义
- **THEN** 系统调用该工具的 `handler(args)` 并返回结果

#### Scenario: 工具无匹配回退到内置
- **WHEN** Agent 调用工具 "get_captured_requests"，且没有任何激活 Skill 提供同名工具
- **THEN** 系统回退到内置的 `executeBuiltinTool()` 处理

### Requirement: Panel "技能" Tab（只读目录）
系统 SHALL 在 Panel 导航栏中提供"技能"Tab，以只读目录形式展示所有已注册 Skill。每个 Skill 卡片显示名称、描述、关联工具标签和使用提示。此 Tab 不提供激活/停用控制。

#### Scenario: 查看技能目录
- **WHEN** 用户点击"技能"Tab
- **THEN** 页面以卡片列表展示所有已注册 Skill，每个卡片包含名称、描述、工具标签列表、使用提示文字 "输入 /skill-id 或直接描述需求即可使用"

#### Scenario: 技能 Tab 默认为空状态
- **WHEN** 用户首次打开"技能"Tab 且未注册任何 Skill
- **THEN** 显示空状态提示 "暂无可用的技能"

#### Scenario: 技能 Tab 无交互控制
- **WHEN** 用户查看"技能"Tab
- **THEN** 卡片上不存在开关、按钮等交互控件，仅展示信息

### Requirement: Skill UI 委托机制
系统 SHALL 支持 Skill 通过 `SkillUIDelegate` 扩展聊天消息的渲染。处理 AI 返回的文本时，先遍历所有激活 Skill 的 `onMessageParsed(messageEl, parsedText)`，若某个 Skill 返回 `true` 则表示已处理，跳过默认 Markdown 渲染。

#### Scenario: Skill 处理自己的消息格式
- **WHEN** AI 返回包含 taskCard JSON 的文本，且 `test-data-generation` Skill 激活
- **THEN** `onMessageParsed` 被调用，解析并渲染 taskCard 组件，返回 `true`，系统不再进行默认 Markdown 渲染

#### Scenario: 无 Skill 处理消息
- **WHEN** AI 返回普通文本，且所有激活 Skill 的 `onMessageParsed` 都返回 `false`
- **THEN** 系统使用默认 Markdown 渲染显示消息

### Requirement: 斜杠命令面板
系统 SHALL 在聊天输入框中支持 `/` 斜杠命令：当用户输入 `/` 时（输入框为空或以 `/` 开头），弹出下拉面板展示所有已注册 Skill 的列表，供用户选择。

#### Scenario: 空输入框输入 "/" 弹出面板
- **WHEN** 用户在空聊天输入框中输入 `/`
- **THEN** 在输入框上方弹出绝对定位的下拉面板，列出所有已注册 Skill，每行包含 Skill 名称和描述

#### Scenario: 输入 "/" 后前缀过滤
- **WHEN** 用户在输入框中输入 `/test`
- **THEN** 下拉面板仅展示 `id` 或 `name` 以 "test" 开头的 Skill

#### Scenario: 鼠标点击选择 Skill
- **WHEN** 用户在下拉面板中点击某个 Skill 行
- **THEN** 输入框内容替换为 `/skill-id `（Skill id + 空格），光标定位在空格之后，面板关闭

#### Scenario: 键盘上下选择 Skill
- **WHEN** 下拉面板可见时用户按 ↑ 或 ↓ 键
- **THEN** 当前高亮行移动，视图滚动确保高亮行可见

#### Scenario: 键盘 Enter 确认选择
- **WHEN** 下拉面板可见且某行高亮时用户按 Enter
- **THEN** 与点击选择相同的效果（输入框填入 Skill id，面板关闭）

#### Scenario: 键盘 Esc 关闭面板
- **WHEN** 下拉面板可见时用户按 Esc
- **THEN** 面板关闭，输入框内容恢复为面板弹出前的状态

#### Scenario: 输入内容不含 "/" 前缀时不弹出
- **WHEN** 用户输入普通文本（不以 `/` 开头）
- **THEN** 下拉面板不出现

### Requirement: 斜杠命令的语义为临时激活
通过斜杠命令选择的 Skill SHALL 在**本轮对话（单次 Agent Loop）**中生效，不影响该 Skill 在"技能"Tab 中的持久激活状态。临时激活 Skill 的 prompt 和工具 SHALL 与持久激活 Skill 合并注入。

#### Scenario: 斜杠命令临时激活 Skill
- **WHEN** 用户通过 `/test-data-generation 创建10个用户` 发送消息，且该 Skill 在"技能"Tab 中为停用状态
- **THEN** 本轮 Agent Loop 中 `test-data-generation` 的 prompt 和工具生效，对话结束后恢复为非激活

#### Scenario: 斜杠命令与持久激活合并
- **WHEN** "技能"Tab 中已持久激活 `test-data-generation`，用户又通过 `/code-review` 发送消息
- **THEN** 本轮对话中两个 Skill 的 prompt 和工具同时生效

### Requirement: 聊天框 Skill 状态指示器
系统 SHALL 在聊天消息区域与输入框之间展示当前激活 Skill 的 tag 列表。每个 tag 显示 Skill 名称和一个关闭按钮（`×`）。所有 tag 使用统一样式（无持久/临时区分）。

#### Scenario: 显示斜杠激活的 Skill tag
- **WHEN** 用户通过 `/test-data-generation` 激活了该 Skill
- **THEN** 聊天界面底部 `#skillStatusBar` 区域显示 "测试数据生成" tag，带 × 按钮

#### Scenario: 显示自主激活的 Skill tag
- **WHEN** AI 在回复中自主激活了 `test-data-generation`
- **THEN** 状态指示器自动显示 "测试数据生成" tag，样式与斜杠激活一致

#### Scenario: 同时显示多个激活的 Skill
- **WHEN** 同时有斜杠激活和自主激活的多个 Skill 生效
- **THEN** 状态栏显示所有 tag，统一样式

#### Scenario: 点击 × 终止 Skill 使用
- **WHEN** 用户点击某个 Skill tag 上的 × 按钮
- **THEN** 该 Skill 终止使用（斜杠激活的取消、自主激活的提前结束），tag 立即消失，当前对话不再使用该 Skill 规则

#### Scenario: 对话结束自动清除
- **WHEN** 本轮 Agent Loop 结束（新的对话开始）
- **THEN** 所有 tag 自动清除，因为所有激活均为临时生效

#### Scenario: 无激活 Skill 时隐藏指示器
- **WHEN** 没有 Skill 处于激活状态
- **THEN** `#skillStatusBar` 区域隐藏

### Requirement: AI 自主意图激活 Skill
系统 SHALL 允许 AI 根据用户自然语言请求自主判断意图并隐式激活匹配的 Skill，无需用户显式使用斜杠命令或持久开关。自主激活的 Skill 标记为临时激活（本轮对话有效，结束后自动清除）。

#### Scenario: AI 识别意图并自主激活
- **WHEN** 用户发送"帮我创建10条测试数据"（无 `/` 前缀），且 `test-data-generation` Skill 已注册但未激活
- **THEN** 系统 prompt 中"已注册技能"目录让 AI 看到该 Skill 的存在和描述
- **AND** AI 判断用户意图明显匹配该 Skill 后，自主应用其 prompt 规则（分析页面、生成 taskCard），并在回复开头说明正在使用该技能

#### Scenario: 自主激活后状态指示器更新
- **WHEN** AI 在回复中自主激活了某个 Skill
- **THEN** 聊天框状态指示器自动显示该 Skill 的 tag，本轮对话结束后自动移除

#### Scenario: 用户意图不匹配任何 Skill
- **WHEN** 用户发送"今天天气怎么样"，与任何已注册 Skill 的意图不匹配
- **THEN** AI 作为通用助手回答，不激活任何 Skill

#### Scenario: 自主激活不绕过安全确认
- **WHEN** AI 自主激活 `test-data-generation` 并生成 taskCard
- **THEN** 用户仍须在 taskCard 上点击"允许执行"才能触发实际 API 请求
