## Context

当前 AI 聊天输入框使用 `<input type="text">`，为单行固定高度文本输入框。现有键盘交互为 Enter 发送、Shift+Enter 无特殊处理（因 input 不支持多行）。输入框位于 `.chat-input-area` 容器内，与发送/停止按钮并排 flex 布局。斜杠面板（技能选择器）定位在输入框上方。

## Goals / Non-Goals

**Goals:**
- 将 `<input type="text">` 替换为 `<textarea>`，支持多行文本
- Enter 发送消息，Shift+Enter 插入换行
- textarea 高度随内容自动增长，最大高度 = 初始单行高度 × 4
- 达到最大高度后显示垂直滚动条
- 现有功能（斜杠面板、配置检测、发送中禁用、发送后清空）不受影响

**Non-Goals:**
- 不改变整体的聊天区布局结构（双栏、工具栏）
- 不改变发送按钮/停止按钮的交互行为
- 不改变斜杠面板的弹出和选择逻辑
- 不引入新的第三方库或依赖

## Decisions

### 1. 使用 `<textarea>` 替代 `<input type="text">`

**选择**: `<textarea>` 原生支持多行文本和 `rows` 属性，是浏览器内置的多行输入方案。

**替代方案**:
- 自定义 `contenteditable` div：需要大量事件处理（粘贴、光标位置等），且不能使用 `disabled` 属性，复杂度高
- 继续使用 `<input>` + JS 模拟多行：hacky，违背语义

**结论**: `<textarea>` 是唯一合理选择，语义正确，原生支持多行。

### 2. 自动增高机制：CSS `height: auto` + JS 动态调整

**选择**: 监听 `input` 事件，每次输入时：
1. 重置 `textarea.style.height = 'auto'`（让浏览器计算内容高度）
2. 读取 `textarea.scrollHeight` 获取内容实际所需高度
3. 将高度限制在 `[minHeight, maxHeight]` 范围内
4. 设置 `textarea.style.height = clampedHeight + 'px'`

**替代方案**:
- 纯 CSS `field-sizing: content`：Chrome 实验性功能，兼容性不足
- 使用 `rows` 属性动态调整：粒度不够精细（只能整行）

**结论**: JS 动态调整是实现跨浏览器兼容的最可靠方案。`scrollHeight` 是浏览器原生的内容高度测量方式。

### 3. 最大高度计算：基于初始单行高度

**选择**: 在初始化时测量 textarea 的单行高度（`scrollHeight` 在空内容或单行时的值），然后 `maxHeight = singleLineHeight * 4`。使用 `overflow-y: auto` 在达到最大值时显示滚动条。

**考虑**: 如果计算初始高度时 textarea 还未渲染或字体未加载完成，单行高度可能不准确。解决方式是在 DOM ready 后且字体已加载时计算。

### 4. 键盘事件：Enter 发送，Shift+Enter 换行

**选择**: 在 keydown 事件中，当 `e.key === 'Enter' && !e.shiftKey` 时发送消息（与现有逻辑一致），`Shift+Enter` 由 textarea 原生行为处理（插入换行）。斜杠面板打开时，Enter 仍然选择技能（不发送）。

**替代方案**:
- 使用 `Ctrl+Enter` / `Cmd+Enter` 发送：不符合用户要求的交互设计

**结论**: 现有 Enter 发送逻辑保持不变，只需将元素类型从 input 改为 textarea。Shift+Enter 由浏览器原生处理，无需额外 JS。

### 5. 布局适配

`.chat-input-area` 使用 `display: flex`，textarea 当前 `flex: 1`。由于 textarea 高度会动态变化，需要确保：
- `.chat-input-area` 的 `flex-shrink: 0` 保持，防止被压缩
- 父容器 `.chat-main` 的消息区域使用 `flex: 1; overflow-y: auto` 以适配输入区高度变化
- 斜杠面板的 `position: absolute; bottom: 100%` 定位基于 `.chat-input-area` 的 `position: relative`，不受 textarea 高度变化影响

## Risks / Trade-offs

- **[风险] 输入框增高时消息列表可见区域缩小**：当 textarea 高度从 1 行增长到 4 行时，消息区域的可视空间减少约 3 行高度（~60px），可能影响阅读体验 → **缓解**：设置合理的最大高度（4 行，约 80-100px），不会显著影响整体布局；用户发送消息后输入框立即恢复单行
- **[风险] scrollHeight 读取时机**：在 `height: auto` 后立即读取 `scrollHeight` 可能因为浏览器重排延迟获取到旧值 → **缓解**：在 requestAnimationFrame 或 setTimeout(0) 中读取可确保获取正确的值；但在实际测试中，同步读取通常已足够准确
- **[风险] 斜杠面板 Enter 键冲突**：textarea 按下 Enter 时，斜杠面板 keydown 和发送 keydown 两个监听器都需要正确响应 → **缓解**：斜杠面板的 Enter 事件应在发送事件之前处理，且需 `preventDefault()` 阻止后续发送逻辑

## Open Questions

无
