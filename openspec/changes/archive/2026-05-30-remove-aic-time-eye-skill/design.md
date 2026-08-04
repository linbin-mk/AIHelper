## Context

`aic-time-eye` 是 Chrome 扩展技能系统中的一个占位技能，位于 `chrome-extension/skills/aic-time-eye/`，包含中英文两个 Markdown 文件（`skill.cn.md`、`skill.en.md`）。该技能由 `manifest.json` 注册加载，但实际内容始终为"待完善"，从未实现功能。

当前技能系统中技能通过以下方式加载：`manifest.json` 列出的技能名 → 目录扫描加载对应 `skill.{lang}.md` 文件。技能本身是纯声明式的 Markdown 文件，无关联的 JS/HTML/CSS 代码。

## Goals / Non-Goals

**Goals:**
- 从系统中完全移除 `aic-time-eye` 技能的所有痕迹
- 保持技能系统加载机制的完整性（不影响其他技能）

**Non-Goals:**
- 不涉及技能加载框架的修改
- 不涉及其他技能的变更
- 不添加替代技能或新功能

## Decisions

- **直接删除目录 vs 仅从 manifest 移除**：选择完全删除目录和 manifest 注册项。仅从 manifest 移除会导致孤立的 dead code 目录残留。
- **README 更新方式**：将"内置 8 个技能"改为"内置 7 个技能"，并从技能列表和目录结构中移除对应条目。
- **回滚考虑**：变更仅限于文件删除和文本修改，可通过 `git revert` 完整回滚。

## Risks / Trade-offs

- **[低风险] 误删风险**：删除后无法直接恢复技能内容 → 通过 Git 历史可随时恢复
- **[无风险] 兼容性**：技能加载通过 manifest 驱动，缺少条目不会导致运行时错误
