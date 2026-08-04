## Why

当用户在 AI 聊天输入框输入 "/" 触发技能选择面板后，使用键盘上下键切换选中项时，存在两个问题：

1. 列表中向下滚动超出可视区域后，后续选中的技能项会被遮挡在可视区域之外，用户无法看到当前选中的是什么。
2. 鼠标悬停在某个技能项上时，`mouseenter` 事件会覆盖键盘导航选中的索引和视觉高亮，导致键盘操作失效——用户从鼠标切回键盘后需要双击方向键才能移动。

这降低了键盘操作的可用性。

## What Changes

- 在技能面板键盘导航（ArrowDown/ArrowUp）时，自动将选中项滚动到可视区域内
- 添加 `slashKeyboardActive` 标志位，键盘导航活跃时 `mouseenter` 整体跳过，避免鼠标悬停覆盖键盘选中状态
- 鼠标移动时重置标志位交还控制权，点击技能项时也重置标志位
- 确保选中项始终在面板的 `maxHeight: 240px` 可视区域内可见

## Capabilities

### New Capabilities

- `skill-panel-scroll`: 技能选择面板键盘导航时的自动跟随滚动

### Modified Capabilities

（无）

## Impact

- 受影响代码：`chrome-extension/src/panel/chat.js` 中的 `renderSlashPanel()` 函数及键盘事件处理逻辑
- 无 API 变更，无依赖变更
- 纯前端交互增强，不影响其他功能
