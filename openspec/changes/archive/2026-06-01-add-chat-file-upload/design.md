## Context

当前聊天系统在 `shared/chat.js` 中实现，消息通过 `sendChatMessage()` → `doSendMessage()` → `buildMessages()` → `streamLLM()` 流程发送。用户输入是纯文本 `{ role: 'user', content: text }`。

聊天输入区域在 `panel.html` 中定义为：
```html
<div class="chat-input-area">
  <textarea id="chatInput" ...></textarea>
  <button id="sendBtn" ...>发送</button>
  <button id="stopBtn" ...>停止</button>
</div>
```

需要在现有布局中嵌入附件功能，UI 改动最小化。项目无构建工具，使用原生 JS + CSS。

## Goals / Non-Goals

**Goals:**
- 用户可点击附件按钮选择本地文本文件
- 支持一次选择多个文件
- 选择后在输入框上方显示文件标签（文件名 + 大小），可单独移除
- 发送时自动将文件内容附加到用户消息中
- 仅限文本文件，前端校验扩展名和 MIME 类型
- 仅限制文件类型为文本，不限制大小

**Non-Goals:**
- 不支持二进制文件（图片、PDF 等）
- 不传文件到服务器，纯客户端 FileReader 读取
- 不支持拖拽上传
- 不在「工作产物」或「记忆」卡片中混存用户文件

## Decisions

### 1. 文件存储：独立「用户提交」卡片

**选择**：新建 `shared/user-files.js` 模块，管理一张独立的「用户提交」卡片（与「工作产物」「记忆」同级，有且仅有一张），文件通过 `saveUserFile()` 保存。

发送时的流程：
1. 遍历 `window.pendingFiles`，对每个文件调用 `saveUserFile(sessionId + '/' + fileName, content)` 保存到「用户提交」卡片
2. 构建用户消息 content，包含文件路径提示，指引 AI 使用 `get_user_file` 工具自行读取

发送时的消息格式：
```
用户提交了以下文件到「用户提交」卡片中，请使用 get_user_file 工具读取文件内容：

- <sessionId>/error.log
- <sessionId>/config.json

用户原始输入文本
```

**理由**：
- 「工作产物」用于 OpenSpec / 开发产出，语义不同，混存会污染卡片
- 「用户提交」语义清晰，后续可独立扩展（如清理策略、UI 展示）
- 复用项目中卡片模块（output-files.js）的成熟模式：storage key → init → save → search → get

### 1b. 新增 AI 工具

**选择**：在 `chat.js` TOOLS 数组中新增两个工具，让 AI 可以读取「用户提交」卡片中的文件。

新增工具：
- `search_user_files` — 查询「用户提交」卡片中的文件列表，支持按路径前缀过滤，返回文件路径和内容预览
- `get_user_file` — 读取「用户提交」卡片中指定文件的完整内容

实现方式：新增工具 handler，调用 `user-files.js` 中的 `searchUserFiles()` 和 `getUserFile()` 函数。

### 2. 文件读取时机

**选择**：用户选择文件后立即通过 `FileReader.readAsText()` 读取内容，缓存到内存中。

**理由**：
- 避免发送时异步读取导致延迟
- 如果文件读取失败可立即提示用户
- 文件标签可显示文件大小确认

### 3. UI 布局

**选择**：在输入框上方增加附件标签行（`.chat-file-tags`），在输入框左侧添加附件按钮。

```
┌──────────────────────────────────────┐
│ [📄 log.txt ×] [📄 config.json ×]   │ ← .chat-file-tags
├──────────────────────────────────────┤
│ [📎] [_____________________] [发送]  │ ← 附件按钮 + 输入框
└──────────────────────────────────────┘
```

**理由**：标签在上方符合常见聊天应用（如 Slack、钉钉）的习惯，附件按钮在输入框左侧不占用发送按钮位置。

### 4. 文件类型校验

**选择**：白名单扩展名 + MIME 类型双重校验。

白名单扩展名：`.txt`, `.log`, `.json`, `.xml`, `.csv`, `.md`, `.yml`, `.yaml`, `.js`, `.ts`, `.jsx`, `.tsx`, `.py`, `.java`, `.html`, `.css`, `.sql`, `.sh`, `.bash`, `.env`, `.cfg`, `.ini`, `.conf`, `.toml`, `.properties`, `.gradle`, `.kt`, `.swift`, `.rs`, `.go`, `.c`, `.h`, `.cpp`, `.hpp`

MIME 类型白名单：`text/*`, `application/json`, `application/javascript`, `application/xml`

通过扩展名或 MIME 任一项匹配即放行。

**理由**：双重校验覆盖更多场景。某些系统可能将 `.sh` 文件识别为 `application/x-sh`，仅靠 MIME 可能误拒。

### 5. 多文件支持

**选择**：允许一次选择多个文件（`<input type="file" multiple>`），每个文件独立标签可单独移除。

**理由**：常见使用场景如同时提交代码文件和对应的日志文件，一次选择更方便。

## Risks / Trade-offs

- **[风险] 大文件可能超出 AI token 限制** → 显示文件大小标签让用户预判，AI 可选择性读取而非全量处理
- **[风险] 编码问题导致非 UTF-8 文件乱码** → FileReader 默认 UTF-8，遇到乱码时不做特殊处理，由 AI 自行判断
- **[风险] 用户在多个标签页打开扩展可能导致状态不一致** → 文件数据存于内存中，不跨标签页共享，符合预期
- **[权衡] 文件内容不在会话历史中持久化** → 刷新面板后文件内容丢失，需要用户重新选择。这是刻意为之，避免存储膨胀
