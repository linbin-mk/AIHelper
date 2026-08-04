## 1. 数据层 — session-manager.js

- [x] 1.1 创建 `chrome-extension/src/panel/session-manager.js` 文件，实现 SessionManager 类
- [x] 1.2 实现 `loadSessions()` — 从 `chrome.storage.local` 读取 `ai_helper_sessions`，返回会话数组
- [x] 1.3 实现 `saveSessions(sessions)` — 将会话数组写入 `chrome.storage.local`
- [x] 1.4 实现 `createSession()` — 生成 session ID（`session_` + 时间戳），创建新会话对象，更新存储
- [x] 1.5 实现 `deleteSession(sessionId)` — 从存储数组中移除会话，处理后自动切换活跃会话
- [x] 1.6 实现 `renameSession(sessionId, newTitle)` — 更新会话标题并持久化
- [x] 1.7 实现 `updateSessionMessages(sessionId, messages)` — 更新指定会话的消息并更新 `updatedAt`
- [x] 1.8 实现 `getActiveSessionId()` / `setActiveSessionId(id)` — 读写活跃会话 ID（持久化到 `ai_helper_active_session_id`）
- [x] 1.10 实现 `generateSessionTitle(sessionId, userMessage, aiResponse)` — 发送独立标题生成请求，含降级策略
- [x] 1.11 在 `panel.html` 中引入 `session-manager.js`

## 2. HTML 布局重构 — panel.html

- [x] 2.1 重写 `#tab-chat` 内部结构为 `.chat-sidebar` + `.chat-main` 双容器
- [x] 2.2 `.chat-sidebar` 内部结构：header（新建按钮 + 搜索框）+ list（会话列表容器）+ footer（模型信息）
- [x] 2.3 `.chat-main` 内部结构：toolbar（折叠按钮 + 会话标题）+ content（消息列表容器 + 欢迎页容器）+ input（输入区域）
- [x] 2.4 移除原工具栏中的「清空」和「导出日志」按钮
- [x] 2.5 保留现有的消息输入框、发送按钮、停止按钮、技能状态栏元素

## 3. CSS 样式 — panel.css

- [x] 3.1 新增双栏布局样式：`.chat-layout` flex 容器，sidebar 260px，main flex:1
- [x] 3.2 新增侧边栏样式：背景色、滚动条、折叠/展开 transition 动画
- [x] 3.3 新增侧边栏折叠态样式：宽度 60px，仅显示图标
- [x] 3.4 新增会话卡片样式：`.session-card`，含标题、时间、活跃态高亮、hover 效果
- [x] 3.5 新增时间分组标题样式：「今天」「昨天」「本周」「更早」分隔线
- [x] 3.6 新增搜索框样式：输入框 + 清除按钮
- [x] 3.7 新增欢迎页样式：居中 Icon、标题、描述文字排版
- [x] 3.8 新增最近会话快捷入口卡片样式：标题 + 消息预览 + 时间
- [x] 3.9 新增侧边栏右键菜单样式：`.context-menu` 浮层，含「重命名」「导出日志」「删除」
- [x] 3.10 新增 Toast 通知样式：底部居中，含操作按钮
- [x] 3.11 移动端适配：宽度 < 400px 时侧边栏默认隐藏，覆盖层模式

## 4. 会话侧边栏功能 — panel.js

- [x] 4.1 在 `panel.js` 初始化时调用 `SessionManager.loadSessions()`
- [x] 4.2 实现 `renderSessionList()` — 渲染侧边栏会话列表，按时间分组（今天/昨天/本周/更早）
- [x] 4.3 实现 `renderTimeGroups(sessions)` — 将 sessions 按 `updatedAt` 分组并返回分组数据
- [x] 4.4 实现「新建会话」按钮点击事件：清空聊天区，取消活跃会话选中，不创建存储记录
- [x] 4.5 实现会话卡片点击事件：调用 `switchSession(sessionId)`，加载消息，更新活跃状态
- [x] 4.6 实现会话搜索功能：监听搜索框 input 事件，实时过滤会话列表，高亮匹配文本
- [x] 4.7 实现侧边栏折叠/展开按钮事件：切换 `chat-sidebar--collapsed` class
- [x] 4.8 实现会话右键菜单：监听 `contextmenu` 事件，显示操作菜单，处理点击外部关闭
- [x] 4.9 实现右键菜单操作：重命名（内嵌编辑）、导出日志（调用 `SessionManager`）、删除（确认对话框）

