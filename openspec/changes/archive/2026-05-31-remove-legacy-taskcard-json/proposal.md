## Why

基础系统提示词（由 `i18n.js` rule4 生成）仍指示 AI "必须先输出 taskCard JSON 等待用户审查"，这与 Skill 系统中已采用的 `request_auth` / `ask_user` / `display_table` 基础卡片工具相冲突。导致 AI 输出原始 JSON 文本块（如"先输出操作卡片供你确认：```json { ... }```"）而非调用交互式卡片工具，用户体验降级。

## What Changes

- 将 `i18n.js` 中 rule4 从 "输出 taskCard JSON" 改为 "调用 `request_auth` 工具获取用户授权"，消除两套指令冲突
- 移除 `chat.js` 中残留的 `msg.taskCard` 渲染钩子（`__renderSkillTaskCard`），该逻辑已被基础卡片工具取代
- 将 `test-data-generation` Skill prompt 第6步从 `ask_user` 改为 `request_auth`（语义更准确：执行确认是授权而非提问）
- `agent-request-execution` 规格中 taskCard JSON 相关需求标记废弃，替换为 `request_auth` 工具流程
- `skill-test-data-generation` 规格中 "用户确认使用 ask_user" 改为 "用户确认使用 request_auth"

## Capabilities

### New Capabilities
- `request-auth-confirmation`: 所有数据写入操作（创建/修改/删除）统一通过 `request_auth` 工具确认，不再使用 taskCard JSON 文本格式

### Modified Capabilities
- `agent-request-execution`: 两步约束中 taskCard JSON 的概念替换为 `request_auth` 工具调用，移除 taskCard 格式定义和渲染需求
- `skill-test-data-generation`: 用户确认步骤从 `ask_user` 改为 `request_auth`，执行确认是授权场景而非提问场景

## Impact

- `chrome-extension/src/panel/i18n.js` — rule4 文案修改（中英文）
- `chrome-extension/src/panel/chat.js` — 移除 `msg.taskCard` 渲染分支（line 541-542）
- `chrome-extension/skills/test-data-generation/skill.cn.md` — 第6步工具引用和"工具使用约束"章节
- `chrome-extension/skills/test-data-generation/skill.en.md` — 同上
- `openspec/specs/agent-request-execution/spec.md` — taskCard 相关需求废弃/替换
- `openspec/specs/skill-test-data-generation/spec.md` — ask_user 确认改为 request_auth
