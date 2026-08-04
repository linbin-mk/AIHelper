## 1. 数据模型变更

- [x] 1.1 在 session 对象中新增 `titleSource` 字段（`'truncated'` | `'ai'`），创建会话时默认 `'truncated'`
- [x] 1.2 移除 session 对象中的 `isGeneratingTitle` 字段

## 2. session-manager.js — 初始标题与定时器

- [x] 2.1 新增模块级 `Map<string, number>`（`_titleTimers`）管理 sessionId → timerId 映射
- [x] 2.2 新增 `setInitialTitle(sessionId, userMessage)` 方法：清理特殊字符 → 截取前15字符 → 设置 `session.title` → 设置 `titleSource: 'truncated'` → 保存 → 启动定时器
- [x] 2.3 新增 `_startTitleTimer(sessionId, userMessage)` 方法：创建1分钟 `setTimeout`，到期后调用 `generateSessionTitle`
- [x] 2.4 新增 `_clearTitleTimer(sessionId)` 方法：清除指定会话的定时器

## 3. session-manager.js — 标题生成逻辑重写

- [x] 3.1 重写 `generateSessionTitle(sessionId, userMessage, aiResponse)`：移除 `title !== ''` 守卫和 `isGeneratingTitle` 防重入，改为检查 `titleSource !== 'truncated'` 则跳过
- [x] 3.2 `_requestTitle` 保持不变
- [x] 3.3 `_fallbackTitle` 标记为废弃（保留方法体但不再从主流程调用）
- [x] 3.4 定时器到期后调用 `_requestTitle`，成功则更新 title + titleSource，失败不做处理

## 4. chat.js — 触发时机调整

- [x] 4.1 在 `sendChatMessage()` 创建会话后，调用 `SessionManager.setInitialTitle(sessionId, userMessage)` 并立即渲染会话卡片
- [x] 4.2 修改 `startAgentLoop` 中 AI 完成后的逻辑：不再调用 `generateSessionTitle`（标题已在阶段1设置，阶段2由定时器触发）
- [x] 4.3 在 `stopAgentLoop` 中调用 `SessionManager._clearTitleTimer` 清除当前会话定时器（用户点击停止后不再 API 精炼）
- [x] 4.4 用户手动重命名时，调用 `_clearTitleTimer` 清除对应会话的定时器（防止覆盖用户修改）

## 5. panel.js — 卡片渲染简化

- [x] 5.1 `buildSessionCardHTML` 移除 title 为空时的「未命名会话」回退显示（title 从创建起就有值）
- [x] 5.2 `updateSessionTitleDisplay` 保持不变

## 6. 国际化与清理

- [x] 6.1 评估 `i18n.js` 中 `session.untitled` 键是否需要保留（不再有空白标题场景）
- [x] 6.2 清理 `session-manager.js` 中 `isGeneratingTitle` 所有引用

## 7. 归档后补充修复

- [x] 7.1 DeepSeek v4 兼容：`max_tokens` 30→100，只用 `content` 不用 `reasoning_content`，`finish_reason=length` 诊断日志
- [x] 7.2 竞态修复：`doSendMessage` 收进 `setInitialTitle.then()` 回调，防止标题被 `updateSessionMessages` 覆盖
- [x] 7.3 会话在1分钟内完成时取消定时器，直接用完整 AI 回复生成标题（`startAgentLoop` 完成路径中检查 `titleSource === 'truncated'`）
