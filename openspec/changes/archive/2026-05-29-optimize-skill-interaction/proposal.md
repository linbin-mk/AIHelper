## Why

当前 AI 聊天页面中 skill 的激活/取消交互存在体验问题：用户通过 `/` 斜杠菜单激活 skill 后，skill 标签显示在 `#skillStatusBar` 上，点击 × 会取消激活而非清理输入框文本；发送消息后 skill 标签不会自动消失；且已激活的 skill 在消息列表中无视觉痕迹，导致会话恢复时用户无法感知之前使用了哪个 skill。

## What Changes

- 点击 `#skillStatusBar` 上 skill 标签的 × 按钮时，仅移除输入框中对应的 `/skillId ` 前缀文本（保留其余文字），不取消 skill 激活
- 发送消息后自动清空 `#skillStatusBar` 上的所有 skill 标签（skill 不再重新激活）
- 新增"skill 激活卡片"，与"工具调用"卡片、"AI 思考"同级别，在激活 skill 后于消息列表中展示，支持会话恢复时渲染

## Capabilities

### New Capabilities
- `skill-activation-card`: 在聊天消息列表中新增 skill 激活提示卡片，当用户激活某个 skill 时在消息区插入一张卡片展示当前激活的 skill 信息（名称、描述），该卡片随消息一同持久化存储，会话恢复时自动渲染
- `skill-status-bar-sync`: `#skillStatusBar` 上的 × 按钮改为仅清理输入框文本；发送消息后自动清空状态栏

### Modified Capabilities
<!-- 无现有 spec 文件需修改 -->

## Impact

- 受影响文件：`chrome-extension/src/panel/chat.js`（修改 `renderSkillStatusBar` × 回调、`doSendMessage` 发送逻辑、`buildActiveSkillPrompt` 快照传递、新增激活卡片渲染函数和持久化逻辑）
- 受影响文件：`chrome-extension/src/panel/panel.css`（新增 `.chat-message-skill-card` 样式）
- 无 API 变更，无破坏性变更
