## Context

项目是一个 Chrome 浏览器扩展（Manifest V3）的侧边面板，采用纯 HTML/CSS/JS（无框架）开发。当前有四个顶部 Tab：「AI 聊天」、「技能」、「请求监控」、「资源管理」。AI 聊天工具栏中有 ⚙️ 配置按钮，点击后打开隐藏的 `#tab-config` 页面（包含 API Base URL、API Key、Model Name、Model Type 表单）。`MAX_TOOL_ROUNDS = 5000` 硬编码在 chat.js 中。调试功能（导出日志按钮、请求监控 Tab）始终可见。

## Goals / Non-Goals

**Goals:**
- 新增「设置」Tab，统一管理所有用户配置
- 「设置」采用左右分栏布局，左侧为可切换的导航菜单，右侧为内容区域
- 「供应商」子页面承载原模型配置表单功能
- 「基础配置」子页面提供最大轮次、调试模式开关和黑夜/白天模式开关（替代原顶部栏主题切换按钮）
- 调试模式控制「导出日志」按钮和「请求监控」Tab 的显隐
- 所有配置持久化到 `chrome.storage.local`

**Non-Goals:**
- 不改变现有配置表单的验证逻辑和保存行为
- 不调整「请求监控」Tab 内部功能
- 不改变「导出日志」的导出逻辑
- 不改变主题切换的核心逻辑（仅迁移触发控件位置）
- 不移除 DOM 元素，仅通过 CSS `display` 属性控制显隐

## Decisions

### 1. 设置页面左右分栏布局

**选择**: 纯 CSS Flexbox 实现，左侧固定宽度 140px，右侧自适应 flex:1。

**理由**: 不引入第三方框架，保持与现有代码一致的 vanilla 方案。Flexbox 简单可靠，Chrome 侧边栏无需考虑旧浏览器兼容。

### 2. 配置存储方案

**选择**: 扩展现有 `chrome.storage.local` 键模式。新增键 `ai_helper_settings` 存储基础配置（`maxToolRounds`、`debugMode`），与现有 `ai_helper_model_config` 分离。

**理由**: 模型配置和基础设置分属不同关注点，独立键避免读写冲突，且不破坏现有 `config.js` 的数据结构。

### 3. 调试模式控制显隐

**选择**: 通过 CSS class 或 `style.display` 控制「导出日志」按钮和「请求监控」Tab 的显示/隐藏，DOM 元素始终存在。

**理由**: 简单直接，不涉及 DOM 增删。开关变化时实时更新 UI，页面初始化时从存储读取状态。

### 4. MAX_TOOL_ROUNDS 从硬编码改为可配置

**选择**: 在 chat.js 中通过 `loadSettings()` 函数读取 `maxToolRounds`，若未配置则回退到默认值 5000。

**理由**: 保持向后兼容，存储中无值时使用硬编码默认值，不影响现有行为。

### 5. 导航子页面切换

**选择**: 复用现有的 `switchTab` 模式，设置页面内部用独立的 `switchSettingsSection` 函数控制「供应商」和「基础配置」两个子页面显隐。

**理由**: 与现有代码风格一致，降低学习成本。

## Risks / Trade-offs

- [Risk] 用户未配置模型就进入 AI 聊天时，原有逻辑会重定向到配置页面。迁移后需确保该逻辑正确跳转到「设置 → 供应商」 → 中等风险，通过修改 `checkConfigAndOpenChat` 函数的跳转目标来缓解。
- [Trade-off] 左边导航栏固定宽度在小窗口下可能挤压内容区域 → 权衡后保持 140px，Chrome 侧边栏最小宽度足够。
