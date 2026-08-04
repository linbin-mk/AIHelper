## ADDED Requirements

### Requirement: 技能身份定义
`product-expert` 技能 SHALL 以通用产品专家身份定义，不绑定任何具体产品。角色描述 SHALL 明确知识来源为知识库（代码、文档、配置）和会话记忆（历史问答、决策记录），面向使用者、实施人员、开发者三类受众。

#### Scenario: 中文版身份定义正确
- **WHEN** 读取 `skill.cn.md` 的角色定义部分
- **THEN** 正文开头声明「你是产品专家，你的知识来源是本产品的知识库和会话记忆」

#### Scenario: 英文版身份定义正确
- **WHEN** 读取 `skill.en.md` 的角色定义部分
- **THEN** 正文开头声明对应英文描述

### Requirement: 工作流定义
技能 SHALL 定义「先查后答，有据可依」的工作流程：理解意图 → 检索知识库（`search_project_code` / `get_project_file` / `list_project_files`）→ 检索记忆（`search_memories` / `get_memory_file`）→ 综合回答。

#### Scenario: 工作流包含 4 步
- **WHEN** 读取技能 MD 的工作流部分
- **THEN** 存在理解意图、检索知识库、检索记忆、综合回答共 4 个步骤

#### Scenario: 工具使用表存在
- **WHEN** 读取技能 MD 的工作流部分
- **THEN** 存在场景-工具对应表格，包含 `search_project_code`、`search_memories`、`ask_user`、`display_table`、`provide_file`、`activate_skill`、`request_auth` 等工具

### Requirement: 只引用现行工具
技能正文 SHALL 只引用当前系统已实现的 22 个公共工具，SHALL NOT 引用任何不存在的方法。

#### Scenario: 不存在工具零引用
- **WHEN** 搜索技能 MD 全文
- **THEN** 不出现 `get_extension_info`、`list_skills`、`get_config_summary`、`list_active_headers`、`diagnose.js`、`maskSecret` 等字样

#### Scenario: 工具引用均为现行工具
- **WHEN** 正文中出现工具名称
- **THEN** 每个工具名称均属于 22 个现行公共工具之一

### Requirement: YAML Front Matter 字段合规
`skill.cn.md` 和 `skill.en.md` 的 YAML front matter SHALL 包含 `id`（`product-expert`）、`name`（「产品专家」/「Product Expert」）、`description`（非空字符串，体现通用产品专家定位）、`category`（`产品`）。

#### Scenario: front matter 字段正确
- **WHEN** 解析 skill MD 的 front matter
- **THEN** `id` 为 `product-expert`，`name` 为对应语言名称，`category` 为 `产品`

### Requirement: 输出形式定义
技能 SHALL 定义 5 种输出形式：文本回答（默认，结论先行）、表格卡（`display_table`）、询问卡（`ask_user`）、文件卡（`provide_file`）、授权卡（`request_auth`）。

#### Scenario: 5 种输出形式完整
- **WHEN** 读取技能 MD 的输出形式部分
- **THEN** 存在文本回答、表格卡、询问卡、文件卡、授权卡共 5 种形式的描述

### Requirement: 技能文件自包含
技能 MD 文件 SHALL 是自包含的，正文包含全部技能上下文，不依赖外部参考文件。

#### Scenario: 不依赖外部文件
- **WHEN** 读取任一项技能 MD 的正文
- **THEN** 正文不包含指向外部 Markdown 文件的相对链接

### Requirement: 目录与文件结构
`product-expert` 技能 SHALL 位于 `chrome-extension/skills/product-expert/`，包含 `skill.cn.md` 和 `skill.en.md` 两个文件。`skills.json` 中 SHALL 注册 `product-expert`。

#### Scenario: 目录结构正确
- **WHEN** 列出 `chrome-extension/skills/product-expert/` 目录
- **THEN** 仅存在 `skill.cn.md` 和 `skill.en.md` 两个文件

#### Scenario: skills 清单注册正确
- **WHEN** 读取 `chrome-extension/skills/skills.json`
- **THEN** 数组中包含 `"product-expert"`
