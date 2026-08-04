## 1. 移除暗逻辑

- [x] 1.1 移除 `panel.js` 中 `checkConfigAndOpenChat()` 函数
- [x] 1.2 修改 `panel.js` 中 `switchTab('chat')` 分支：直接调用 `refreshChatView()`，不再先检测配置后跳转
- [x] 1.3 移除 `config.js` 保存配置成功后的 `switchTab('chat')` 自动跳转调用

## 2. 新增配置检测与悬浮提示框

- [x] 2.1 在 `panel.html` 聊天区域底部新增悬浮提示框的 HTML 结构（`#configPrompt`），包含提示文字和"前往设置"按钮
- [x] 2.2 在 `panel.css` 添加悬浮提示框样式：固定在输入区域上方、带箭头指向、适配双主题配色
- [x] 2.3 在 `panel.js` 中新增 `showConfigPrompt()` 函数：展示悬浮提示框并禁用输入框及发送按钮
- [x] 2.4 在 `panel.js` 中新增 `hideConfigPrompt()` 函数：隐藏提示框并恢复输入框和发送按钮状态
- [x] 2.5 在 `panel.js` 中新增 `checkConfigOnInteract()` 函数：调用 `loadModelConfig()` 检测配置完整性，未配置时调用 `showConfigPrompt()`
- [x] 2.6 在 `panel.js` 中绑定 `chatInput` 的 `focus` 事件调用 `checkConfigOnInteract()`
- [x] 2.7 在 `panel.js` 中绑定 `sendBtn` 的 `click` 事件：先调用 `checkConfigOnInteract()`，未配置时不发送
- [x] 2.8 绑定提示框消除事件：点击"前往设置"按钮 → 跳转 `switchTab('settings')` + `switchSettingsSection('provider')` + 消除提示框；点击提示框外区域消除提示框

## 3. 国际化

- [x] 3.1 在 `i18n.js` 中新增悬浮提示框相关翻译 key（`configPrompt.title`、`configPrompt.description`、`configPrompt.goToSettings`），中文和英文
- [x] 3.2 确保提示框文字在语言切换时正确更新

## 4. 验证

- [x] 4.1 验证：未配模型时点击 AI聊天 Tab 直接展示聊天页面（欢迎页），不再跳转到设置
- [x] 4.2 验证：未配模型时聚焦输入框或点击发送，展示悬浮提示框
- [x] 4.3 验证：点击"前往设置"跳转到设置 > 供应商面板，提示框消除
- [x] 4.4 验证：保存配置后停留在设置页，不自动跳回聊天页
- [x] 4.5 验证：已配模型时聚焦输入框、点击发送均正常，不展示提示框
- [x] 4.6 验证：暗色/亮色主题下提示框样式正确
- [x] 4.7 验证：中/英文语言下提示文字正确显示
