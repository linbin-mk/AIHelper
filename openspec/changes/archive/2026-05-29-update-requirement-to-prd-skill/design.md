## Context

当前 `requirement-summary` 技能仅包含骨架（YAML front matter + "待完善"正文），需要重命名为 `requirement-to-prd` 并填充完整的 PRD 生成提示词。项目已有 `provide_file` 内置工具支持以文件卡片形式提供下载，无需额外开发新工具。技能系统已重构为 MD 格式，所有技能都在 `chrome-extension/skills/<skill-id>/` 下以 `skill.cn.md` / `skill.en.md` 文件定义，通过 `manifest.json` 注册。

## Goals / Non-Goals

**Goals:**
- 将 `requirement-summary` 技能重命名为 `requirement-to-prd`，正文从空壳升级为完整的 PRD 生成工作流
- 引导 AI 自动利用已有知识库（`list_project_files`, `search_project_code`, `get_project_file`) 分析项目上下文
- 生成包含标准章节（需求背景、目标范围、用户故事、功能需求、验收标准、非功能需求、工时评估表格）的结构化 PRD 文档
- 通过现有 `provide_file` 工具（`chat.js:2002`）将生成的 PRD 导出为 `.md` 文件并触发浏览器下载
- 同步提供中英文版本

**Non-Goals:**
- 不新增自定义工具（使用已有 `provide_file` 和知识库工具）
- 不修改 `skill-registry.js`、`chat.js`、`panel.html` 等基础设施代码（仅修改 `manifest.json` 注册列表）

## Decisions

1. **使用 `provide_file` 而非自定义 `export_prd_md` 工具**: 现有 `provide_file` 已支持 fileName、content、mimeType 参数，功能完备。在技能提示词中明确告知 AI 使用该工具导出 PRD，避免引入新工具和 handler 代码。

2. **技能 ID 重命名为 `requirement-to-prd`**: 技能 ID 与目录名保持一致的 kebab-case 命名。需同步更新 `manifest.json` 的注册列表，删除旧 `requirement-summary` 目录。

3. **提示词设计策略**: 提示词采用"工作流驱动"模式，使用 `## 步骤 N` 结构引导 AI 严格按顺序执行：收集项目信息 → 生成PRD → 导出文件。同时给出 PRD 章节模板（Markdown 代码块），确保 AI 输出一致。

## Risks / Trade-offs

- **`provide_file` 的 MIME type 处理**: `provide_file` 支持 `mimeType` 参数，但 Markdown 文件的正确 MIME 类型应为 `text/markdown`，浏览器对此支持有限。→ 在提示词中指定使用 `text/plain`（大多数系统会关联 `.md` 扩展名），或依靠文件名 `.md` 后缀让浏览器正确识别。
- **知识库可能为空**: 若用户未同步项目文件，`list_project_files` 返回空。→ 提示词中包含降级策略：若无知识库，基于用户输入推断项目背景并在 PRD 中注明"基于需求描述推断，建议与研发确认工时"。
- **工时评估准确性**: AI 基于知识库内容推断工时，可能存在偏差。→ PRD 模板中注明"乐观估计，建议整体 buffer 系数 1.3x"。
