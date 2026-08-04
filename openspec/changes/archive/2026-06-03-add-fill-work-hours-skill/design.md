## Context

当前 AIHelper 项目已有 11 个技能（如 code-master、test-data-generation、product-expert 等），技能系统以 Markdown 文件 + YAML frontmatter 形式定义，通过 `skills/skills.json` 注册，经 `sync.sh` 同步到 Chrome/Firefox 扩展目录。本次变更遵循相同的技能定义模式，无需引入新的架构模式或外部依赖。

## Goals / Non-Goals

**Goals:**
- 新增 `fill-work-hours` 技能，提供对话式工时填报引导流程
- 技能内容采用与小鹏工单系统 API 对接的步骤式提示词
- 遵循现有技能文件规范（YAML frontmatter + Markdown 提示词正文）
- 注册到 `skills.json` 并可通过 sync.sh 同步到两个浏览器扩展

**Non-Goals:**
- 不修改技能加载/解析引擎
- 不新增 API 接口或修改后端逻辑
- 不修改 sync.sh 同步脚本
- 不涉及小鹏工单系统 API 变更

## Decisions

1. **技能目录命名**: 使用 `fill-work-hours`（与用户提供的 skill 文件名一致），遵循 kebab-case 惯例
2. **技能内容适配**: 用户提供的 `fill-work-hours-skill.md` 作为 `skill.cn.md` 的中文内容来源，移除文件顶部的 `# fill-work-hours（智能填工时）` 标题行（由 YAML frontmatter 的 `name` 字段替代），确保符合现有技能格式
3. **英文版**: 创建 `skill.en.md`，内容为中文版的英文翻译，保持相同的 YAML frontmatter id 和结构化流程
4. **Frontmatter 配置**: `id: fill-work-hours`, `name: 智能填工时`, `category: Productivity`
5. **注册**: 将 `"fill-work-hours"` 追加到 `skills/skills.json` 数组末尾

## Risks / Trade-offs

- **API 字段编码硬编码**: 技能内容中包含小鹏工单系统的固定字段编码（如 `FIELD_20250925161810000090`），若工单系统字段变更需同步更新技能文件
  → 缓解：技能文件为纯 Markdown，修改成本低
- **登录态依赖**: 技能流程依赖用户在浏览器中已登录 xpd.x-peng.com
  → 已内置 401 检测和重试机制（最多 3 次）
- **英文版翻译质量**: 英文版需翻译流程说明
  → 保持简洁的英文翻译，优先保证功能可用性
