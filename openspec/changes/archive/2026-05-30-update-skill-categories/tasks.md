## 1. 删除 browser-page-refresh 技能

- [x] 1.1 从 `chrome-extension/skills/manifest.json` 中移除 `"browser-page-refresh"` 注册项
- [x] 1.2 删除 `chrome-extension/skills/browser-page-refresh/` 目录及其所有文件

## 2. 更新技能 MD 文件 YAML Front Matter 分类

- [x] 2.1 将 `product-expert` 的 `skill.cn.md` 和 `skill.en.md` 中 `category` 从 `通用` 改为 `产品`
- [x] 2.2 将 `aic-time-eye` 的 `skill.cn.md` 和 `skill.en.md` 中 `category` 从 `通用` 改为 `业务`
- [x] 2.3 将 `website-outline` 的 `skill.cn.md` 和 `skill.en.md` 中 `category` 从 `基础` 改为 `产品`
- [x] 2.4 将 `openspec-explore` 的 `skill.cn.md` 和 `skill.en.md` 中 `category` 从 `基础` 改为 `开发`
- [x] 2.5 将 `openspec-propose` 的 `skill.cn.md` 和 `skill.en.md` 中 `category` 从 `基础` 改为 `开发`
- [x] 2.6 将 `openspec-apply` 的 `skill.cn.md` 和 `skill.en.md` 中 `category` 从 `基础` 改为 `开发`
- [x] 2.7 将 `openspec-archive` 的 `skill.cn.md` 和 `skill.en.md` 中 `category` 从 `基础` 改为 `开发`

## 3. 更新分类系统代码逻辑

- [x] 3.1 更新 `skill-registry.js` 中 `validCategories` 数组：`['通用', '业务', '产品', '开发', '测试', '基础']` → `['业务', '产品', '开发', '测试']`
- [x] 3.2 更新 `panel.js` 中 `CATEGORY_ORDER` 数组：移除 `通用` 和 `基础`，更新为 `['业务', '产品', '开发', '测试']`
- [x] 3.3 移除 `panel.js` 中 `renderSkillsList()` 对 `基础` 分类的调试模式可见性判断逻辑
- [x] 3.4 验证无其他代码硬编码引用 `通用` 或 `基础` 分类（已全局搜索确认，范围：2 源文件 + 6 spec 文件）

## 4. 更新规格文件

- [x] 4.1 更新 `openspec/specs/browser-page-refresh/spec.md`：移除技能相关需求，保留 `refresh_page` 工具独立实现规范
- [x] 4.2 更新 `openspec/specs/skill-category-system/spec.md`：更新有效分类列表、分类顺序，移除"基础"调试模式规则
- [x] 4.3 更新 `openspec/specs/product-expert-skill-content/spec.md`：`category` 从 `通用` 改为 `产品`
- [x] 4.4 更新 `openspec/specs/openspec-apply-skill/spec.md`：`category` 从 `基础` 改为 `开发`
- [x] 4.5 更新 `openspec/specs/openspec-explore-skill/spec.md`：`category` 从 `基础` 改为 `开发`
- [x] 4.6 更新 `openspec/specs/openspec-propose-skill/spec.md`：`category` 从 `基础` 改为 `开发`
- [x] 4.7 更新 `openspec/specs/openspec-archive-skill/spec.md`：`category` 从 `基础` 改为 `开发`
- [x] 4.8 更新 `openspec/specs/skill-system/spec.md`：分类顺序移除"通用"和"基础"，OpenSpec 技能分类从"基础"改为"开发"
- [x] 4.9 更新 `openspec/specs/skill-md-format/spec.md`：`category` 有效值移除"通用"和"基础"

## 5. 验证

- [x] 5.1 运行 lint 检查确保代码无错误（无 package.json，无可运行 lint 命令）
- [x] 5.2 确认所有技能 MD 文件的 `category` 值均在新 `validCategories` 范围内（26 个文件全部通过：业务×4, 产品×6, 开发×12, 测试×4）
- [x] 5.3 确认 `refresh_page` 工具在删除技能后仍正常工作（chat.js TOOLS 注册 + executeToolCall + background.js REFRESH_PAGE 均未变更）
