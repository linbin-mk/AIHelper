## 1. HTML 结构调整

- [x] 1.1 在 panel.html 顶部 Tab 栏中新增「设置」Tab 按钮（id="tabSettingsBtn"）
- [x] 1.2 在 panel.html 的 .content 区域新增 `#tab-settings` 的 tab-content 容器，包含左右分栏布局结构（左侧 nav，右侧内容区）
- [x] 1.3 左侧导航栏包含「供应商」（data-section="provider"）和「基础配置」（data-section="basic"）两个菜单项
- [x] 1.4 右侧内容区包含 `#settings-provider` 和 `#settings-basic` 两个子页面容器
- [x] 1.5 将原 `#tab-config` 中的模型配置表单 HTML 迁移到 `#settings-provider` 中，保留所有表单元素 id
- [x] 1.6 在 `#settings-basic` 中添加最大轮次输入框（id="maxToolRounds"）、调试模式开关（id="debugModeToggle"）和黑夜/白天模式开关（id="themeToggle"）
- [x] 1.7 从 AI 聊天工具栏 `.chat-toolbar` 中移除 ⚙️ 配置按钮（#configEntryBtn）
- [x] 1.8 从顶部 `.header` 中移除原主题切换按钮（#themeToggleBtn）
- [x] 1.9 移除已废弃的 `#tab-config` 元素及其内容

## 2. CSS 样式新增

- [x] 2.1 新增设置页面左右分栏布局样式（.settings-layout: flexbox，左侧 .settings-nav 固定宽 140px，右侧 .settings-content flex:1）
- [x] 2.2 新增左侧导航菜单项样式（.settings-nav-item 正常态、active 高亮态、hover 态）
- [x] 2.3 新增 .settings-section 子页面显隐样式（默认 hidden，active 时显示）
- [x] 2.4 新增调试模式开关 toggle 样式（.toggle-switch 滑块外观）
- [x] 2.5 新增基础配置表单字段样式（与现有 .config-field 风格一致）

## 3. 核心 JS 逻辑

- [x] 3.1 在 panel.js 中新增 `tabSettingsBtn` DOM 引用和设置 Tab 切换支持（switchTab 函数增加 'settings' case）
- [x] 3.2 新增 `switchSettingsSection(section)` 函数控制「供应商」/「基础配置」子页面切换和导航高亮
- [x] 3.3 新增 settings 配置读写函数：loadSettings() 和 saveSettings(settings)，存储键 `ai_helper_settings`，字段 `{ maxToolRounds, debugMode }`
- [x] 3.4 新增 `applyDebugMode()` 函数：根据 debugMode 值控制 `#tabMonitorBtn` 和 `#exportChatBtn` 的 display 属性
- [x] 3.5 在页面初始化时调用 loadSettings() 并执行 applyDebugMode()，设置默认值（maxToolRounds=5000, debugMode=false）
- [x] 3.6 修改 `checkConfigAndOpenChat()` 函数：未配置模型时跳转到「设置」Tab 的「供应商」子页面，而非 `#tab-config`
- [x] 3.7 移除 panel.js 中对 #themeToggleBtn 的引用和相关事件处理，主题切换由「基础配置」中的开关接管

## 4. 基础配置绑定与保存

- [x] 4.1 在初始化时从 settings 读取值填入 maxToolRounds 输入框，从 storage 读取主题设置填入 debugModeToggle 和 themeToggle 开关
- [x] 4.2 实现 debugModeToggle 开关 change 事件：实时更新 storage 并调用 applyDebugMode()
- [x] 4.3 实现 themeToggle 开关 change 事件：切换 `html[data-theme]` 属性并更新 storage（复用原 toggleTheme 逻辑）
- [x] 4.4 实现 maxToolRounds 输入框的保存按钮事件：校验正整数，校验通过后写入 storage
- [x] 4.5 实现 maxToolRounds 输入框的校验：非空、正整数的错误提示

## 5. chat.js 适配

- [x] 5.1 将 `MAX_TOOL_ROUNDS` 从硬编码常量改为通过 loadSettings() 动态读取，未配置时回退到 5000
- [x] 5.2 移除 chat.js 中对已删除 DOM 元素 #configEntryBtn 的引用（若无其他用途）

## 6. config.js 适配

- [x] 6.1 确保 config.js 中的 `configSaveBtn` 事件处理在设置页面中正常工作（表单元素 id 不变，无需修改逻辑）
- [x] 6.2 修改 config.js 中保存成功后的跳转：从 `switchTab('chat')` 改为保持在设置页面或跳转到聊天页面（保持原行为）
