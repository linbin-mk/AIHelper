## 1. 核心实现

- [x] 1.1 在 `renderSlashPanel()` 函数末尾（事件绑定完成后）添加自动滚动逻辑：当 `slashSelectedIndex >= 0` 时，通过 `data-index` 属性找到选中项，调用 `scrollIntoView({ block: 'nearest' })` 滚动到可视区域
- [x] 1.2 新增 `slashKeyboardActive` 标志位，ArrowDown/ArrowUp 处理中设为 `true`
- [x] 1.3 `mouseenter` 开头加 `if (slashKeyboardActive) return;` —— 键盘活跃时整体跳过
- [x] 1.4 `click` 处理中加 `slashKeyboardActive = false` —— 点击后切回鼠标模式
- [x] 1.5 `mousemove` 监听中重置 `slashKeyboardActive = false` —— 鼠标移动后切回鼠标模式

## 2. 验证

- [x] 2.1 手动测试：输入 `/` 触发面板，多次按 ArrowDown 验证选中项不会超出底部可视区域
- [x] 2.2 手动测试：按 ArrowUp 验证向上导航时选中项不会超出顶部可视区域
- [x] 2.3 手动测试：确认无选中项时（`/` 后无过滤输入）面板无异常
- [x] 2.4 手动测试：确认输入过滤字符后（如 `/op`）键盘导航滚动行为正常
- [x] 2.5 手动测试：鼠标悬停后切回键盘，第一下方向键即可移动选中项
- [x] 2.6 手动测试：键盘导航时鼠标悬停不覆盖选中高亮