## 5. 欢迎页功能 — panel.js

- [x] 5.1 实现 `showWelcomePage()` — 显示欢迎页，隐藏消息列表
- [x] 5.2 实现 `hideWelcomePage()` — 隐藏欢迎页，显示消息列表
- [x] 5.3 实现 `renderRecentSessions()` — 在欢迎页渲染最近 3 个会话快捷入口卡片
- [x] 5.4 欢迎页会话卡片点击事件：切换到对应会话
- [x] 5.5 在 Tab 切换到聊天时判断：无活跃会话时显示欢迎页，有活跃会话时加载消息

## 6. chat.js 适配

- [x] 6.1 新增 `getCurrentSessionMessages()` — 通过 `SessionManager.getActiveSessionId()` 获取当前会话消息
- [x] 6.2 新增 `setCurrentSessionMessages(messages)` — 将消息写回当前活跃会话
- [x] 6.3 修改 `sendMessage()`：消息发送后若无活跃会话则调用 `createSession()`，不立即渲染侧边栏
- [x] 6.4 修改 `startAgentLoop()`：AI 首条回复完成后调用 `SessionManager.generateSessionTitle()`
- [x] 6.5 修改 `buildMessages()`：传入 `getCurrentSessionMessages()` 而非全局数组
- [x] 6.6 修改 `renderChatMessages()`：接收 messages 参数，不再依赖全局变量
- [x] 6.7 移除 `exportChatLog()` 函数（导出逻辑已在 session-manager.js）
- [x] 6.8 清空全局 `chatMessages` 数组的直接引用，全部改为通过 session manager 读写

## 7. 导出日志迁移 — session-manager.js

- [x] 7.1 实现 `exportSessionLog(sessionId)` — 导出指定会话为 JSON 文件下载
- [x] 7.2 导出数据包含 meta.sessionTitle 字段（新增），其余结构不变
- [x] 7.3 文件名格式：`ai-helper-chat-{sessionTitle}-YYYYMMDD-HHmmss.json`

## 8. i18n 国际化更新 — i18n.js

- [x] 8.1 新增侧边栏相关 i18n key：新建会话、搜索会话、今天、昨天、本周、更早、未命名会话
- [x] 8.2 新增加欢迎页 i18n key：欢迎标题、欢迎描述文字
- [x] 8.3 新增加右键菜单 i18n key：重命名、导出日志、删除、确认删除
- [x] 8.5 中英文双语覆盖所有新增 key

## 9. 端到端验证

- [x] 9.1 验证首次打开欢迎页展示正确（Icon + 描述 + 无会话时不显示快捷入口）
- [x] 9.2 验证发送第一条消息自动创建会话，侧边栏在 AI 回复完成后出现新会话卡片
- [x] 9.3 验证 AI 回复完成后自动生成会话标题，标题更新到侧边栏
- [x] 9.4 验证创建多个会话后，侧边栏列表和时间分组正确
- [x] 9.5 验证会话切换功能：点击侧边栏卡片切换，消息正确加载/显示
- [x] 9.6 验证会话删除功能：右键菜单删除 → confirm 确认 → 会话移除，活跃会话自动切换
- [x] 9.7 验证重命名功能：右键菜单重命名，编辑保存
- [x] 9.8 验证导出日志功能：右键菜单导出，JSON 文件格式正确
- [x] 9.9 验证搜索功能：输入关键词过滤会话，高亮显示
- [x] 9.10 验证侧边栏折叠/展开功能正常
- [x] 9.11 验证刷新页面后会话和消息完整恢复
- [x] 9.12 验证流式输出、思考过程、工具调用卡片在切换会话后仍然正常
