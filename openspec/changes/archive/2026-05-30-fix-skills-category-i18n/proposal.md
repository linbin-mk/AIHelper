## Why

切换语言到英文时，技能（Skills）页面的分类标题（业务、产品、开发、测试）仍显示中文，原因是分类名称硬编码为中文、技能英文文件中 category 字段为中文、渲染时未使用 i18n 翻译层。这破坏了英文用户的体验一致性。

## What Changes

- 在 `i18n.js` 中添加技能分类的中英翻译映射
- 修改 `renderSkillsList()` 使用 `t()` 函数渲染分类标题
- 将技能 `.en.md` 文件中的 `category` 字段改为英文值
- 修改 `CATEGORY_ORDER` 和 `validCategories` 支持中英文分类
- 语言切换时正确重新渲染技能列表

## Capabilities

### New Capabilities
<!-- None - all changes modify existing capabilities -->

### Modified Capabilities
- `skill-category-system`: 分类值从仅中文扩展为支持中英双值，分类标题渲染改为使用 `t()` 进行 i18n 翻译
- `i18n-system`: 新增技能分类翻译 key，要求分类标题支持动态语言切换

## Impact

- `chrome-extension/src/panel/i18n.js` — 添加分类翻译映射
- `chrome-extension/src/panel/panel.js` — `renderSkillsList()` 分类渲染改用 `t()`
- `chrome-extension/src/panel/skill-registry.js` — `validCategories` 支持中英双值
- `chrome-extension/skills/*/skill.en.md` — 所有英文技能文件的 `category` 字段改为英文
