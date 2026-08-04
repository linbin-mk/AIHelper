## ADDED Requirements

### Requirement: 代码大师 Skill 注册
系统 SHALL 在页面加载时注册 "代码大师" Skill，id 为 `code-master`，名称为 "代码大师"，分类为 "开发"，描述为 "AI 向导式代码开发，从需求到代码一条龙完成，适合非技术用户"。

#### Scenario: 代码大师在技能目录中可见
- **WHEN** 用户打开 Panel "技能" Tab
- **THEN** "开发" 分类分组下出现 "代码大师" 技能行，显示名称 "代码大师" 和描述

#### Scenario: 斜杠命令可发现
- **WHEN** 用户在聊天输入框中输入 `/代码大师`
- **THEN** 下拉面板展示 "代码大师" 技能行

#### Scenario: AI 可自主激活
- **WHEN** 用户发送 "帮我开发一个功能" 或 "我想写代码" 等自然语言请求
- **THEN** AI 可根据 skill 描述自主激活 "代码大师" Skill，开始向导流程

### Requirement: 五阶段向导式开发流程
代码大师 Skill SHALL 引导用户按顺序完成五个阶段：需求描述、方案确认、代码实现、测试验证、归档完成。每个阶段结束时 SHALL 通过 askUser 工具发起询问卡片，用户确认后才进入下一阶段。用户可随时说 "取消" 或 "退出" 终止流程。

#### Scenario: 阶段1 — 需求描述
- **WHEN** "代码大师" Skill 被激活
- **THEN** AI 首先调用 askUser 工具，参数包含 `question: "请描述你想开发什么功能？"`、`allowFreeInput: true`、`placeholder: "例如：我想给网站加一个用户登录功能..."`，等待用户输入需求描述

#### Scenario: 阶段2 — 方案确认
- **WHEN** 用户提交了需求描述
- **THEN** AI 自动执行 `openspec new change` 创建 change，生成 proposal、design、specs 和 tasks 文件，然后调用 askUser 工具展示方案摘要和确认选项 `["确认方案，开始实现", "我想修改方案", "取消"]`，等待用户选择

#### Scenario: 阶段3 — 代码实现
- **WHEN** 用户确认方案
- **THEN** AI 按 tasks.md 中的任务清单逐项实现代码，每完成一项更新任务状态为已完成。所有任务完成后调用 askUser 工具展示 `["通过，进入下一步", "有问题需要修复", "我想查看代码变更"]`，等待用户选择

#### Scenario: 阶段4 — 测试验证
- **WHEN** 所有实现任务完成
- **THEN** AI 运行项目测试（如 `npm test`），将结果汇总后调用 askUser 工具展示 `["通过，确认归档", "有问题需要修复"]`，等待用户选择

#### Scenario: 阶段5 — 归档完成
- **WHEN** 用户确认测试通过
- **THEN** AI 调用 askUser 工具展示 `["确认归档", "暂不归档"]`，用户确认后执行 `openspec archive` 完成归档，输出完成总结

#### Scenario: 用户中途取消
- **WHEN** 用户在任意阶段的询问卡片中选择 "取消"
- **THEN** AI 退出向导流程，告知用户当前进度状态和如何恢复

### Requirement: OpenSpec CLI 自动调度
代码大师 Skill SHALL 在流程中自动调用 openspec CLI 完成底层操作，包括 `openspec new change`、`openspec status`、`openspec instructions`、`openspec archive` 等命令。用户无需了解或手动输入这些命令。

#### Scenario: 自动创建 change 目录
- **WHEN** 用户提交需求描述后
- **THEN** AI 自动执行 `openspec new change "<kebab-case-name>"` 创建 change 目录结构

#### Scenario: 自动生成 proposal/design/specs/tasks
- **WHEN** change 目录创建完成后
- **THEN** AI 按 OpenSpec 规范自动生成 proposal.md、design.md、specs/*.md、tasks.md 文件，不要求用户手动运行任何命令

#### Scenario: 自动完成归档
- **WHEN** 用户确认归档
- **THEN** AI 自动执行 `openspec archive` 将 change 移动到 archive 目录，并生成归档总结

### Requirement: 进度持久化与恢复
代码大师 Skill SHALL 在每阶段完成后更新进度状态，使得用户退出后重新激活 Skill 时能从上次中断的阶段继续，而非从头开始。

#### Scenario: 从中断处恢复
- **WHEN** 用户在阶段2（方案确认）退出后重新激活 "代码大师" Skill
- **THEN** AI 检测到已有 change 目录和部分 artifacts，提示用户 "检测到未完成的开发任务 [change-name]，当前进度：方案已生成。是否继续？" 并给出选项 `["继续上次的任务", "开始新的任务"]`

#### Scenario: 开始全新任务
- **WHEN** 用户选择 "开始新的任务" 或没有未完成的任务
- **THEN** AI 从阶段1（需求描述）开始全新向导流程
