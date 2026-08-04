## Context

当前项目是基于 Chrome Extension Manifest V3 的 Side Panel 应用，使用原生 JavaScript（无框架），会话存储于 `chrome.storage.local`。

现有删除流程（`panel.js:1038-1063`）：
1. 右键菜单/更多按钮触发单个删除
2. `confirm()` 原生弹窗确认
3. `SessionManager.deleteSession(sessionId)` 从数组 `splice` 移除并持久化
4. 若删除的是活跃会话，切换到第一个会话或欢迎页

侧边栏布局（`panel.html:25-38`）：`chat-sidebar__header` → `chat-sidebar__list`（`#sessionList`） → `chat-sidebar__footer`。

参考 `aafd02b3`：在 `createNewSessionAndShow()` 中通过 `SessionManager.setActiveSessionId(null)` 清空持久化活跃会话 ID。批量删除后若活跃会话被删除，需复用此模式。

## Goals / Non-Goals

**Goals:**
- 在 `#sessionList` 底部新增垃圾桶图标按钮
- 点击后弹出居中悬浮对话框，展示所有会话列表（每行带复选框）
- 对话框顶部提供「全选」复选框，一键选中/取消所有会话
- 确认后删除所有选中的会话
- 若删除的会话中包含当前活跃会话，清空活跃会话 ID 并重置为欢迎页
- 会话列表为空时自动隐藏垃圾桶按钮

**Non-Goals:**
- 不提供撤销/恢复功能
- 不改变 `SessionManager` 的接口或实现
- 不影响现有的单个删除功能
- 不在对话框中支持搜索/过滤

## Decisions

### 1. 交互流程

```
[垃圾桶按钮] → 弹出对话框（会话列表 + 复选框 + 全选 + 确定/取消）
                                                           ↓
                                            点击确定 → 删除选中会话 → 刷新
```

### 2. 对话框内会话列表复用现有卡片样式

每行结构：
```html
<label class="batch-delete__item">
  <input type="checkbox" class="batch-delete__checkbox" data-session-id="xxx">
  <span class="batch-delete__title">会话标题</span>
</label>
```

**理由：**
- 复用 `.session-card__title` 的样式理念，保持视觉一致性
- 使用原生 `<input type="checkbox">` 无需第三方组件

### 3. 全选复选框

```html
<label class="batch-delete__select-all">
  <input type="checkbox" id="batchDeleteSelectAll">
  <span>全选</span>
</label>
```

**交互规则：**
- 点击全选 → 所有子复选框同步为选中状态
- 手动取消任一子项 → 全选自动取消
- 手动选中所有子项 → 全选自动打钩

### 4. 删除逻辑

```javascript
async function handleBatchDeleteSessions() {
  var checkboxes = document.querySelectorAll('.batch-delete__checkbox:checked');
  if (checkboxes.length === 0) { closeBatchDeleteDialog(); return; }

  // 记录当前活跃会话是否在待删除集合中
  var activeId = window.currentSessionId;
  var selectedIds = [];
  for (var i = 0; i < checkboxes.length; i++) {
    selectedIds.push(checkboxes[i].dataset.sessionId);
  }
  var isActiveDeleted = activeId && selectedIds.indexOf(activeId) !== -1;

  // 逐个删除选中的会话
  for (var j = 0; j < selectedIds.length; j++) {
    await SessionManager.deleteSession(selectedIds[j]);
  }

  // 仅当活跃会话被删除时，清空持久化活跃会话 ID 并重置页面状态
  if (isActiveDeleted) {
    if (typeof SessionManager !== 'undefined') {
      SessionManager.setActiveSessionId(null);
    }
    currentSessionId = null;
    window.currentSessionId = null;
    window.currentSessionMessages = [];
    window.chatMessages = [];
    showWelcomePage();
    updateSessionTitleDisplay('');
  }

  closeBatchDeleteDialog();
  renderSessionList();
  refreshWelcomeRecentIfVisible();
}
```

**理由：**
- 删除前记录 `currentSessionId` 是否在选中集合中，删除后仅当活跃会话被删除时才执行清理
- 复用 `SessionManager.deleteSession()`，不对其内部行为做假设
- 参考 `aafd02b3` 模式，仅在活跃会话被删除时显式调用 `SessionManager.setActiveSessionId(null)`，避免无谓的持久化写入
- 若活跃会话未被删除（用户只删除其他会话），保持当前会话状态不变

### 5. 垃圾桶按钮显隐

在 `renderSessionList()` 中检查 `sessions.length`，为 0 时不渲染垃圾桶按钮。

### 6. 对话框遮罩

使用 `position: fixed` 半透明黑色遮罩 + 居中白色/暗色卡片，关闭区域点击遮罩取消。

## Risks / Trade-offs

- **误操作风险**：用户可能选中后未仔细确认 → 对话框中展示完整会话标题，选中项有明显视觉反馈（复选框勾选），确认按钮使用红色强调危险操作
- **大量会话场景**：会话过多时对话框列表可能超出视口 → 对话框内列表设置 `max-height` + `overflow-y: auto` 滚动
- **无撤销能力**：删除不可逆 → 对话框中明确使用「确定」和「取消」按钮区分，勾选项可随时取消
