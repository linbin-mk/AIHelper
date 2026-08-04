## 1. CSS 样式

- [x] 1.1 添加垃圾桶按钮样式（`.batch-delete-btn`），位于 `#sessionList` 底部
- [x] 1.2 添加批量删除对话框遮罩样式（`.batch-delete-overlay`），`position: fixed` 半透明黑色全屏遮罩，`z-index` 高于侧边栏
- [x] 1.3 添加批量删除对话框卡片样式（`.batch-delete-dialog`），居中悬浮，匹配 Catppuccin 暗色主题
- [x] 1.4 添加对话框内会话列表项样式（`.batch-delete__item`），每行含复选框 + 会话标题
- [x] 1.5 添加全选行样式（`.batch-delete__select-all`），位于列表顶部
- [x] 1.6 添加确定/取消按钮样式，确定按钮强调危险操作（红色）

## 2. HTML 结构

- [x] 2.1 在 `panel.html` 中添加批量删除对话框 HTML 模板（`#batchDeleteDialog`），包含全选行、会话列表容器、确定/取消按钮
- [x] 2.2 在 `renderSessionList()` / `renderGroupedSessionList()` / `renderFlatSessionList()` 中，当会话列表非空时在列表底部追加垃圾桶按钮 HTML

## 3. 逻辑实现

- [x] 3.1 实现 `openBatchDeleteDialog()` 函数：获取所有会话，动态生成复选框列表项插入对话框容器，绑定全选/单项复选框事件，显示遮罩+对话框
- [x] 3.2 实现全选逻辑：全选复选框变更时同步所有子项；子项变更时校验全选状态
- [x] 3.3 实现 `closeBatchDeleteDialog()` 函数：隐藏遮罩+对话框，清理复选框状态
- [x] 3.4 实现 `handleBatchDeleteSessions()` 函数：收集已勾选 sessionId，删除前判断 `currentSessionId` 是否在待删除集合中；遍历删除后，仅当活跃会话被删除时才调用 `SessionManager.setActiveSessionId(null)` 清空持久化 ID + 重置内存状态 + 展示欢迎页；否则仅刷新会话列表
- [x] 3.5 绑定对话框遮罩点击事件和取消按钮事件，调用 `closeBatchDeleteDialog()`

## 4. 边界处理

- [x] 4.1 会话列表为空时，垃圾桶按钮不渲染
- [x] 4.2 对话框内无勾选时点击确定，直接关闭对话框不执行删除
- [x] 4.3 批量删除后刷新页面，验证已删除会话不恢复（持久的活跃会话 ID 已被清空）
- [x] 4.4 批量删除后验证单个删除功能无回归
