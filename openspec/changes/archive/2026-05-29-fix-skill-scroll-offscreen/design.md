## Context

当前 `chat.js` 中的技能选择面板（slash panel）在用户输入 "/" 后显示。面板设置了 `maxHeight: 240px` 和 `overflowY: auto`，当技能数量超过可视区域时会显示滚动条。

键盘导航通过 `chatInputEl` 的 `keydown` 事件处理：
- ArrowDown → `slashSelectedIndex++` → 调用 `renderSlashPanel()`
- ArrowUp → `slashSelectedIndex--` → 调用 `renderSlashPanel()`

### 问题一：滚动越界
`renderSlashPanel()` 使用 `innerHTML` 完全重建 DOM，导致面板滚动位置重置为顶部，选中项可能不在可视区域内。

### 问题二：鼠标悬停干扰键盘导航
`renderSlashPanel()` 的 `innerHTML` 重建 DOM 后，若鼠标光标位于面板上方，`mouseenter` 事件会触发并覆盖 `slashSelectedIndex` 以及视觉高亮（将所有项背景清除并只高亮悬停项）。导致用户从鼠标切回键盘后第一下方向键看似无效。

## Goals / Non-Goals

**Goals:**
- 键盘导航时，当前选中的技能项始终在面板的可视区域内
- 键盘导航时不受鼠标悬停位置干扰
- 使用 `scrollIntoView({ block: 'nearest' })` 实现平滑自动滚动
- 鼠标移动或点击后自动恢复鼠标交互能力

**Non-Goals:**
- 不修改面板的视觉风格或尺寸
- 不改变技能注册表（SkillRegistry）或技能数据结构
- 不引入虚拟滚动或其他性能优化

## Decisions

1. **在 `renderSlashPanel()` 末尾添加滚动逻辑**
   - 在所有 `.slash-item` 事件绑定完成后，通过 `data-index` 属性找到当前选中项
   - 调用 `selectedEl.scrollIntoView({ block: 'nearest' })` 将其滚动到可视区域
   - 理由：集中处理，无论从键盘还是其他方式触发 `renderSlashPanel`，都能保证选中项可见

2. **使用 `scrollIntoView({ block: 'nearest' })`**
   - `block: 'nearest'` 表示仅当元素不在可视区域时才滚动，且最小化滚动距离
   - 相比其他方案：
     - `{ block: 'start' }` 会将选中项滚到顶部，上方项不可见
     - `{ block: 'center' }` 滚动过多
     - 手动计算 `offsetTop / scrollTop` 更复杂且容易出错
   - 浏览器兼容性：Chrome 61+ / Firefox 36+ / Safari 完全支持，符合 Chrome 扩展要求

3. **`slashKeyboardActive` 标志位隔离键盘与鼠标**
   - `ArrowDown`/`ArrowUp` 处理中设置 `slashKeyboardActive = true`
   - `mouseenter` 开头检查 `if (slashKeyboardActive) return;` —— 键盘活跃时整体跳过，不改变背景也不改变索引
   - `mousemove` 监听重置 `slashKeyboardActive = false` —— 鼠标移动表示用户切回鼠标
   - `click` 处理中重置 `slashKeyboardActive = false` —— 点击也表示切回鼠标
   - 相比仅保护索引更新的方案：鼠标悬停仍会覆盖键盘选中的视觉高亮，用户看不到键盘选中的项

## Risks / Trade-offs

- **风险**：`scrollIntoView` 在每次渲染时都会触发，可能带来微小的性能开销
  - **缓解**：技能列表通常不超过 50 项，性能影响可忽略
- **风险**：如果 `slashSelectedIndex` 为 -1（无选中项），无需滚动
  - **缓解**：添加 `if (slashSelectedIndex >= 0)` 条件判断
- **风险**：`mousemove` 可能在 `innerHTML` 重建 DOM 时被浏览器触发，误重置标志位
  - **缓解**：`mouseenter` 整体 `return` 而非仅保护索引，即使标志位被误重置，视觉高亮也不会被覆盖；且实际测试中 Chrome 不会因 DOM 重建触发 `mousemove`
