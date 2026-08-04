## 1. 基础系统提示词 — 移除 taskCard JSON 指令

- [x] 1.1 修改 `i18n.js` 中文 rule4：将 "必须先输出 taskCard JSON" 改为 "必须先用 `request_auth` 工具请求用户授权"
- [x] 1.2 修改 `i18n.js` 英文 rule4：同步英文文案
- [x] 1.3 重新生成 AGENTS.md 缓存（`regenerateAgentsMd()`）或清空 IndexedDB 缓存让系统重建

## 2. chat.js — 移除 AI 响应中 taskCard JSON 的渲染分发

- [x] 2.1 移除 `chat.js` 中 `renderChatMessages`/消息解析处 `msg.taskCard` 的渲染钩子（line 541-542），确保 AI 响应的 taskCard JSON 不再被捕获为特殊消息。同时移除 `msg.combinedTaskCard` 钩子（两函数均未定义，死代码）
- [x] 2.2 验证 `renderTaskCard` / `handleTaskExecute` 函数体仍需保留（历史消息回显路径引用）→ 确认：两个函数在代码库中已不存在，是死代码

## 3. test-data-generation Skill — 确认步骤改用 request_auth

- [x] 3.1 修改 `skill.cn.md` 第 65 行：将第 6 步 "调用 `ask_user` 工具生成确认卡片" 改为 "调用 `request_auth` 工具生成授权确认卡片"
- [x] 3.2 修改 `skill.cn.md` "工具使用约束" 章节（第 198-203 行）：将 `ask_user` 确认改为 `request_auth`
- [x] 3.3 修改 `skill.en.md`：同步英文 Skill prompt 中的同样改动
- [x] 3.4 修改 `skill.cn.md` 工作流程描述：确认卡片参数从 `options: ["允许执行", "取消"]` 改为 `action` / `detail` / `riskLevel`
- [x] 3.5 修改 `skill.en.md`：同步英文工作流程描述
- [x] 3.6 优化工作流程第 5-6 步：强化先后顺序约束 — **必须先用 `display_table` 展示数据预览**，用户看过数据后才用 `request_auth` 请求授权，禁止同时调用两个工具
- [x] 3.7 新增第 3 步数量询问：用户未指定条数时用 `ask_user` 先询问数量
- [x] 3.8 新增第 4 步依赖关系智能感知：搜索记忆/知识中已知的实体依赖链路，用 `display_table` 展示并用 `ask_user` 询问是否一条龙创建
- [x] 3.9 业务前置条件错误交互升级：从纯文本输出改为 `ask_user` 工具结构化选项
- [x] 3.10 修改 `skill.en.md`：同步上述全部优化

## 4. OpenSpec 规格 — 更新 taskCard 相关规范

- [x] 4.1 更新 `openspec/specs/agent-request-execution/spec.md`：将 taskCard JSON 相关需求替换为 request_auth 工具流程，移除废弃需求
- [x] 4.2 更新 `openspec/specs/skill-test-data-generation/spec.md`：将 ask_user 确认改为 request_auth
- [x] 4.3 创建 `openspec/specs/request-auth-confirmation/spec.md`（如有新增能力）

## 5. 验证

- [ ] 5.1 手动测试：在未激活 Skill 的状态下发送 "帮我创建一条测试分类数据"，确认 AI 不再输出 raw JSON taskCard 文本，而是调用 `request_auth` 工具
- [ ] 5.2 手动测试：激活 `test-data-generation` Skill 后发送数据生成请求，确认流程为 `display_table` → `request_auth` → `execute_request`，无 taskCard JSON 文本输出
- [ ] 5.3 手动测试：打开有 taskCard 格式的历史会话，确认历史消息正常回显不报错
