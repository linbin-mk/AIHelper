## 1. Phase 1: smart-skill-create 技能定义

### 1.1 创建技能提示词文件
- [x] 1.1.1 创建 `skills/smart-skill-create/skill.cn.md`（YAML front matter + 中文 Markdown prompt）
  - id: smart-skill-create
  - name: 智能技能创建
  - description: 分析用户提供的文本内容，自动提炼并创建技能
  - category: Product
  - prompt 包含：角色定义 → 读取文件 → 分析提炼 → ask_user 交互确认 → create_skill 创建
- [x] 1.1.2 创建 `skills/smart-skill-create/skill.en.md`（英文版本）
- [x] 1.1.3 更新 `skills/skills.json`，在数组末尾添加 `"smart-skill-create"`

### 1.2 同步技能文件
- [x] 1.2.1 运行 `bash sync.sh`，同步技能文件到 `chrome-extension/skills/` 和 `firefox-extension/skills/`

---

## 2. Phase 2: Skill CRUD Tools 注册到 TOOLS

### 2.1 TOOLS 数组新增工具定义
- [x] 2.1.1 在 `shared/chat.js` TOOLS 数组中新增 `create_skill` 工具定义（name/description/parameters：name, description, category, prompt）
- [x] 2.1.2 新增 `update_skill` 工具定义（parameters：skillId + 可选 name/description/category/prompt）
- [x] 2.1.3 新增 `delete_skill` 工具定义（parameters：skillId）

### 2.2 executeToolCall 新增执行逻辑
- [x] 2.2.1 `create_skill` 处理：调用 `registry.createUserSkill(name, description, category, prompt)`，返回 `{ success, skillId, name }`
- [x] 2.2.2 `update_skill` 处理：调用 `registry.update(skillId, { name, description, category, prompt })`，返回 `{ success, skillId }`
- [x] 2.2.3 `delete_skill` 处理：校验 `type !== 'builtin'` 后调用 `registry.unregister(skillId)`，内置技能返回错误

---

## 3. Phase 3: AI 导入 UI — HTML + CSS

### 3.1 panel.html — 按钮
- [x] 3.1.1 在 `skills-create-bar` 的 `skillCreateBtn` 右侧添加「AI导入」按钮 `<button id="aiImportBtn">🤖 AI导入</button>`
- [x] 3.1.2 添加 `data-i18n` 属性支持国际化

### 3.2 panel.html — 悬浮面板
- [x] 3.2.1 新增 `aiImportOverlay` 悬浮遮罩层 + `aiImportPanel` 面板容器
- [x] 3.2.2 面板内包含：
  - 标题栏（"AI 导入技能" + 关闭按钮）
  - 文件选择区（"选择文件" 按钮 + 隐藏的 `<input type="file" multiple" id="aiImportFileInput" accept="...">`）
  - 已选文件列表容器（动态渲染）
  - 底部操作栏（"取消" + "确认导入" 按钮，确认按钮初始 disabled）
- [x] 3.2.3 i18n 属性添加

### 3.3 panel.css — 样式
- [x] 3.3.1 添加 `.ai-import-overlay` 遮罩层样式（复用现有 overlay 模式）
- [x] 3.3.2 添加 `.ai-import-panel` 面板样式（居中、宽度 480px、圆角、阴影）
- [x] 3.3.3 添加 `.ai-import-file-list` 文件列表样式（文件名、大小、移除按钮）
- [x] 3.3.4 添加 `.ai-import-file-item` 单项样式
- [x] 3.3.5 添加 `.ai-import-actions` 底部按钮样式
- [x] 3.3.6 添加 `.ai-import-btn` 按钮样式（与 `skill-create-btn` 风格一致）

---

## 4. Phase 4: AI 导入逻辑 — panel.js

### 4.1 面板交互
- [x] 4.1.1 实现 `showAiImportPanel()` — 清空文件列表 → 显示 overlay → 重置确认按钮状态
- [x] 4.1.2 实现 `hideAiImportPanel()` — 隐藏 overlay
- [x] 4.1.3 绑定「AI导入」按钮点击事件 → `showAiImportPanel()`
- [x] 4.1.4 绑定关闭按钮 / 取消按钮 → `hideAiImportPanel()`

### 4.2 文件选择逻辑
- [x] 4.2.1 绑定「选择文件」按钮 → 触发 `aiImportFileInput.click()`
- [x] 4.2.2 实现 `handleAiImportFileSelect(event)`：
  - 检查已选 + 新选总数 ≤ 5，超出 toast 提示
  - 遍历 files，`isFileTypeAllowed()` 校验类型
  - `FileReader.readAsText()` 读取内容
  - 存入内存数组 `window._aiImportFiles`
  - 调用 `renderAiImportFileList()` 刷新 UI
- [x] 4.2.3 实现 `renderAiImportFileList()` — 渲染文件标签（文件名 + 大小 + 移除按钮）
- [x] 4.2.4 实现 `removeAiImportFile(index)` — 从数组删除 → 重新渲染

### 4.3 确认导入逻辑
- [x] 4.3.1 绑定「确认导入」按钮事件 → `triggerAiImport()`
- [x] 4.3.2 实现 `triggerAiImport()`：
  1. 检查是否有进行中会话，有则 toast 提示
  2. `SessionManager.createSession()` 创建新会话 → sid
  3. 遍历 `_aiImportFiles`，调用 `saveUserFile(sid + '/' + file.name, file.content)`
  4. 构建消息文本（含文件路径列表 + 导入指令）
  5. `switchTab('chat')`
  6. `activateSkill('smart-skill-create')`
  7. `chatInput.value = message`
  8. `sendChatMessage()`
  9. 隐藏 AI 导入面板

### 4.4 初始化绑定
- [x] 4.4.1 在 `init()` 中绑定所有事件监听器

---

## 5. Phase 5: 国际化

### 5.1 i18n keys
- [x] 5.1.1 `shared/i18n.js` 新增以下 key（中/英）：
  - `aiImport.btn` → "AI导入" / "AI Import"
  - `aiImport.title` → "AI 导入技能" / "AI Import Skills"
  - `aiImport.selectFiles` → "选择文本文件（最多5个）" / "Select text files (max 5)"
  - `aiImport.confirm` → "确认导入" / "Confirm Import"
  - `aiImport.cancel` → "取消" / "Cancel"
  - `aiImport.maxFiles` → "最多选择5个文件" / "Maximum 5 files"
  - `aiImport.noFiles` → "请先选择文件" / "Please select files first"
  - `aiImport.sending` → "当前存在进行中的会话，请等待完成" / "An active session exists, please wait"

---

## 6. Phase 6: 同步与验证

### 6.1 同步
- [x] 6.1.1 运行 `bash sync.sh`，确保所有修改同步到 Chrome / Firefox；手动同步 Firefox popup.html/popup.js 的 AI 导入 UI 和逻辑

### 6.2 验证
- [ ] 6.2.1 手动验证 Chrome：
  - 技能 Tab 可见「AI导入」按钮
  - 点击打开悬浮面板，选择文件（含非法类型文件校验）
  - 确认后跳转聊天，消息中正确包含文件路径
  - AI 能通过 `get_user_file` 读取文件
  - AI 通过 `ask_user` 展示技能草案
  - 确认后 `create_skill` 创建成功，技能列表可见
- [ ] 6.2.2 手动验证 Firefox：同上
- [ ] 6.2.3 验证 `delete_skill` 拒绝删除内置技能
- [ ] 6.2.4 验证 `update_skill` 正常更新用户技能字段
