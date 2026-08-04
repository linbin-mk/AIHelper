## 1. 技能文件创建

- [x] 1.1 创建 `skills/fill-work-hours/` 目录
- [x] 1.2 创建 `skills/fill-work-hours/skill.cn.md`：从 `fill-work-hours-skill.md` 适配内容，添加 YAML frontmatter（id/name/description/category），移除原有标题行，保留完整流程提示词
- [x] 1.3 创建 `skills/fill-work-hours/skill.en.md`：基于中文版翻译为英文，保持相同 id 和结构化流程

## 2. 注册与同步

- [x] 2.1 在 `skills/skills.json` 数组中追加 `"fill-work-hours"`
- [x] 2.2 运行 `bash sync.sh` 同步技能文件到 `chrome-extension/skills/` 和 `firefox-extension/skills/`

## 3. 验证

- [x] 3.1 确认 `skills/skills.json` 包含 `fill-work-hours`
- [x] 3.2 确认 `chrome-extension/skills/fill-work-hours/` 包含 skill.cn.md 和 skill.en.md
- [x] 3.3 确认 `firefox-extension/skills/fill-work-hours/` 包含 skill.cn.md 和 skill.en.md
- [x] 3.4 验证 `skill.cn.md` 的 YAML frontmatter 格式正确（id、name、description、category 字段齐全）
