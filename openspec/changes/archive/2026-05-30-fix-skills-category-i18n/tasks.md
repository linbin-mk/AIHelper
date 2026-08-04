## 1. 更新技能英文文件 category 字段

- [x] 1.1 将所有 `skills/*/skill.en.md` 和 `.cn.md` 中的 `category` 改为英文值（业务→Business, 产品→Product, 开发→Development, 测试→Testing）

## 2. 添加分类 i18n 翻译映射

- [x] 2.1 在 `i18n.js` 的 `zh-CN` 消息 `skills` 下添加 `categories: { Business: '业务', Product: '产品', Development: '开发', Testing: '测试', Other: '其他' }`
- [x] 2.2 在 `i18n.js` 的 `en` 消息 `skills` 下添加 `categories: { Business: 'Business', Product: 'Product', Development: 'Development', Testing: 'Testing', Other: 'Other' }`

## 3. 更新分类验证逻辑

- [x] 3.1 修改 `skill-registry.js` 中 `validCategories` 数组为 `['Business', 'Product', 'Development', 'Testing']`
- [x] 3.2 修改默认分类为 `'Other'`（字符串"其他"改为 `'Other'`）

## 4. 更新分类排序和渲染

- [x] 4.1 修改 `panel.js` 中 `CATEGORY_ORDER` 为 `['Business', 'Product', 'Development', 'Testing']`
- [x] 4.2 修改 `renderSkillsList()` 中分类标题渲染，使用 `t('skills.categories.' + cat)` 替代直接输出 `cat`
- [x] 4.3 同上处理 remaining 分类（"其他"/Other 部分）的标题渲染

## 5. 验证

- [x] 5.1 切换中文验证技能页分类显示为中文（业务、产品、开发、测试）
- [x] 5.2 切换英文验证技能页分类显示为英文（Business、Product、Development、Testing）
