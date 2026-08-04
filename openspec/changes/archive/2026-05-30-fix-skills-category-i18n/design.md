## Context

技能页面的分类系统目前使用硬编码中文值（业务、产品、开发、测试）作为内部标识符。`i18n.js` 翻译系统中技能部分只有 `emptyHint`、`usageHint`、`useBtn` 三个 key，缺少分类翻译。渲染时 `renderSkillsList()` 直接将分类值作为显示文本输出，未经过 `t()` 翻译。

当前语言切换流程已正确触发 `renderSkillsList()` 重新渲染，但渲染结果仍显示中文分类标题。

## Goals / Non-Goals

**Goals:**
- 切换英文时技能分类标题显示英文（Business、Product、Development、Testing）
- 切换中文时技能分类标题显示中文（业务、产品、开发、测试）
- `.en.md` 技能文件的 `category` 值改为英文，作为内部标识符语言无关

**Non-Goals:**
- 不改变分类的显示顺序
- 不改变分类分组逻辑
- 不新增分类
- 不改变技能加载和解析的核心流程

## Decisions

### 决策 1：category 字段作为语言无关的内部 key，使用英文值

**选择**：将 `.en.md` 和 `.cn.md` 文件的 `category` 统一改为英文（`Business`、`Product`、`Development`、`Testing`），在 `i18n.js` 中添加分类翻译映射。

**理由**：
- 英文 key 在代码中更具可读性
- 与 `name`、`description` 等字段的模式一致（这些字段各语言文件已有不同值）
- 避免在代码中硬编码中文字符串作为比较逻辑

**替代方案**：保持 `category` 为中文，仅翻译展示层。但这意味着 `.en.md` 文件中 category 仍为中文，语义不一致，且需要在多处做中英转换。

### 决策 2：分类翻译通过 `t()` 函数在渲染层完成

**选择**：在 `renderSkillsList()` 中使用 `t('skills.categories.' + cat)` 翻译分类标题，添加翻译映射到 `i18n.js`。

**理由**：
- 与项目现有 i18n 模式一致（所有用户可见文本通过 `t()` 翻译）
- 语言切换时自动生效，无需额外处理
- 分类可以以 `skills.categories.Development` 等键值存在于翻译映射中

### 决策 3：`validCategories` 和 `CATEGORY_ORDER` 统一使用英文

**选择**：将硬编码数组改为英文值，移除中文白名单。

**理由**：
- `category` 已成为语言无关的内部 key（英文），验证逻辑应使用相同值
- 排序使用英文 key，展示时通过 `t()` 翻译

## Risks / Trade-offs

- **[风险]** 更新现有 `.en.md` 文件的 `category` 会改变其内容结构 → **缓解**：category 字段不直接展示给用户，展示通过 i18n 完成，风险低
- **[风险]** 如果用户已自定义技能且 category 仍为中文 → **缓解**：`validCategories` 验证失败会被归入 `其他` 分类，不会崩溃；且当前为非白名单分类的兼容逻辑已存在（归入"其他"）
- **[权衡]** 英文 key 在中文语境下不如中文 key 直观 → **缓解**：分类数量少（4个），维护成本低
