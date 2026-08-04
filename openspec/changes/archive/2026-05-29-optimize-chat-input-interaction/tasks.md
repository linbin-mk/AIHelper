## 1. DOM 结构变更

- [x] 1.1 将 `panel.html` 中的 `<input type="text" id="chatInput">` 替换为 `<textarea id="chatInput" rows="1"></textarea>`
- [x] 1.2 更新 placeholder 文案为 "输入消息，Enter 发送，Shift+Enter 换行..."

## 2. CSS 样式适配

- [x] 2.1 为 `.chat-input` 添加 textarea 相关样式：`resize: none`（禁用手动拖拽）、`overflow-y: hidden`（初始不显示滚动条）、`min-height` 对齐当前单行高度
- [x] 2.2 添加 `.chat-input.scrollable` 状态类样式：当高度达上限时 `overflow-y: auto` 显示滚动条
- [x] 2.3 确保 `.chat-input-area` 的 flex 布局在 textarea 动态高度下正常工作（`align-items` 适配）

## 3. 自动增高逻辑

- [x] 3.1 在 `chat.js` 中测量并保存 textarea 的初始单行高度（用于计算 max-height）
- [x] 3.2 为 `chatInputEl` 添加 `input` 事件监听器，实现自动增高：重置 `height` → 读取 `scrollHeight` → clamp 到 `[minHeight, maxHeight]` → 设置新高度
- [x] 3.3 当高度达到 `maxHeight` 时，添加 `.scrollable` 类启用滚动条；否则移除该类
- [x] 3.4 在主题切换事件中重新计算单行高度（主题可能影响字体大小）

## 4. 发送逻辑适配

- [x] 4.1 在 `sendChatMessage()` 清空输入框后，重置 textarea 高度为初始单行高度
- [x] 4.2 确保 `setSending()` 中的 `chatInputEl.disabled` 在 textarea 上正常工作
- [x] 4.3 测试 `panel.js` 中的配置检测 Enter 拦截逻辑与 textarea 兼容

## 5. 斜杠面板兼容

- [x] 5.1 验证斜杠面板（`slashPanel`）在 textarea 上的弹出位置和选择逻辑正常工作
- [x] 5.2 验证斜杠面板打开时，Enter 键选择技能（不发送）的优先级正确

## 6. 验证测试

- [x] 6.1 测试 Enter 发送、Shift+Enter 换行的键盘交互
- [x] 6.2 测试输入多行内容时自动增高，达到 4 倍高度后出现滚动条
- [x] 6.3 测试删除内容时高度正确缩小
- [x] 6.4 测试发送后输入框清空且高度重置
- [x] 6.5 测试斜杠面板功能正常
- [x] 6.6 测试未配置模型时的输入拦截功能正常
