## Why

`aic-time-eye`（AIC 填时之眼）技能自创建以来一直处于"待完善"占位状态，从未实现实际功能。作为 Chrome 扩展内置技能，它在面板中显示但无任何可用内容，反而增加用户困惑和维护负担。删除该技能以保持技能列表的整洁和可用性。

## What Changes

- 删除 `chrome-extension/skills/aic-time-eye/` 目录及其全部文件（`skill.cn.md`、`skill.en.md`）
- 从 `chrome-extension/skills/manifest.json` 中移除 `aic-time-eye` 注册项
- 更新 `README.md` 中对该技能的引用（内置技能描述和目录结构）

## Capabilities

### New Capabilities

<!-- 本次为纯删除操作，不引入新能力 -->

### Modified Capabilities

- `skill-system`: 移除 `aic-time-eye` 内置技能，内置技能数量从 8 个减少为 7 个

## Impact

- `chrome-extension/skills/aic-time-eye/skill.cn.md` — 删除
- `chrome-extension/skills/aic-time-eye/skill.en.md` — 删除
- `chrome-extension/skills/manifest.json` — 移除注册项
- `README.md` — 移除技能引用
