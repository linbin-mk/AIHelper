## Context

AI Helper 是一个 Chrome 扩展（Manifest V3），当前的 AI 聊天面板仅支持单会话模式 — 所有对话混在同一个 `chatMessages` 数组中，`chatHistory` 存储键只保存一份消息列表。用户切换话题只能清空全部历史。项目为纯原生 JS（无构建工具/框架），使用 `chrome.storage.local` 持久化数据，`marked.min.js` 渲染 Markdown，通过 fetch + SSE 流式调用 OpenAI 兼容 API。

本次变更需在不引入构建工具的前提下，将单会话架构重构为多会话管理。

## Goals / Non-Goals

**Goals:**
- 实现多会话数据模型：每个会话独立存储 ID、标题、消息列表、创建/更新时间
- 重构聊天 UI 为「侧边栏 + 聊天区」双栏布局，侧边栏展示会话列表
- 会话自动命名：首条 AI 回复后发送独立的标题生成请求
- 欢迎页：首次打开或无活跃会话时展示，含最近 3 个会话快捷入口
- 将「导出日志」功能从顶部工具栏移至侧边栏会话右键菜单；「清空」功能移除（删除会话可替代）
- 保留 100% 现有的消息交互能力：流式渲染、思考过程折叠、工具调用卡片、Markdown

**Non-Goals:**
- 不引入任何构建工具（Webpack/Vite）或 UI 框架（React/Vue）
- 不实现会话拖拽排序
- 不实现会话固定（pin）
- 不改变其他 Tab（技能、请求监控、资源管理、设置）的任何行为
- 不改变 API Key 的存储方式
- 不做旧版单会话数据迁移（`ai_helper_chat_history`），用户重装插件后旧数据自动清除

## Decisions

### 1. 数据模型：多会话存储结构

**选择**：使用 `ai_helper_sessions` 作为 `chrome.storage.local` 中存储会话数据的新键（会话对象数组）。

每个会话的数据结构：
```javascript
{
  id: "session_1716652800000",       // 唯一会话 ID
  title: "React 组件设计",            // 自动生成或手动修改的标题
  messages: [                         // 消息数组（与现有格式兼容）
    { role: "user", content: "..." },
    { role: "assistant", content: "...", reasoning_content: "...", tool_calls: [...] }
  ],
  createdAt: 1716652800000,           // 创建时间戳
  updatedAt: 1716652900000,           // 最后活跃时间戳
  isGeneratingTitle: false            // 是否正在生成标题（防止重复请求）
}
```

存储键设计：
- `ai_helper_sessions`: 会话列表数组（主数据）
- `ai_helper_active_session_id`: 当前活跃会话 ID（记忆最后操作的会话）
- `ai_helper_sidebar_collapsed`: 侧边栏折叠状态


**理由**：
- `chrome.storage.local` 单键读写是原子的，整个数组一起读写保证一致性
- 与现有消息格式完全兼容，`chat.js` 的 `renderChatMessages` 无需修改
- 会话 ID 用时间戳前缀防碰撞，足够简单

**备选方案**：
- 每个会话一个存储键（`session_xxx`）：每次切换都需异步读写，切换延迟高 → 放弃
- IndexedDB：chrome.storage.local 对 ≤10KB 的数据读写更快，且项目已有 storage 模式 → 放弃

### 2. 文件组织：新增文件 vs 修改现有文件

**选择**：创建新的 `session-manager.js` 专门处理会话管理逻辑，修改 `panel.js`/`panel.html`/`panel.css` 重构布局，`chat.js` 最小化修改。

```
chrome-extension/src/panel/
├── panel.html              # 重写 #tab-chat 的 HTML 结构
├── panel.css               # 新增侧边栏/欢迎页/会话卡片样式
├── panel.js                # 新增会话管理；移除清空/导出按钮逻辑（清空功能完全移除）
├── chat.js                 # 新增 getCurrentSession()/getCurrentMessages()；移除 exportChatLog()
├── session-manager.js      # ★ 新文件：会话 CRUD、持久化、自动标题生成
├── config.js               # 不变
├── resource.js             # 不变
├── git-ops.js              # 不变
├── skill-registry.js       # 不变
├── i18n.js                 # 新增侧边栏/欢迎页 i18n key
├── marked.min.js           # 不变
```

**理由**：
- 分离关注点：`session-manager.js` 是纯数据管理，不涉及 DOM，易于测试和维护
- `chat.js` 核心 Agent Loop 逻辑成熟稳定，最小化修改降低回归风险
- `panel.js` 新增 Tab 初始化和会话管理器初始化，逻辑清晰

**备选方案**：
- 全部写在 `panel.js` 里：文件已 842 行，继续膨胀难以维护 → 放弃
- 创建 `chat-v2.js` 全新重写：与现有逻辑重复，浪费已验证的稳定代码 → 放弃

### 3. chat.js 改造：抽取当前会话上下文

**选择**：在 `chat.js` 中新增两个工具函数 `getCurrentSessionMessages()` 和 `setCurrentSessionMessages()`，替代直接读写全局 `chatMessages`。消息渲染和 Agent Loop 保持不变。

