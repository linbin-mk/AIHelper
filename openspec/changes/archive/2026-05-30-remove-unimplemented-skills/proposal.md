## Why

"业务问题反馈" 和 "智能测试" 两个技能仅有占位文件（`> 待完善`），没有实际可用的提示词内容，却通过 `manifest.json` 注册并在技能面板中展示，给用户造成功能已就绪的误导。应及时清理未实现的占位技能，保持技能列表与实现一致。

## What Changes

- 删除 `chrome-extension/skills/business-issue-feedback/` 目录及其下的 `skill.cn.md`、`skill.en.md`
- 删除 `chrome-extension/skills/smart-testing/` 目录及其下的 `skill.cn.md`、`skill.en.md`
- 从 `chrome-extension/skills/manifest.json` 中移除 `"business-issue-feedback"` 和 `"smart-testing"` 条目
- 更新 `README.md` 中提及这两个技能的文字

## Capabilities

### New Capabilities

（无新能力）

### Modified Capabilities

（无现有规格需要修改，删除占位技能不改变技能分类系统或技能加载机制的行为）

## Impact

- `chrome-extension/skills/manifest.json` — 技能注册清单
- `chrome-extension/skills/business-issue-feedback/` — 待删除目录
- `chrome-extension/skills/smart-testing/` — 待删除目录
- `README.md` — 功能说明文字
