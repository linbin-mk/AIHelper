## Why

当前技能分类包含 6 个类别（通用、业务、产品、开发、测试、基础），其中"通用"和"基础"分类语义模糊、界线不清，且"基础"分类仅在调试模式下可见，实用性差。需要将技能重新分配到现有类别中，移除不再有技能归属的"通用"和"基础"分类。同时，`browser-page-refresh` 技能仅为 `refresh_page` 工具（已在 `chat.js` 中独立实现）的提示词包装，无独立存在价值，应直接删除。

## What Changes

- 将 `product-expert`（产品专家）从"通用"移至"产品"
- 将 `aic-time-eye`（AIC填时之眼）从"通用"移至"业务"
- 将 `website-outline`（网站地图）从"基础"移至"产品"
- 删除 `browser-page-refresh`（页面刷新）技能（其功能由独立的 `refresh_page` 工具提供）
- 将 4 个 OpenSpec 技能从"基础"移至"开发"
- 移除"通用"和"基础"分类（这两个分类下已无技能归属）
- **BREAKING**: 移除"基础"分类及其调试模式可见性规则

## Capabilities

### New Capabilities

_无新增能力_

### Modified Capabilities

- `skill-category-system`: 更新有效分类列表（移除"通用"和"基础"），调整分类展示顺序，移除"基础"分类调试模式可见性规则
- `skill-system`: 更新技能 Tab 分类顺序（移除"通用"和"基础"），更新 OpenSpec 技能分类从"基础"改为"开发"
- `skill-md-format`: 更新 `category` 字段有效值列表（移除"通用"和"基础"）
- `product-expert-skill-content`: 更新 category 字段从 `通用` 改为 `产品`
- `browser-page-refresh`: 删除技能相关需求，仅保留 `refresh_page` 工具在 `chat.js` 中的实现规范
- `openspec-apply-skill`: 更新 category 字段从 `基础` 改为 `开发`
- `openspec-explore-skill`: 更新 category 字段从 `基础` 改为 `开发`
- `openspec-propose-skill`: 更新 category 字段从 `基础` 改为 `开发`
- `openspec-archive-skill`: 更新 category 字段从 `基础` 改为 `开发`

## Impact

- 受影响文件：
  - 技能定义文件（`skill.cn.md` / `skill.en.md`）— 6 个技能更新 category，1 个技能删除
  - `chrome-extension/skills/manifest.json` — 移除 `browser-page-refresh` 注册
  - `chrome-extension/skills/browser-page-refresh/` — 整个目录删除
  - `chrome-extension/src/panel/skill-registry.js` — 更新 `validCategories` 数组
  - `chrome-extension/src/panel/panel.js` — 更新 `CATEGORY_ORDER` 数组，移除调试模式对"基础"分类的可见性控制
- 受影响规格：9 个现有 spec 文件需更新
- `refresh_page` 工具功能不变，其他技能无需修改
