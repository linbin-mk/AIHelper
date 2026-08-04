## Why

用户每天需要在小鹏工单管理系统(xpd.x-peng.com)中手动填报工时，过程繁琐且重复——选择日期、搜索需求、逐条创建任务。当前 AIHelper 缺少工时填报相关技能，无法协助用户自动化这一高频日常操作。新增此技能可显著提升效率，将多条工时填报从手动逐条操作变为对话式一键完成。

## What Changes

- 新增 `fill-work-hours` 技能（中文名"智能填工时"），提供 AI 向导式工时填报流程
- 创建技能文件 `skills/fill-work-hours/skill.cn.md` 和 `skill.en.md`
- 在 `skills/skills.json` 中注册新技能
- 技能流程包含：登录检测 → 工时配置 → 日期多选 → 需求搜索 → 任务预览授权 → 批量创建 → 结果汇总，并支持可选的工作内容总结

## Capabilities

### New Capabilities
- `fill-work-hours-skill`: 新增"智能填工时"技能，通过对话式引导帮助用户批量填报工时任务到小鹏工单管理系统，支持工时配置、日期多选、需求搜索、批量创建和结果汇总

### Modified Capabilities
<!-- No existing capabilities are modified -->

## Impact

- `skills/fill-work-hours/` — 新增技能目录（含 skill.cn.md、skill.en.md）
- `skills/skills.json` — 注册新技能 ID
- `chrome-extension/skills/` 和 `firefox-extension/skills/` — 通过 sync.sh 自动同步