修改点：
- `sendMessage()`：从 `getCurrentSessionMessages()` 获取消息上下文，`buildMessages()` 不变
- `startAgentLoop()`：流式完成后通过 `setCurrentSessionMessages()` 持久化
- `renderChatMessages()`：接收 messages 数组参数，不再依赖全局变量
- 移除 `exportChatLog()` 函数，导出逻辑移至 `session-manager.js`
- `buildRequestContext()`：不变

**理由**：
- 核心 Agent Loop 和 SSE 解析逻辑已经过大量调试，不应重写
- 最小侵入式修改，仅替换数据读写入口

### 4. 自动标题生成：独立的轻量请求

**选择**：在 AI 完成首条回复后，`session-manager.js` 发起一个独立的非流式 API 调用来生成标题。Prompt 模板：

```
基于以下对话内容，生成一个简洁的会话标题（3-5个词，不超过15个字符）：
用户: {userMessage前50字}
AI: {aiResponse前100字}
标题:
```

使用当前配置的 API endpoint + `stream: false` 发送请求，解析 choices[0].message.content 作为标题。

**理由**：
- 独立的非流式请求简单可靠，标题生成延迟通常 <1 秒
- 复用用户已有的 API 配置，不增加额外服务依赖
- 降级策略覆盖 API 调用失败场景（截取用户消息前 15 字符）

**备选方案**：
- 在 Agent Loop 过程中让 LLM 输出标题 token：会干扰正常回复流程 → 放弃
- 纯客户端提取关键词：效果差，需要引入 NLP 库 → 放弃

### 5. 删除机制：确认对话框直接删除

**选择**：删除操作通过浏览器原生 `confirm()` 对话框确认后，直接从 storage 中永久删除会话数据。

```javascript
async function handleDeleteSession(sessionId) {
  const session = await SessionManager.getSession(sessionId);
  if (!confirm('确定删除会话「' + session.title + '」？')) return;
  await SessionManager.deleteSession(sessionId);
  if (sessionId === currentSessionId) {
    // 自动切换到最近活跃会话或欢迎页
  }
  renderSessionList();
}
```

**理由**：
- 浏览器原生 `confirm()` 对话框简单可靠，无需额外 UI 组件
- `SessionManager.deleteSession()` 直接从存储数组 splice 并保存，一次异步操作完成
- 删除前需要用户明确确认，误操作有保护

### 6. 会话创建时机：首条消息发送后延迟出现

**选择**：点击「新建会话」按钮不立即创建存储记录，仅清空聊天区并取消活跃会话选中状态。会话在用户发送首条消息时创建，但侧边栏卡片在 AI 首条回复完成后（标题生成回调中）才渲染出现。

```
用户点击「新建会话」→ 清空聊天区 + 取消选中（无 storage 写入）
用户输入消息发送 → SessionManager.createSession() + push 用户消息
AI 流式回复 → 消息实时展示，会话已存在于 storage 但侧边栏不刷新
AI 回复完成 → 标题生成 → renderSessionList() → 卡片首次出现在侧边栏
后续消息 → 卡片自动置顶，更新活跃时间
```

**理由**：
- 避免侧边栏出现大量空白会话，保持列表整洁
- 空消息的会话不占用存储空间
- 首次消息发送到标题生成之间的延迟通常 <1 秒，用户感知不到卡片"迟到"

### 7. HTML 结构：侧边栏 + 聊天区双容器

**选择**：在 `#tab-chat` 内部创建 `.chat-sidebar` 和 `.chat-main` 两个容器，替代当前的单一容器。

```
#tab-chat
├── .chat-sidebar
│   ├── .chat-sidebar__header （新建按钮 + 搜索框）
│   ├── .chat-sidebar__list   （会话时间分组列表）
│   └── .chat-sidebar__footer （模型信息 + 设置入口）
└── .chat-main
    ├── .chat-main__toolbar    （侧边栏切换按钮 + 会话标题）
    ├── .chat-main__content    （消息列表 / 欢迎页）
    └── .chat-main__input      （消息输入区域）
```

**理由**：
- CSS Flexbox 布局，sidebar 固定宽度 130px，main 占据 flex: 1
- 通过 CSS class 控制 sidebar 展开/折叠，无需 JS 动画（transition 即可）
- `.chat-main__content` 既承载消息列表也承载欢迎页，通过条件渲染切换

## Risks / Trade-offs

- **[数据一致性] chrome.storage.local 的并发读写** → 会话操作（创建/删除/更新）使用 async/await 串行化，避免竞态条件。每次操作先读取最新 sessions，修改后写回
- **[性能] 大量会话时的 storage 读写** → 单键存储整个数组，读写是 O(1) 操作。预计用户会话数 < 100，JSON 体积 < 500KB，在可接受范围内
- **[流式中断] 会话切换时后台流式输出的完整性** → 切换会话时保留当前 AbortController 不 abort，流式数据持续写入对应 session 的 messages。切回时 `renderChatMessages` 展示最新状态
- **[API 费用] 自动标题生成消耗额外 API Token** → 标题生成使用极简 prompt（约 100 tokens），每次约 0.001 元成本。降级策略确保即使失败也不影响正常使用
- **[向后兼容] 其他 Tab 不受影响** → `switchTab()` 逻辑不变，仅替换 `#tab-chat` 内部结构。技能系统、请求监控等零改动
