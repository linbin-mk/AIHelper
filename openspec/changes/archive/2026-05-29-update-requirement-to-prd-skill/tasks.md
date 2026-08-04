## 1. 创建新技能目录

- [x] 1.1 创建 `chrome-extension/skills/requirement-to-prd/` 目录
- [x] 1.2 编写 `skill.cn.md`：front matter 含 `id: requirement-to-prd`、`name: 需求转PRD`、`description` 和 `category: 产品`；正文含完整 PRD 生成工作流（步骤1-6）、PRD 章节模板（Markdown 代码块）、工时评估原则和表格模板、行为约束（禁止采访用户、降级策略）
- [x] 1.3 编写 `skill.en.md`：英文对应版本

## 2. 更新注册与清理

- [x] 2.1 更新 `chrome-extension/skills/manifest.json`，将 `requirement-summary` 替换为 `requirement-to-prd`
- [x] 2.2 删除旧的 `chrome-extension/skills/requirement-summary/` 目录

## 3. 验证

- [x] 3.1 确认 `manifest.json` 中技能列表包含 `requirement-to-prd`，不包含 `requirement-summary`
- [x] 3.2 确认技能在中文/英文界面下均能正确加载并展示更新后的 description
