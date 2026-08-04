## 1. 修复核心逻辑

- [x] 1.1 在 `panel.js` 的 `createNewSessionAndShow()` 函数中添加 `SessionManager.setActiveSessionId(null)` 调用，清空持久化活跃会话 ID

## 2. 验证

- [x] 2.1 验证：点击「+ 新建会话」后 `SessionManager.getActiveSessionId()` 返回 `null`
- [x] 2.2 验证：点击新建会话后刷新页面，展示欢迎页而非恢复旧会话
- [x] 2.3 验证：正常会话创建/切换/删除流程无回归
