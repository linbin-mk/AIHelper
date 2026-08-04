## Why

当前技能重置功能只能恢复到内置默认值，用户的所有编辑历史在每次保存后立即丢失。用户需要能够回溯到任意历史版本，而不是只能"一刀切"地回到原始状态。这限制了用户试错和迭代优化技能提示词的能力。

## What Changes

- **新增**技能编辑历史记录：每次用户保存技能编辑时，将当前编辑前的完整内容（name、description、_prompt、category）保存为一个历史版本快照，附带时间戳
- **新增**历史版本悬浮框 UI：点击「重置」按钮后弹出历史版本列表，展示每次保存的时间点和版本摘要，点击任意版本将其内容加载到编辑表单，用户确认/修改后保存即可
- **新增**历史版本持久化：将版本历史存储到 `chrome.storage.local`，支持跨会话恢复
- **修改**重置按钮交互：不再直接执行重置，改为打开历史版本选择悬浮框
- **修改** `SkillRegistry.update()` 方法：在保存新编辑前自动创建历史快照
- **修改** `SkillRegistry.resetSkill()` 方法：保留原有直接重置逻辑作为兜底，新增 `getHistory()` 方法供 UI 查询
- **新增**历史版本数量上限（保留最近 20 个版本），超出时自动清理最旧版本

## Capabilities

### New Capabilities
- `skill-edit-history`: 技能编辑版本历史的记录、存储、查看和恢复能力

### Modified Capabilities
<!-- No existing specs to modify -->

## Impact

- `shared/skill-registry.js` — `update()` 和 `resetSkill()` 方法改造，新增 `getHistory()` / `restoreVersion()` 方法
- `shared/skill-storage.js` — 新增 `ai_helper_skill_history` 存储键和管理函数
- `chrome-extension/src/panel/panel.js` — `resetSkillEdit()` 改为弹出历史版本悬浮框，新增历史版本 UI 交互逻辑
- `chrome-extension/src/panel/panel.html` — 新增历史版本悬浮框 HTML 模板
- `shared/css/panel.css` — 新增历史版本悬浮框样式
- `firefox-extension/` 对应文件 — 通过 `sync.sh` 同步
- `test-runner.js` / `shared/skill-registry.test.js` — 新增版本历史测试用例
