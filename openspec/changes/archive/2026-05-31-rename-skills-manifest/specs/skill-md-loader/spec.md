## MODIFIED Requirements

### Requirement: 技能目录自动扫描
系统 SHALL 在插件初始化时自动扫描 `chrome-extension/skills/` 目录，发现所有子目录并为每个子目录注册一个技能。扫描通过 `chrome.runtime.getURL('skills/skills.json')` 获取技能目录清单实现。每个子目录按 id 去重（相同 id 的目录只注册一次）。

#### Scenario: 扫描发现多个技能
- **WHEN** `skills/` 目录下存在 `code-master/`、`system-qa/`、`test-data-generation/` 子目录，各含至少一个 `skill.*.md` 文件
- **THEN** 系统注册 3 个技能，分别对应上述目录

#### Scenario: 空目录跳过
- **WHEN** `skills/` 下存在 `empty-skill/` 子目录但不包含任何 `skill.*.md` 文件
- **THEN** 该目录被跳过，不注册技能

#### Scenario: 无技能目录
- **WHEN** `skills/` 目录下没有任何包含 `skill.*.md` 文件的子目录
- **THEN** 技能列表为空，技能 Tab 显示空状态
