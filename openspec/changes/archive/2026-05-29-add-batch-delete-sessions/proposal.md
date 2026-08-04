## Why

当前仅支持通过右键菜单逐个删除会话，用户积累大量历史会话后清理效率极低。需要在侧边栏底部增加批量删除入口，允许用户通过复选框选择要删除的会话并一键确认删除。

## What Changes

- 在 `#sessionList` 底部（`chat-sidebar__footer` 区域）新增垃圾桶图标按钮
- 点击垃圾桶弹出自定义悬浮对话框，对话框内展示会话列表（每行带复选框）
- 对话框顶部提供「全选」复选框，支持一键选中/取消所有会话
- 点击「确定」后删除所有选中的会话，并同步清除持久化的活跃会话 ID（如活跃会话被删除）
- 删除完成后，若活跃会话被删除，参考 `aafd02b3` 模式清空活跃会话 ID，展示欢迎页
- 会话列表为空时隐藏垃圾桶按钮

## Capabilities

### New Capabilities
- `batch-delete-sessions`: 侧边栏底部垃圾桶按钮，点击后弹出选择式批量删除对话框，支持复选框多选、全选、确认删除

### Modified Capabilities
- `multi-session-management`: 「会话删除」需求扩展为支持选择式批量删除；若删除的会话中包含活跃会话，同步清空持久化活跃会话 ID

## Impact

- 受影响文件：`chrome-extension/src/panel/panel.html`（新增批量删除对话框 HTML 结构）
- 受影响文件：`chrome-extension/src/panel/panel.js`（新增 `openBatchDeleteDialog`、`toggleSelectAll`、`handleBatchDeleteSessions` 函数，修改 `renderSessionList` 以控制按钮显隐）
- 受影响文件：`chrome-extension/src/panel/panel.css`（垃圾桶按钮、批量删除对话框/遮罩/复选框样式）
- 受影响规格：`openspec/specs/multi-session-management/spec.md`（「会话删除」需求）
