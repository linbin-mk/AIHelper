## MODIFIED Requirements

### Requirement: 目录与文件结构
`product-expert` 技能 SHALL 位于 `chrome-extension/skills/product-expert/`，包含 `skill.cn.md` 和 `skill.en.md` 两个文件。`skills.json` 中 SHALL 注册 `product-expert`。

#### Scenario: 目录结构正确
- **WHEN** 列出 `chrome-extension/skills/product-expert/` 目录
- **THEN** 仅存在 `skill.cn.md` 和 `skill.en.md` 两个文件

#### Scenario: skills 清单注册正确
- **WHEN** 读取 `chrome-extension/skills/skills.json`
- **THEN** 数组中包含 `"product-expert"`
