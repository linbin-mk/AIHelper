## 1. Skill Registry 基础设施

- [x] 1.1 创建 `chrome-extension/src/panel/skill-registry.js`，实现 `SkillRegistry` 类：`register()`、`activate()`、`deactivate()`、`isActive()`、`getActive()`、`getAll()`、`onSkillEvent()` 事件回调
- [x] 1.2 在 `panel.html` 中通过 `<script>` 标签引入 `skill-registry.js`，放在 `chat.js` 之前
- [x] 1.3 在 `panel.js` 初始化时实例化 `skillRegistry` 并挂到 `window` 上（不注册任何 Skill——Skill 文件自行注册）

## 2. chat.js 重构 —— Prompt 与工具分发接入 Skill

- [x] 2.1 修改 `buildRequestContext()`：从基础系统 prompt 中移除 taskCard 格式定义、两步约束规则、执行流程指令，仅保留基础身份设定和请求列表注入
- [x] 2.2 新增 `buildSkillDirectory()` 函数：始终注入所有已注册 Skill 的 name + description 作为"## 已注册技能"目录
- [x] 2.3 新增 `buildActiveSkillPrompt()` 函数：从 `skillRegistry.getActive()` 收集各 Skill 的 `getPrompt()` 输出，拼接为 "## 已激活技能规则\n\n" 章节
- [x] 2.4 修改 `buildMessages()`：在系统消息中合并基础 prompt + 技能目录 + 已激活技能规则
- [x] 2.5 修改 `startAgentLoop()` 中的 TOOLS 发送逻辑：改为从 `skillRegistry.getActive()` 动态合并工具定义（仅提取 type/function 字段），去重同名工具
- [x] 2.6 重构 `executeToolCall()`：改为遍历激活 Skill 的工具列表精确匹配 name，匹配到则调用 `handler(args)`；未匹配则回退到内置处理
- [x] 2.7 修改 AI 返回消息处理逻辑：渲染前调用所有激活 Skill 的 `onMessageParsed(messageEl, parsedText)`；若返回 `true` 则跳过默认 Markdown 渲染

## 3. test-data-generation Skill

- [x] 3.1 创建 `chrome-extension/skills/test-data-generation/` 目录（扩展根目录下，与 `src/` 同级）
- [x] 3.2 创建 `skills/test-data-generation/index.js`：Skill 定义对象，顶层调用 `window.__registerSkill({...})` 自注册，注册即激活
- [x] 3.3 将 taskCard 渲染逻辑从 `chat.js` 移到 `getUIDelegate().onMessageParsed()` 中：解析 taskCard JSON、调用 `renderTaskCard()`、绑定执行/取消按钮
- [x] 3.4 将 taskCard 执行逻辑从 `chat.js` 移到 Skill 模块中：`handleTaskExecute()` 逻辑移至 Skill 内部，通过构造合成消息触发 Agent Loop
- [x] 3.5 将工具定义（`execute_request`、`get_captured_requests`、`get_captured_request_detail`、`get_page_context`、`extract_auth_token`）及其 handler 从 `chat.js` 的 `TOOLS` 数组和 `executeToolCall()` 移到 Skill 的 `getTools()` 中
- [x] 3.6 在 `panel.html` 中通过 `<script src=\"../../skills/test-data-generation/index.js\">` 引入 Skill 文件
- [x] 3.7 验证 Skill 自注册：加载 panel.html 后，`skillRegistry.getAll()` 应包含 `test-data-generation`，注册后不自动激活（无 Skill tag 显示）

## 4. 斜杠命令面板

- [x] 4.1 在 `chat.js` 中监听聊天输入框 `input` 事件：检测以 `/` 开头时弹出下拉面板
- [x] 4.2 实现下拉面板 DOM 结构：绝对定位浮层，位于输入框上方，每行 Skill 名称 + 描述
- [x] 4.3 实现前缀过滤：根据 `/` 后的输入文本过滤匹配 Skill（匹配 `id` 和 `name`）
- [x] 4.4 实现鼠标交互：悬停高亮、点击选择填入 Skill id + 空格
- [x] 4.5 实现键盘交互：↑↓ 移较高亮行、Enter 确认选择、Esc 关闭面板并恢复输入
- [x] 4.6 实现斜杠命令语义：选择后该 Skill 标记为临时激活，本轮 Agent Loop 结束自动清除
- [x] 4.7 面板样式：自包含内联样式（不依赖 panel.css），支持 dark/light 双主题

