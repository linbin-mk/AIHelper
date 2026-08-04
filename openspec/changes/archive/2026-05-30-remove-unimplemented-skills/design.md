## Context

"业务问题反馈" 和 "智能测试" 是在 `2026-05-27-redesign-skills-page` 变更中作为占位技能引入的，最初以 `index.js` 形式存在，后经由 `2026-05-29-refactor-skills-to-markdown` 迁移为 Markdown 格式的 `skill.cn.md` 和 `skill.en.md`。两个技能的内容仅为 `> 待完善` / `> To be completed`，从未被实际实现。

当前通过 `chrome-extension/skills/manifest.json` 注册，`skill-registry.js` 的 `loadAllSkills()` 方法会遍历 manifest 加载所有技能。由于这些文件是合法的 Markdown 技能文件（包含 name、description、category），加载后会在技能面板中正常展示，但用户点击后只能看到占位说明，体验不佳。

## Goals / Non-Goals

**Goals:**
- 删除两个未实现技能的 Markdown 文件
- 从技能注册清单中移除对应条目
- 更新 README 中的技能列表描述

**Non-Goals:**
- 不实现这两个技能的实际功能
- 不改变技能加载机制或分类系统
- 不修改 `skill-category-system` spec

## Decisions

**直接删除文件并更新 manifest 和 README**

这是最直接的方式，无需代码改动。技能系统通过 `manifest.json` 控制加载哪些技能，移除条目后对应的目录即使存在也不会加载。但为了保持仓库整洁，一并删除目录。

## Risks / Trade-offs

- **风险**: 未来有人想实现这两个技能时需重新创建目录和 manifest 条目 → **缓解**: 重新创建只需复制现有技能模板并添加 manifest 条目，成本很低
- **风险**: README 更新的中文描述可能丢失 → **缓解**: README 中原本就是简短提及，更新后更准确反映当前功能
