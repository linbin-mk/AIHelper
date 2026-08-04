## Why

当前「AI 聊天」页面中配置入口混在工具栏中，且高级调试选项（如工具调用轮次上限、调试模式）散落在代码中不可配置。需要将配置集中到独立的「设置」页面，并按功能分组管理，同时增加调试模式开关来按需显示调试功能（请求监控 Tab、导出日志按钮），避免普通用户困惑。

## What Changes

- 新增「设置」作为顶部 Tab 导航项
- 将原「AI 聊天」中的模型供应商配置（⚙️ 配置按钮打开的页面）移至「设置 → 供应商」
- 「设置」页面采用左右分栏布局：左侧为设置导航菜单，右侧为内容区域
- 左侧导航包含两个菜单项：「供应商」和「基础配置」
- 「供应商」展示原模型配置表单：API Base URL、API Key、Model Name、Model Type
- 「基础配置」新增：
  - 工具调用最大轮次（MAX_TOOL_ROUNDS）可编辑输入框，默认值 5000
  - 调试模式开关（toggle），默认关闭
  - 黑夜/白天模式开关（toggle），替代原顶部栏主题切换按钮
- 调试模式影响：开启时显示「导出日志」按钮和「请求监控」Tab；关闭时隐藏（仅 `display:none`，不移除 DOM）
- 移除「AI 聊天」工具栏中的 ⚙️ 配置按钮
- 移除顶部栏中的原主题切换按钮（#themeToggleBtn）

## Capabilities

### New Capabilities
- `settings-tab`: 新增设置页面 Tab，包含左右分栏布局及左侧导航
- `provider-config`: 将模型供应商配置（API Base URL、API Key、Model Name、Model Type）从聊天工具栏迁移至设置页面的「供应商」子页面
- `basic-config`: 在设置页面的「基础配置」中提供最大轮次配置、调试模式开关和黑夜/白天模式开关

### Modified Capabilities
<!-- 无现有 spec，无需修改 -->

## Impact

- **HTML**: `panel.html` — 新增设置 Tab 按钮、设置页面 HTML 结构（左右布局 + 导航 + 两个子页面内容）；移除聊天工具栏中的 ⚙️ 配置按钮；移除顶部栏中的原主题切换按钮；#tab-config 元素可移除
- **CSS**: `panel.css` — 新增设置页面左右分栏布局样式、导航菜单样式、子页面切换样式
- **JS**: `panel.js` — 新增设置 Tab 切换逻辑、设置子页面导航切换逻辑、调试模式控制逻辑（根据开关显隐「导出日志」按钮和「请求监控」Tab）
- **JS**: `config.js` — 适配设置页面内的配置表单（表单 DOM 元素引用可能需要调整）；新增基础配置读写（MAX_TOOL_ROUNDS、debugMode），存储到 chrome.storage.local
- **JS**: `chat.js` — `MAX_TOOL_ROUNDS` 从硬编码常量改为从配置读取
