## 1. 提取共享 `activateSkill()` 函数

- [x] 1.1 在 `chat.js` 中新增 `activateSkill(skillId)` 函数：校验 skill 存在 → `registry.activate()` → 返回 `{activated, skillId, name, prompt}`

## 2. 手动激活改用共享函数

- [x] 2.1 `selectSlashSkill(skillId)` 内部改为调用 `activateSkill(skillId)`（`chat.js:1458-1464`）
- [x] 2.2 panel "使用"按钮回调改为调用 `activateSkill(skillId)`（`panel.js:1358-1372`）

## 3. 新增 `activate_skill` 工具

- [x] 3.1 在 `TOOLS` 数组中添加 `activate_skill` 工具定义（`chat.js:42-242`），参数 `skillId`（string, required）
- [x] 3.2 在 `executeToolCall` 中添加 `activate_skill` 处理分支：调 `activateSkill(skillId)` → `JSON.stringify(result)`（`chat.js:1944-2161`）

## 4. 更新提示文本

- [x] 4.1 更新 `i18n.js` 中 `chat.skillAutoUseHint`（中文 + 英文），改为强制性"必须"调用 + "不可跳过"
- [x] 4.2 更新 `activate_skill` 工具 description 为强制性措辞（"必须首先调用" + "不可跳过"）

## 5. 验证

- [x] 5.1 验证手动 `/skillId` 激活仍正常（状态栏 tag + `buildActiveSkillPrompt` 注入）
- [x] 5.2 验证 panel "使用"按钮激活仍正常
- [x] 5.3 验证 AI 调用 `activate_skill` 后收到完整 `getPrompt()` 正文
- [x] 5.4 验证状态栏自动渲染激活的 skill tag
- [ ] 5.5 验证调用不存在 skill ID 时返回错误
- [x] 5.6 运行 lint 检查（项目无 lint 工具，代码验证通过）
