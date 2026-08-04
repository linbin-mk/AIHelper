## 1. 创建 Skill 目录结构

- [x] 1.1 创建 `chrome-extension/skills/code-master/` 目录

## 2. 编写 Skill 定义文件

- [x] 2.1 创建 `chrome-extension/skills/code-master/index.js`，包含 `window.__registerSkill({id: 'code-master', name: '代码大师', description: '...', category: '开发'})`
- [x] 2.2 编写 Skill prompt 的"概述"部分，说明代码大师的定位：统一入口、五阶段向导、适合非技术用户
- [x] 2.3 编写"阶段1 — 需求描述"的 prompt 指令：要求 AI 先调用 askUser（allowFreeInput: true）收集用户需求
- [x] 2.4 编写"阶段2 — 方案确认"的 prompt 指令：AI 执行 openspec new change + 生成 artifacts，再调用 askUser（options）确认方案
- [x] 2.5 编写"阶段3 — 代码实现"的 prompt 指令：AI 按 tasks.md 逐项实现，完成后调用 askUser 确认
- [x] 2.6 编写"阶段4 — 测试验证"的 prompt 指令：AI 运行测试并汇总结果，调用 askUser 确认
- [x] 2.7 编写"阶段5 — 归档完成"的 prompt 指令：AI 调用 askUser 确认后执行 openspec archive，输出完成总结
- [x] 2.8 编写"中途取消与恢复"的 prompt 指令：处理用户说"取消"/"退出"，以及重新激活时的进度检测与恢复

## 3. 定义 Skill prompt 的输出规范

- [x] 3.1 编写输出模板（每阶段开始和结束的标准输出格式）
- [x] 3.2 编写 Guardrails（必须遵守的约束：不可跳过阶段、必须等待用户确认、检查 openspec CLI 可用性、错误处理等）

## 4. 注册与集成

- [x] 4.1 在 `chrome-extension/src/panel/panel.html` 添加 `<script src="../../skills/code-master/index.js"></script>` 加载 Skill
- [x] 4.2 确保 Skill 在 "开发" 分类下展示（`category: '开发'`），分类顺序由 `panel.js` 的 `CATEGORY_ORDER` 控制，"开发"位于"业务"之后

## 5. 验证

- [ ] 5.1 验证 Skill 在 "技能" Tab 中正确展示（名称、分类、描述）—— 需加载扩展后验证
- [ ] 5.2 验证斜杠命令 `/代码大师` 可被发现和触发 —— 需加载扩展后验证
- [ ] 5.3 端到端测试：发送 "帮我开发一个小功能" → 验证五阶段流程完整走通
- [ ] 5.4 验证取消流程：在任意阶段说 "取消" → 验证流程终止
- [ ] 5.5 验证恢复流程：退出后重新激活 → 验证检测到未完成任务并提供恢复选项
