## Context

当前项目技能系统使用 MD 格式：每个技能目录下放置 `skill.cn.md` / `skill.en.md`。系统有 22 个公共工具可用。

`dev-system-qa` 分支的 `system-qa` 技能引用了一批不存在的工具和脚本。迁移时需：改名 `product-expert`「产品专家」、合并知识库内容到正文、删除不存在工具引用、精简瘦身。

## Goals / Non-Goals

**Goals:**
- 技能重命名：目录与 id 从 `system-qa` 改为 `product-expert`，中文名「产品专家」
- 技能身份升级：从"系统解答专家"→"产品专家"：深度掌握前后端代码及全部文档，面向使用者/实施人员/开发者
- 生成 2 个自包含的技能 MD 文件：正文 = 完整工作流 + 全部知识库内容
- 删除所有引用不存在工具的内容，只引用现行 22 个公共工具

**Non-Goals:**
- 不实现任何新公共方法
- 不保留独立 `references/` 目录
- 不迁移 `SKILL.md`、`evals/`、`scripts/`

## Decisions

### Decision 1: 技能重命名 — `product-expert`

**选择**: 技能目录、id 改为 `product-expert`，中文名「产品专家」，英文名「Product Expert」。

**理由**: 用户明确要求。原 `system-qa` 限定为"解答使用问题"，新定位升级为"产品专家"，覆盖使用者、实施人员、开发者三类受众。

**alias**: 需要更新 `manifest.json` 中注册项 `"system-qa"` → `"product-expert"`。

### Decision 2: 技能身份重新定义

新身份：
```
你是【产品专家】，一个深度掌握本产品前后端代码及全部文档的人工智能。
你可以用最直白的语言向小白解释操作步骤，也能和技术专家讨论实现细节与架构设计。
无论面对使用者、实施人员还是开发者，你都能给出准确、有据可依的回答。
```

这取代了原 `dev-system-qa` 分支中"你是 AI Helper 浏览器扩展的官方系统解答专家"的角色定义。新身份不限于解答扩展使用问题，而是面向产品全局。

### Decision 3: 工具引用替换策略 — 只用现行工具

技能正文只引用现行 22 个公共工具。不存在的工具（`get_extension_info`、`list_skills`、`get_config_summary`、`list_active_headers`）的工作流步骤改为"直接基于内置知识回答"。

| 原工具 | 不存在 | 替换方案 |
| --- | --- | --- |
| `get_extension_info` | ✗ | 直接引用正文中的模块说明 |
| `list_skills` | ✗ | 直接引用正文中的技能清单表格 |
| `get_config_summary` | ✗ | 直接引用正文中的 FAQ |
| `list_active_headers` | ✗ | 直接引用正文中的故障排查步骤 |
| `diagnose.js` | ✗ | 删除，无替代 |

### Decision 4: 知识库内容合并

4 份参考文档的有用内容合并进正文：`modules.md` → 9 大模块子章节、`skills.md` → 技能清单表格子章节、`troubleshooting.md` → 故障排查子章节、`faq.md` → 常见配置 Q&A 子章节。一个文件 = 全部上下文。

## Risks / Trade-offs

- **[Token 消耗]** 合并后 skill MD 正文较长，但"自包含"是主原则。已通过删除不存在工具的描述大幅缩减
- **[内容维护]** 模块/技能清单更新时需同步两份文件，但相比原 6 文件已降低

## Open Questions

无。所有关键决策（命名、身份、合并策略、工具替换）已确定。
