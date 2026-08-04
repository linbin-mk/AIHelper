## Context

当前技能分类体系包含 6 个类别：`通用`、`业务`、`产品`、`开发`、`测试`、`基础`。类别信息存储在技能文件的 YAML front matter `category` 字段中，并在以下位置校验和使用：

- `skill-registry.js` 的 `validCategories` 数组：`['通用', '业务', '产品', '开发', '测试', '基础']`
- `panel.js` 的 `CATEGORY_ORDER` 数组：`['通用', '业务', '产品', '开发', '测试', '基础']`
- `panel.js` 的调试模式逻辑：`基础` 分类仅在调试模式下可见

"通用"和"基础"两个分类语义重叠、界线模糊，导致技能分类不够清晰，需要精简。

此外，`browser-page-refresh` 技能仅为 `refresh_page` 工具（在 `chat.js` 中独立实现）的提示词包装，没有独立存在价值。

## Goals / Non-Goals

**Goals:**
- 移除"通用"和"基础"分类，保留有技能归属的 `业务`、`产品`、`开发`、`测试` 分类
- 将所有技能重新分配到合理的新分类中
- 删除冗余的 `browser-page-refresh` 技能
- 移除"基础"分类的调试模式可见性逻辑

**Non-Goals:**
- 不修改 `refresh_page` 工具的业务逻辑或功能
- 不修改 UI 样式或布局
- 不新增其他技能
- 不引入新的分类字段或元数据

## Decisions

### 分类缩减：移除"通用"和"基础"

移除"通用"和"基础"两个分类。理由：
- "通用"分类过于宽泛，无法传达技能的实际用途
- "基础"分类命名不直观，且需要通过调试模式才能看到，实用性低
- 这两个分类下已无技能归属，保留空分类没有意义

### 删除 browser-page-refresh 技能

`browser-page-refresh` 技能仅是一个提示词包装，引导 AI 调用 `refresh_page` 工具。`refresh_page` 工具在 `chat.js` 的 `TOOLS` 数组中独立注册和实现，不依赖任何技能。两者可以独立使用，技能层是多余的。删除该技能后：
- `refresh_page` 工具继续在 `chat.js` 中正常工作
- 其他技能（如 `test-data-generation`）已直接引用 `refresh_page` 工具，无需修改
- 从 `manifest.json` 中移除注册，删除技能目录

### 技能重新分配逻辑

| 技能 | 原分类 | 新分类 | 理由 |
|------|--------|--------|------|
| product-expert (产品专家) | 通用 | 产品 | 回答产品相关问题，属于产品领域 |
| aic-time-eye (AIC填时之眼) | 通用 | 业务 | AIC 填时是具体业务场景 |
| website-outline (网站地图) | 基础 | 产品 | 网站地图生成服务于产品分析 |
| openspec-explore | 基础 | 开发 | OpenSpec 是开发工作流工具 |
| openspec-propose | 基础 | 开发 | 同上 |
| openspec-apply | 基础 | 开发 | 同上 |
| openspec-archive | 基础 | 开发 | 同上 |

### 移除调试模式对"基础"的特殊处理

由于"基础"分类被移除，`panel.js` 中对 `基础` 分类的调试模式可见性判断逻辑可以一并清除。非调试模式下其他 4 个分类始终可见。

## Risks / Trade-offs

- [遗留分类] 已全局搜索确认，共 2 个源文件（panel.js、skill-registry.js）、6 个活跃 spec 文件含分类硬编码，全部纳入本次变更
- [工具可用性] 删除 `browser-page-refresh` 技能后 AI 仍可通过 `refresh_page` 工具刷新页面 → `refresh_page` 工具已独立于技能系统注册，无功能影响
