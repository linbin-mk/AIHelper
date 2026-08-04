## 1. Skill 状态栏 × 按钮仅清理输入框

- [x] 1.1 修改 `renderSkillStatusBar()` 第 304-309 行的 × 按钮点击回调：移除 `r.deactivate(skillId)` 和 `renderSkillStatusBar()` 调用，改为仅检查 `chatInputEl.value` 是否以 `/<skillId>` 开头，若是则移除该前缀及后续空白字符，保留其余文本
- [x] 1.2 测试：激活 skill 后输入 `/<skillId> 写代码`，点击 ×，验证输入框变为 `写代码`，skill 状态不变，状态栏标签仍在

## 2. 发送后清空 Skill 状态栏

- [x] 2.1 修改 `doSendMessage()`：在 deactivate 前保存 `registry.getActive()` 快照到 `window.__lastActiveSkills`，移除第 1537-1543 行的重新激活 skill 逻辑
- [x] 2.2 修改 `buildActiveSkillPrompt()`：优先使用 `window.__lastActiveSkills` 获取激活 skill 列表（若存在且非空），否则 fallback 到 `registry.getActive()`；`buildMessages()` 完成后清除 `window.__lastActiveSkills`
- [x] 2.3 测试：激活 skill 后发送消息，验证 `#skillStatusBar` 隐藏，skill prompt 仍正确注入 LLM 请求

## 3. Skill 激活卡片

- [x] 3.1 创建 `createSkillActivationCard(skill)` 函数：生成 `chat-message chat-message-skill-card` DOM 结构，包含 skill 图标、名称（加粗）和描述文本，追加到 `chatMessagesEl`
- [x] 3.2 在 `doSendMessage()` 中，确认有激活 skill（从 `window.__lastActiveSkills` 获取）后，在用户消息气泡之前对每个 skill 调用 `createSkillActivationCard()`，并将 `{ role: 'skill_activation', skillId, skillName, skillDescription, timestamp }` 推入 `chatMessages` 数组
- [x] 3.3 在 `renderChatMessages()` 的 for 循环开头增加 `msg.role === 'skill_activation'` 判断，从消息数据重建 skill 激活卡片 DOM
- [x] 3.4 在 `buildMessages()` 的历史消息遍历中增加对 `h.role === 'skill_activation'` 的跳过逻辑（`continue`）
- [x] 3.5 在 `panel.css` 中添加 `.chat-message-skill-card` 样式：与 tool-card、thinking bubble 同级视觉风格，包含左侧彩色指示条、skill 名称、描述文字
- [x] 3.6 测试：激活 skill 后发送消息，验证卡片出现在消息列表中；切换回该会话，验证卡片恢复渲染；验证卡片不发送给 LLM

## 4. LLM 自动命中 Skill 时显示激活卡片

- [x] 4.1 新增 `getSkillByToolName(toolName)` 映射函数，遍历所有已注册 skill 的工具列表，返回匹配的 skill 信息 `{ id, name, description }` 或 `null`
- [x] 4.2 在 `startAgentLoop()` 中，每次收到 LLM 工具调用时（`toolCalls.length > 0`），对每个工具名调用 `getSkillByToolName()` 检测是否属于某个 skill
- [x] 4.3 若检测到 skill（且未被用户显式激活 `__userActivatedSkillIds`、未在当前 loop 中已显示 `shownSkillCards`），创建激活卡片 DOM 并将 `{ role: 'skill_activation', ... }` 推入消息数组持久化
- [x] 4.4 在 `doSendMessage()` 中设置 `window.__userActivatedSkillIds` 标记用户显式激活的 skill，在所有 `startAgentLoop` 退出路径中清除该标记
