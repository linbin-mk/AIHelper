## MODIFIED Requirements

### Requirement: 技能注册
系统 SHALL 在 `chrome-extension/skills/openspec-archive/` 目录下实现归档技能，通过 `window.__registerSkill()` 注册。技能的 `id` 为 `openspec-archive`，`name` 为 "OpenSpec 归档"，`category` 为 "开发"。

#### Scenario: 技能文件自注册
- **WHEN** `skills/openspec-archive/index.js` 在页面加载时调用 `window.__registerSkill({id: "openspec-archive", name: "OpenSpec 归档", category: "开发", ...})`
- **THEN** 该技能被添加到注册表，且立即进入激活状态
