## Context

AI 聊天页面（`chrome-extension/src/panel/chat.js`）当前 skill 交互流程：
- 用户通过斜杠菜单 `/` 选择 skill → `selectSlashSkill()` 填充输入框 `/<skillId> ` 并激活 skill
- `SkillRegistry` 管理激活状态，通过 `onSkillEvent` 通知 UI 刷新 `#skillStatusBar`
- `renderSkillStatusBar()` 渲染 skill 标签（含 × 关闭按钮），点击 × 调用 `registry.deactivate(skillId)` 并重新渲染状态栏（第 304-309 行）
- `doSendMessage()` 中先反激活所有 skill，再根据消息文本重新激活 `/skillId` 开头的 skill（导致发送后 skill 标签持续显示）
- 消息结构为 `{ role, content, reasoning_content, tool_calls, ... }`，存储在 `Session.messages[]` 中

现有问题：
1. 点击 `#skillStatusBar` 上 skill 标签的 × 按钮时，只取消激活但不清理输入框中的 `/skillId` 文本
2. 发送后 skill 被重新激活，导致 skill 标签持续显示，无法中途关闭
3. 无 skill 激活的视觉记录，会话恢复时用户不知道之前激活了哪个 skill

## Goals / Non-Goals

**Goals:**
- 点击 `#skillStatusBar` skill 标签的 × 时，仅移除输入框中对应的 `/skillId ` 前缀文本，不取消 skill 激活
- 发送消息后，`#skillStatusBar` 清空（不重新激活 skill）
- 发送消息时在消息列表插入 skill 激活卡片，展示激活的 skill 名称与描述，支持会话恢复渲染

**Non-Goals:**
- 不改变 skill 注册、加载、slash 面板选择流程
- 不改变 skill prompt 注入和 tool 合并逻辑（`buildMessages` 中的 `buildActiveSkillPrompt` 等）
- 不改变多 skill 并行激活的支持
- 不改变 `SkillRegistry` 的 API 接口

## Decisions

### 1. 点击 × 仅清理输入框文本（不取消激活）

在 `renderSkillStatusBar()` 第 304-309 行的 × 点击处理中，移除 `r.deactivate(skillId)` 和 `renderSkillStatusBar()` 调用，改为仅清理输入框中的 `/skillId ` 前缀。

**实现**：检查 `chatInputEl.value` 是否以 `/<skillId>` 开头，若是则移除该前缀及后续空白字符，保留其余文字。点击 × 不触发任何 skill 状态变更，状态栏保持不变。

**决策理由**：× 按钮应为便捷的输入框清理操作，与 skill 激活状态解耦。真正的 skill 取消激活由发送消息触发。

### 2. 发送后不重新激活 skill

在 `doSendMessage()` 中，移除第 1537-1543 行的"根据消息文本重新激活 skill"逻辑。发送后所有 skill 保持反激活状态，`#skillStatusBar` 自动隐藏。

**注意**：`buildMessages()` → `buildActiveSkillPrompt()` 依赖 `registry.getActive()` 来获取激活 skill 的 prompt。由于 skill 的反激活发生在消息构建之前，需要在 deactivate 之前保存激活 skill 信息（skillId 列表），供 `buildActiveSkillPrompt()` 使用。

**实现**：
- 在 `doSendMessage()` 开头调用 `registry.deactivate()` 前保存 `registry.getActive()` 快照到 `window.__lastActiveSkills`
- `buildActiveSkillPrompt()` 优先使用 `window.__lastActiveSkills`，若不存在则 fallback 到 `registry.getActive()`
- `buildMessages()` 完成后清除 `window.__lastActiveSkills`

### 3. Skill 激活卡片

新增消息类型 `{ role: 'skill_activation', skillId, skillName, skillDescription, timestamp }`。

**创建时机**：`doSendMessage()` 中，确认有激活 skill 后，在用户消息气泡之前插入 skill 激活卡片 DOM 元素，同时将 `{ role: 'skill_activation', ... }` 消息推入 `chatMessages` 数组持久化。

**渲染（实时）**：创建 `createSkillActivationCard(skill)` 函数，生成与"工具调用"卡片、"AI 思考"同级的 DOM 结构（`chat-message chat-message-skill-card`），展示 skill 名称和描述。

**渲染（会话恢复）**：`renderChatMessages()` 中增加对 `msg.role === 'skill_activation'` 的处理，调用 `createSkillActivationCard()` 从持久化数据重建卡片。

**消息结构验证**：现有 `renderChatMessages` 只处理 `role === 'tool'`（跳过），新增 `skill_activation` role 不会与现有逻辑冲突。`buildMessages()` 构建时也需跳过 `skill_activation` 类型的消息（非对话消息不应发送给 LLM）。

## Risks / Trade-offs

- **[风险] 发送后不再重新激活 skill 可能影响某些依赖 `registry.getActive()` 的下游逻辑** → 缓解：通过快照保存激活状态并在 `buildMessages` 中传递，确保 skill prompt 注入不受影响
- **[风险] 新增 `skill_activation` 消息类型可能与现有消息处理流程冲突** → 缓解：在 `renderChatMessages`、`buildMessages` 中显式处理该类型，确保不破坏现有循环逻辑
- **[风险] 用户可能期望点击 × 取消 skill 激活** → 缓解：× 按钮作为输入框清理而非取消激活的交互语义，通过提示文字或卡片设计让用户理解 skill 在发送时自动清除
