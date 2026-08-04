## ADDED Requirements

### Requirement: Skill 定义接口
系统 SHALL 支持两种方式注册 Skill：
1. **MD 文件方式**：通过 `SkillRegistry.loadAllSkills()` 自动扫描并加载 `skills/` 目录下的 `skill.<lang>.md` 文件，解析 YAML front matter 获取元数据（`id`、`name`、`description`、`category`），Markdown 正文作为 `getPrompt()` 内容。MD 方式注册的技能不自动激活。
2. **代码注册方式**（向后兼容）：通过 `window.__registerSkill(skillDefinition)` 注册 Skill 对象，`skillDefinition` 必须包含 `id`、`name`、`description`、`getPrompt()`、`getTools()`，可选 `getUIDelegate()`、`category`。

#### Scenario: MD 文件自注册
- **WHEN** 插件初始化时 `loadAllSkills()` 扫描 `skills/code-master/skill.cn.md`，成功解析 front matter 和正文
- **THEN** 该 Skill 被添加到注册表，具备 `id: "code-master"`、`name: "代码大师"`、`description`、`category` 字段，`getPrompt()` 返回 MD 正文内容。技能已注册但未激活（`isActive("code-master")` 返回 `false`）

#### Scenario: JS 代码向后兼容注册
- **WHEN** `skills/test-data-generation/index.js` 在页面加载时调用 `window.__registerSkill({id: "test-data-generation", name: "测试数据生成", category: "测试", ...})`
- **THEN** 该 Skill 被添加到注册表

#### Scenario: 注册一个无 UI 的 Skill
- **WHEN** 注册的 Skill 不提供 `getUIDelegate` 和 `category`
- **THEN** 该 Skill 正常注册，`getUIDelegate()` 返回 `null`，`category` 未定义时归入"其他"

#### Scenario: 注册带分类的 Skill
- **WHEN** 注册的 Skill 包含 `category: '开发'`
- **THEN** 该 Skill 被标记为"开发"分类

### Requirement: SkillRegistry 管理 Skill 生命周期
系统 SHALL 提供 `SkillRegistry` 单例。支持以下操作：
- `register(skill)`：注册技能对象
- `loadAllSkills()`：异步扫描 `skills/` 目录并加载所有 MD 技能文件
- `activate(skillId)` / `deactivate(skillId)`：激活/停用技能
- `isActive(skillId)`：查询激活状态
- `getActive()`：获取所有已激活 Skill
- `getAll()`：获取所有已注册 Skill

#### Scenario: MD 加载后注册
- **WHEN** `loadAllSkills()` 完成后，所有成功解析的 MD 技能被注册
- **THEN** 所有 MD 技能在 `getAll()` 中可见，但在 `getActive()` 中不可见（未激活）

#### Scenario: 重复注册同一 ID
- **WHEN** 以相同 `id` 调用 `__registerSkill()` 两次
- **THEN** 后注册的 Skill 覆盖前者

#### Scenario: MD 重新加载覆盖
- **WHEN** 语言切换后 `loadAllSkills()` 重新加载，同一 ID 的 MD 技能被重新注册
- **THEN** 该技能对象被更新为新的语言版本，激活状态不受影响

### Requirement: 系统 Prompt 由 Skill 动态注入
聊天系统 SHALL 在构建系统消息时按两层结构注入 Skill 信息：
1. **技能目录**（始终注入）：所有已注册 Skill 的 `name` 和 `description`，无论激活状态
2. **已激活规则**（条件注入）：所有激活 Skill 的 `getPrompt()` 完整规则片段（MD 技能的 `getPrompt()` 返回 MD 正文）

#### Scenario: 有激活 Skill 时构建 prompt
- **WHEN** 有 2 个 Skill 激活，各自 `getPrompt()` 返回不同内容
- **THEN** 系统 prompt 包含基础上下文，后接 "## 已注册技能" 目录（所有 Skill），再后接 "## 已激活技能规则"（仅激活 Skill 的完整 prompt）

#### Scenario: MD 技能 prompt 注入
- **WHEN** 激活的 `code-master` 为 MD 格式技能
- **THEN** 该技能的 `getPrompt()` 返回其 `skill.cn.md` 正文内容，被注入到 "已激活技能规则" 章节

#### Scenario: 无激活 Skill 时构建 prompt
- **WHEN** 所有 Skill 均未激活
- **THEN** 系统 prompt 仍包含 "## 已注册技能" 目录（名称+描述），但不包含 "## 已激活技能规则" 章节

#### Scenario: 技能目录仅含轻量信息
- **WHEN** 技能目录被注入到系统 prompt 中
- **THEN** 每个 Skill 仅包含 `name` 和 `description` 字段，不包含完整 prompt 规则

### Requirement: 工具分发由 Skill 声明驱动
系统 SHALL 在处理 Agent 工具调用时，遍历所有激活 Skill 的工具列表查找匹配的工具名称，找到后调用其 `handler` 函数。找不到匹配时回退到内置工具处理。MD 格式技能的 `getTools()` 返回空数组，不声明专属工具。

#### Scenario: Skill 工具被匹配
- **WHEN** Agent 调用工具 "execute_request"，且激活的 Skill `test-data-generation` 的 `getTools()` 中包含匹配该名称的工具定义
- **THEN** 系统调用该工具的 `handler(args)` 并返回结果

#### Scenario: MD 技能无专属工具
- **WHEN** Agent 调用任意工具，且仅 MD 格式技能激活
- **THEN** 所有激活 MD 技能的 `getTools()` 返回空数组，系统回退到内置工具处理

#### Scenario: 工具无匹配回退到内置
- **WHEN** Agent 调用工具 "get_captured_requests"，且没有任何激活 Skill 提供同名工具
- **THEN** 系统回退到内置的 `executeBuiltinTool()` 处理

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
