## 1. 数据层 — 新增历史记录存储模块

- [x] 1.1 创建 `shared/skill-history.js`，实现 `saveHistory()` / `loadHistory()` / `clearHistory()` 函数，数据键名为 `ai_helper_skill_history`，结构为 `{ "skillId:lang": [ { ts, name, description, _prompt, category }, ... ] }`
- [x] 1.2 实现 `addHistoryEntry(skillId, langSuffix, entry)` 函数：追加版本到数组末尾，若超过 20 条则 shift 头部。同时实现 `getHistory(skillId, langSuffix)` 读取函数
- [x] 1.3 在 `test-runner.js` 中 mock `chrome.storage.local`，编写 Node.js 测试验证历史记录的保存、加载、上限清理逻辑

## 2. 核心逻辑 — SkillRegistry 改造

- [x] 2.1 修改 `SkillRegistry.update()` 方法：在应用新编辑前，将当前 skill 的 name/description/_prompt/category 捕获为历史快照，调用 `addHistoryEntry()` 保存
- [x] 2.2 新增 `SkillRegistry.getHistory(skillId, langSuffix)` 方法，委托给 `skill-history.js` 中的 `getHistory()`
- [x] 2.3 更新 `shared/skill-registry.test.js`：新增 getHistory 的浏览器自测用例

## 3. UI — panel.html 悬浮框模板

- [x] 3.1 在 `chrome-extension/src/panel/panel.html` 的 `#skillDetailOverlay` 之后，新增历史版本悬浮框 HTML：包含遮罩层、标题行（"版本历史"）、可滚动版本列表容器、关闭按钮
- [x] 3.2 版本列表每个条目包含：版本序号（#N）、格式化时间、名称预览，使用 `data-version-index` 属性标记

## 4. UI — panel.js 交互逻辑

- [x] 4.1 修改 `resetSkillEdit(skillId)` 函数：改为调用 `showSkillHistoryOverlay(skillId)` 打开历史悬浮框，而非直接 reset
- [x] 4.2 新增 `showSkillHistoryOverlay(skillId)` 函数：读取该技能+语言的历史版本，渲染版本列表 HTML，打开悬浮框
- [x] 4.3 新增 `hideSkillHistoryOverlay()` 函数：关闭悬浮框
- [x] 4.4 新增 `loadHistoryVersionToForm(skillId, versionIndex)` 函数：从历史中取出指定版本，将内容填入编辑表单（name/description/prompt），关闭悬浮框，进入编辑模式
- [x] 4.5 保持 `showSkillDetail(skill)` 和 `exitSkillEditMode()` 中重置按钮显示逻辑不变（仅当 `skill._edits[currentLang]` 存在时显示）
- [x] 4.6 绑定历史悬浮框事件：版本条目 click → `loadHistoryVersionToForm()`，遮罩层 click / 关闭按钮 click → `hideSkillHistoryOverlay()`

## 5. UI — CSS 样式

- [x] 5.1 在 `shared/css/panel.css` 中新增 `.skill-history-overlay` 和 `.skill-history-popup` 样式（参考现有 `.skill-detail-overlay` 的居中弹出模式）
- [x] 5.2 新增 `.skill-history-item` 样式：每行展示序号、时间、名称，hover 高亮，选中态（可点击）
- [x] 5.3 新增 `.skill-history-title` 和 `.skill-history-close-btn` 样式
- [x] 5.4 新增 `.skill-history-list` 可滚动容器样式

## 6. 同步与测试

- [x] 6.1 运行 `bash sync.sh`，确认 `shared/skill-history.js`、panel.html/js、CSS 同步到 Firefox 目录
- [x] 6.2 更新 `test-runner.js`：新增 `loadHistory` / `saveHistory` / `addHistoryEntry` 的 Node.js 单元测试，覆盖上限清理、跨语言隔离
- [x] 6.3 更新 `shared/skill-registry.test.js`：新增 `getHistory` 的浏览器自测用例（含 mock chrome.storage）
- [x] 6.4 执行 `node test-runner.js`，确认所有测试通过

## 7. 验证

- [x] 7.1 手动验证 Chrome 扩展：编辑技能→保存→点击重置→查看历史→选择版本恢复→验证内容正确
- [x] 7.2 手动验证 Firefox 扩展：同上
- [x] 7.3 验证版本上限：连续编辑保存 21 次，确认历史列表只显示 20 条
- [x] 7.4 验证跨会话持久化：保存后关闭再重新加载扩展，历史仍可查看
