## Why

用户在 AI 聊天中经常需要让 AI 分析某个本地文本文件（如日志、配置文件、代码片段等）。目前用户只能手动复制粘贴文件内容到输入框，操作繁琐且容易出错。提供文件提交功能可以让用户快捷地将文本文件内容发送给 AI 分析。

## What Changes

- 在聊天输入区域新增文件选择按钮（📎 附件），点击后弹出文件选择器，仅允许选择文本类文件
- 用户选择文件后，在输入框上方显示已选文件的标签（文件名、大小），支持移除
- 发送消息时，将文件保存到独立的「用户提交」卡片（类似「工作产物」「记忆」），AI 通过 `get_user_file` 工具按需读取
- 限制：仅支持文本文件，最多 5 个文件

## Capabilities

### New Capabilities
- `chat-file-upload`: 聊天输入框支持提交文本文件，AI 可读取文件内容进行分析

### Modified Capabilities
<!-- 无现有 spec 需要修改 -->

## Impact

- `shared/user-files.js` — 新增「用户提交」卡片模块（参照 output-files.js 模式）
- `shared/chat.js` — 新增文件选择 UI 组件、文件读取逻辑、`search_user_files` / `get_user_file` 工具
- `shared/i18n.js` — 新增相关文案的翻译键
- `chrome-extension/src/panel/panel.css` / `shared/css/panel.css` — 新增文件标签和附件的样式
- `chrome-extension/src/panel/panel.html` — 聊天输入区域新增附件按钮，引入 user-files.js
- `firefox-extension/src/popup/popup.html` — 同步更新（通过 sync.sh）
