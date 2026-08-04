## 1. 国际化文案

- [x] 1.1 在 `shared/i18n.js` 的 `chat` 命名空间下添加 `chat.insufficientBalance` 中文和英文文案
- [x] 1.2 在 `shared/i18n.js` 的 `chat` 命名空间下添加 `chat.insufficientBalanceReminder` 中文和英文文案

## 2. 错误识别与提示

- [x] 2.1 在 `shared/chat.js` 的 `startAgentLoop()` catch 块中，在现有 401/403/404 分支之后新增 402 分支：检测 `err.message` 是否包含 `402`，若是则显示 `chat.insufficientBalance` 错误文案
- [x] 2.2 402 分支中调用 `showErrorBubble(t('chat.insufficientBalance'))` 显示用户友好的错误气泡

## 3. 提醒气泡追加

- [x] 3.1 在 402 分支的错误气泡显示后，调用 `appendMessageBubble('assistant', t('chat.insufficientBalanceReminder'))` 追加提醒气泡
- [x] 3.2 确保提醒气泡内容也保存到当前会话历史记录（`appendMessageBubble` 内部逻辑若未自动保存，则手动调用 `getCurrentSessionMessages()` 追加并 `saveCurrentMessages()`）

## 4. 同步与验证

- [x] 4.1 运行 `bash sync.sh` 将 shared 目录修改同步到 chrome-extension 和 firefox-extension
- [x] 4.2 运行 `node test-runner.js` 确保所有现有测试通过
