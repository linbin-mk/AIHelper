## Context

当前 `createNewSessionAndShow()` 函数（`panel.js:1159`）在用户点击「+ 新建会话」时只清空内存变量：

```javascript
currentSessionId = null;
currentSessionMessages = [];
window.currentSessionId = null;
window.currentSessionMessages = [];
window.chatMessages = [];
```

但未调用 `SessionManager.setActiveSessionId(null)` 清理 `chrome.storage.local` 中持久化的 `ai_helper_active_session_id`。这导致 `SessionManager.getActiveSessionId()` 返回旧会话 ID，当页面刷新或离开后回来时触发自动恢复旧会话。

## Goals / Non-Goals

**Goals:**
- 点击「+ 新建会话」后，`getActiveSessionId()` 返回 `null`
- 刷新页面或重新进入 panel 时，若活跃会话 ID 为 `null`，展示欢迎页而非恢复旧会话

**Non-Goals:**
- 不改变会话创建/删除/切换的其他逻辑
- 不改变 `SessionManager` 的接口或实现

## Decisions

### 方案：在 `createNewSessionAndShow()` 中追加一条 `SessionManager.setActiveSessionId(null)` 调用

在现有清空内存变量的代码之后，新增一行：

```javascript
if (typeof SessionManager !== 'undefined') {
  SessionManager.setActiveSessionId(null);
}
```

**理由：**
- 最小侵入：只加一行异步调用（无需 await，不需要等待结果）
- 职责对齐：「新建会话」本身就应该将系统状态置为「无活跃会话」，内存和持久化应当一致
- `setActiveSessionId(null)` 内部容错已完备（try/catch 静默失败），不会引入新异常

**备选方案（未采用）：**
- 移除 `ai_helper_active_session_id` key → 过度，`setActiveSessionId(null)` 语义更清晰
- 在页面 init 时检查 → 治标不治本，根源在于状态写入不一致

## Risks / Trade-offs

- **无已知风险**：`SessionManager.setActiveSessionId(null)` 只在 `chrome.storage.local` 中写入 `null`，读取侧 `getActiveSessionId()` 返回 `null` 已由现有逻辑处理（欢迎页展示、新建会话时创建）
