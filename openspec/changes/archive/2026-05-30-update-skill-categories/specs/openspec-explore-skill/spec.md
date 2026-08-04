## MODIFIED Requirements

### Requirement: 技能注册
系统 SHALL 在 `chrome-extension/skills/openspec-explore/` 目录下实现探索模式技能，通过 `window.__registerSkill()` 注册。技能的 `id` 为 `openspec-explore`，`name` 为 "OpenSpec 探索"，`category` 为 "开发"。

#### Scenario: 技能文件自注册
- **WHEN** `skills/openspec-explore/index.js` 在页面加载时调用 `window.__registerSkill({id: "openspec-explore", name: "OpenSpec 探索", category: "开发", ...})`
- **THEN** 该技能被添加到注册表，且立即进入激活状态
