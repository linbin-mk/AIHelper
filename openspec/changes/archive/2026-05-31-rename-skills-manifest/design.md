## Context

Chrome 扩展打包上传时，Chrome Web Store 会将所有名为 `manifest.json` 的文件识别为扩展清单，导致根目录 `manifest.json`（扩展配置）与 `skills/manifest.json`（技能注册清单）冲突。实际上 `skills/manifest.json` 是技能 ID 列表的 JSON 数组，与扩展清单无关。

当前 `skill-registry.js` 的 `loadAllSkills()` 通过 `chrome.runtime.getURL('skills/manifest.json')` 加载该文件来获取已注册的技能 ID 列表。

## Goals / Non-Goals

**Goals:**
- 消除 Chrome 扩展上传时的多清单冲突错误
- 保持技能注册加载机制不变
- 仅做最小化重命名，不改变文件内容格式

**Non-Goals:**
- 不改变技能注册流程或技能加载逻辑
- 不修改 SkillRegistry 类接口
- 不改变 JSON 文件的数据结构

## Decisions

**决策：重命名为 `skills.json`（而非其他名称）**

- **选择**：`skills/skills.json`
- **备选**：`skills/registry.json`、`skills/index.json`
- **理由**：`skills.json` 与目录名 `skills/` 一致，语义清晰（"技能列表文件"），且不与任何 Chrome 保留文件名冲突

**决策：仅重命名文件，不改变文件内容**

- 文件内容仍是技能 ID 的 JSON 数组，格式不变
- 无迁移成本，仅需一处代码路径更新

## Risks / Trade-offs

- [风险] 如果其他脚本或文档引用旧路径 → 仅 `skill-registry.js:55` 一处代码引用，已确认无其他运行时引用
- [风险] 旧版 openspec specs 中引用旧路径 → 本次变更包含 delta spec 更新，archive 时统一处理
