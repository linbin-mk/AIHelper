## ADDED Requirements

### Requirement: Skill registration

系统 SHALL 在 `skills/skills.json` 中注册 `fill-work-hours` 技能，使其可在扩展中加载和使用。

#### Scenario: 技能在 skills.json 中注册
- **WHEN** 查看 `skills/skills.json` 文件
- **THEN** 数组中包含 `"fill-work-hours"` 条目

### Requirement: Skill definition file (Chinese)

系统 SHALL 提供 `skills/fill-work-hours/skill.cn.md` 文件，包含 YAML frontmatter（id、name、description、category）和完整的工时填报引导流程提示词。

#### Scenario: 中文技能文件格式正确
- **WHEN** 读取 `skills/fill-work-hours/skill.cn.md`
- **THEN** 文件以 YAML frontmatter 开头，包含 `id: fill-work-hours`、`name: 智能填工时`、`category: Productivity`

#### Scenario: 中文技能包含完整执行流程
- **WHEN** 加载该技能
- **THEN** 提示词包含 6 个步骤：登录检测(Step 0)、默认工时询问(Step 1)、日期选择(Step 2)、需求搜索确认(Step 3)、任务预览授权(Step 4)、批量创建(Step 5)、结果汇总(Step 6)，以及可选的工作内容总结和错误处理指南

### Requirement: Skill definition file (English)

系统 SHALL 提供 `skills/fill-work-hours/skill.en.md` 文件，包含与中文版相同的 YAML frontmatter id 及英文翻译的流程提示词。

#### Scenario: 英文技能文件存在且格式正确
- **WHEN** 读取 `skills/fill-work-hours/skill.en.md`
- **THEN** 文件以 YAML frontmatter 开头，包含 `id: fill-work-hours`，name 和 description 为英文

### Requirement: Sync integration

技能文件 SHALL 通过 `bash sync.sh` 同步到 Chrome 和 Firefox 扩展目录。

#### Scenario: 运行 sync.sh 后技能出现在扩展目录
- **WHEN** 执行 `bash sync.sh`
- **THEN** `chrome-extension/skills/fill-work-hours/` 和 `firefox-extension/skills/fill-work-hours/` 目录包含 skill.cn.md 和 skill.en.md
