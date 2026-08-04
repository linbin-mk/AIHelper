## Why

当前 `requirement-summary` 技能仅为一个空壳（正文为"待完善"），无法实际使用。需要将其重命名为 `requirement-to-prd` 并升级为完整的「需求转PRD」功能：输入痛点或迭代需求，AI 自动基于项目知识库生成结构化 PRD 文档（含工时评估），并通过 `provide_file` 工具导出为 .md 文件下载。

## What Changes

- 创建 `chrome-extension/skills/requirement-to-prd/` 目录，编写 `skill.cn.md` 和 `skill.en.md`，包含完整 PRD 生成工作流（含需求背景、目标范围、用户故事、功能需求、验收标准、非功能需求、工时评估表格等章节模板）
- 删除旧的 `chrome-extension/skills/requirement-summary/` 目录（空壳技能）
- 更新 `chrome-extension/skills/manifest.json`，将 `requirement-summary` 替换为 `requirement-to-prd`
- 技能提示词中引导 AI 使用已内置的 `provide_file` 工具导出 PRD 文档，无需新增工具

## Capabilities

### New Capabilities
- `requirement-prd-skill`: 技能将具有完整的 PRD 生成能力——AI被激活后自动读取项目知识库、搜索相关代码模块、生成含工时评估的结构化PRD文档，并通过 `provide_file` 工具导出为 .md 文件

### Modified Capabilities
- `skill-md-format`: 技能目录从 `requirement-summary` 重命名为 `requirement-to-prd`，技能 ID 同步更新，格式规范本身不变（仍然是 MD 文件 + YAML front matter + Markdown 正文）

## Impact

- `chrome-extension/skills/requirement-to-prd/skill.cn.md` — 新建，含完整 PRD 工作流提示词
- `chrome-extension/skills/requirement-to-prd/skill.en.md` — 新建，英文版本
- `chrome-extension/skills/requirement-summary/` — 删除整个目录（旧空壳技能）
- `chrome-extension/skills/manifest.json` — 替换 `requirement-summary` 为 `requirement-to-prd`
- 无需修改 `skill-registry.js` 或 `panel.html`（技能通过 manifest.json 发现，ID 通过目录名匹配）