- [x] 5.1 在 `panel.html` 聊天 tab 中新增 `<div id=\"skillStatusBar\">`，位于消息区域下方、输入框上方
- [x] 5.2 在 `panel.css` 中添加指示器样式：tag 标签（统一样式）、× 按钮
- [x] 5.3 实现 `renderSkillStatusBar()`：读取 registry 的当前激活列表，渲染 tag
- [x] 5.4 实现 tag × 按钮交互：终止该 Skill 的本次使用（从 registry 移除激活状态）
- [x] 5.5 监听 `skillRegistry.onSkillEvent()`：状态变更时自动刷新指示器
- [x] 5.6 无激活 Skill 时隐藏 `#skillStatusBar`

## 6. Panel "技能" Tab UI

- [x] 6.1 在 `panel.html` 的 tab-bar 中新增 "技能" 按钮（`id="tabSkillsBtn"`），放在 "AI 聊天" 和 "请求监控" 之间
- [x] 6.2 在 `panel.html` 的 content 区域新增 `tab-skills` div，包含技能列表容器
- [x] 6.3 在 `panel.css` 中新增技能 Tab 样式：卡片布局、工具标签样式、使用提示样式、空状态提示样式
- [x] 6.4 在 `panel.js` 中添加技能 Tab 切换逻辑（`switchTab('skills')`）
- [x] 6.5 实现技能列表渲染函数（只读目录）：遍历 `skillRegistry.getAll()` 渲染卡片，每个卡片包含名称、描述、工具标签、使用提示文字
- [x] 6.6 监听 `skillRegistry.onSkillEvent()`：Skill 注册/注销时自动刷新技能列表 UI

## 7. 清理与回归修复

- [x] 7.1 删除 `chat.js` 中原有的 `renderTaskCard()`、`handleTaskExecute()` 等 taskCard 相关函数
- [x] 7.2 删除 `chat.js` 中 `TOOLS` 数组里已迁移到 Skill 的工具定义；保留 `search_project_code`、`get_project_file`、`list_project_files` 作为内置工具
- [x] 7.3 删除 `chat.js` 中 `executeToolCall()` 里已迁出工具的 if-else 分支
- [x] 7.4 回归测试：在聊天中输入"帮我创建5条测试数据"，验证 taskCard 正常生成、确认执行、结果展示全流程无异常

## 8. 验证与收尾

- [x] 8.1 验证"技能"Tab 正确展示 `test-data-generation`，卡片包含名称、描述、工具标签、使用提示（只读，无交互控件）
- [x] 8.2 验证斜杠命令面板：输入 `/` 弹出、鼠标/键盘选择、填入 Skill id
- [x] 8.3 验证状态指示器：激活后 tag 出现、点击 × 终止、对话结束后自动清除
- [x] 8.4 验证 AI 自主激活：无 Skill 激活时直接发送"帮我创建10条数据"，AI 应自主匹配 test-data-generation 并生成 taskCard
- [x] 8.5 验证自主激活不绕过安全确认：taskCard 仍需用户点击"允许执行"
- [x] 8.6 验证停用后 AI 行为：状态指示器 tag × 点击后，后续对话中 AI 不再使用该 Skill
- [x] 8.7 验证无 Skill 激活时，聊天基本功能正常（通用问答、代码搜索）

## 9. 回测修复

- [x] 9.1 修复 setSending(false) 过早停用 Skill 导致执行阶段无工具
- [x] 9.2 修复消息重复（Skill 和 chat.js 各保存一次）
- [x] 9.3 修复死循环：连续 5 次相同工具调用自动停止
- [x] 9.4 修复 buildMergedTools() 和 executeToolCall() 使用 getActive() 导致工具不可用 → 统一改用 getAll()
- [x] 9.5 修复基础 prompt 缺少 taskCard JSON schema → 补上格式模板
- [x] 9.6 修复 onMessageParsed 正则无法解析嵌套 JSON → 改用括号平衡遍历 + JSON.parse
- [x] 9.7 修复 onMessageParsed 调度只用 getActive() → 改用 getAll()
- [x] 9.8 修复 buildMessages() 中 tool 消息孤立导致 API 400 → 跳过无配对 assistant(tool_calls) 的 tool 消息
