## Why

当前"语义激活"并非真正的激活——`buildSkillDirectory()` 仅注入 Skill 的 `id + description`，AI 看不到 Skill 完整正文。AI 只能基于一句话描述推断 Skill 行为，而非严格遵循完整指令。

同时，手动激活（`/skillId`、面板"使用"按钮）和语义激活是两套独立逻辑——手动激活调 `registry.activate()`，语义激活无入口。

## What Changes

- **提取共享 `activateSkill(skillId)` 函数**：将激活逻辑统一为一个入口，手动激活和语义激活都调用此函数
- **新增 `activate_skill` 工具**：AI 调用此工具时，底层调同一 `activateSkill()` 函数，返回完整 `getPrompt()` 正文
- **统一行为**：无论哪种激活方式，都触发 `registry.activate()` → `renderSkillStatusBar()`（状态栏 tag 显示）
- **更新 i18n 提示**：`chat.skillAutoUseHint` 告知 AI 通过 `activate_skill` 激活技能获取完整规则

## Capabilities

### New Capabilities
- `activate-skill-method`: 提取共享 `activateSkill()` 函数 + 新增 `activate_skill` 工具，统一手动/语义激活入口

## Impact

- 受影响代码：`chrome-extension/src/panel/chat.js`（提取 `activateSkill()` + 新增 TOOLS 条目 + `executeToolCall` 分支 + `selectSlashSkill` 改用新函数）
- 受影响代码：`chrome-extension/src/panel/panel.js`（"使用"按钮改用 `activateSkill()`）
- 受影响配置：`chrome-extension/src/panel/i18n.js`（`chat.skillAutoUseHint`）
- 重构安全：`registry.activate()` 行为不变，`renderSkillStatusBar()` 触发不变
