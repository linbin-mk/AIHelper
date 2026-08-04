## 1. HTML 结构 — panel.html

- [x] 1.1 在 `chat-sidebar__header` 上方新增 `.chat-sidebar__toolbar` 区域，包含 AIHelper 品牌文字 + 搜索按钮（`#sidebarSearchBtn`）+ 折叠按钮（`#sidebarCollapseBtn`）
- [x] 1.2 搜索按钮和折叠按钮使用 SVG 图标（和内联样式一致的 16×16 SVG）
- [x] 1.3 在 `chat-layout` 下新增胶囊容器 `#sidebarCapsule`（`position: absolute` 定位在左上角），内含 3 个按钮（展开侧边栏 `data-action="expand"`、搜索 `data-action="search"`、新建会话 `data-action="new-session"`）
- [x] 1.4 胶囊按钮使用与 DeepSeek 参考样式一致的 SVG 图标（侧边栏/搜索/添加三个 SVG path）
- [x] 1.5 移除 `chat-main__toolbar` 中的 `#sidebarToggleBtn`，保留 `#sessionTitleDisplay`

## 2. CSS 样式 — panel.css

- [x] 2.1 新增 `.chat-sidebar__toolbar` 样式：flex 布局、高度与 `.chat-main__toolbar` 对齐（约 46px）、border-bottom 分隔线
- [x] 2.2 新增 `.sidebar-toolbar__brand` 样式：字体大小 13px、font-weight 600、颜色 `--ctp-text`
- [x] 2.3 新增 `.sidebar-toolbar__search-btn` 和 `.sidebar-toolbar__collapse-btn` 样式：圆形按钮、hover 背景色 `--ctp-surface0`
- [x] 2.4 新增 `#sidebarCapsule` 胶囊容器样式：默认 `display: none`、`position: absolute`（left: 8px, top: 8px, z-index: 10）
- [x] 2.5 新增 `.sidebar-capsule--visible` 样式：`display: block`
- [x] 2.6 新增 `.sidebar-capsule__inner` 胶囊内部样式：flex 布局、`border-radius: 100px`、背景 `--ctp-mantle`、边框 `--ctp-surface0`、box-shadow、高度 40px、padding
- [x] 2.7 新增 `.capsule-btn` 样式：34×34px、border-radius 8px、透明背景、图标居中、`--ctp-subtext0` 颜色、hover 显示 `--ctp-surface0` 背景（0.2s ease 过渡）
- [x] 2.8 新增 `.capsule-btn svg` 样式：16×16px、`fill: currentColor`
- [x] 2.9 新增 `@keyframes search-flash` 闪烁动画：0%/100% 默认边框色，50% 使用 `--ctp-blue` 边框色和 `--ctp-surface0` 背景
- [x] 2.10 新增 `.sidebar-search-input--flash` 动画调用：`animation: search-flash 0.4s ease 3`

## 3. JS 交互逻辑 — panel.js

- [x] 3.1 修改 `toggleSidebar()` 函数：同步控制 `#sidebarCapsule` 的 `sidebar-capsule--visible` class（收起时添加，展开时移除）
- [x] 3.2 修改 `initChatView()`：根据侧边栏折叠状态初始化胶囊显隐
- [x] 3.3 新增 `flashSearchInput()` 函数：展开侧边栏（若收起）→ 聚焦搜索框 → 添加 `sidebar-search-input--flash` class → 1.3 秒后移除 class
- [x] 3.4 在 `initChatEvents()` 中新增事件绑定：`#sidebarSearchBtn` / `#sidebarCollapseBtn` / 胶囊各按钮的点击事件
- [x] 3.5 胶囊「展开」按钮 (`data-action="expand"`) 点击 → 调用 `toggleSidebar()`
- [x] 3.6 胶囊「搜索」按钮 (`data-action="search"`) 点击 → 调用 `flashSearchInput()`
- [x] 3.7 胶囊「新建」按钮 (`data-action="new-session"`) 点击 → 展开侧边栏 → 调用 `createNewSessionAndShow()`
- [x] 3.8 侧边栏工具栏搜索按钮 (`#sidebarSearchBtn`) 点击 → 调用 `flashSearchInput()`
- [x] 3.9 侧边栏工具栏折叠按钮 (`#sidebarCollapseBtn`) 点击 → 调用 `toggleSidebar()`

## 4. 验证

- [x] 4.1 验证侧边栏展开时工具栏正确显示（品牌名 + 搜索按钮 + 折叠按钮），工具栏高度与 `chat-main__toolbar` 一致
- [x] 4.2 验证侧边栏收起时胶囊按钮出现，样式与 DeepSeek 参考一致（圆角胶囊、hover 效果、3 个图标）
- [x] 4.3 验证点击胶囊搜索按钮：侧边栏展开 + 搜索框聚焦 + 边框闪烁 3 次
- [x] 4.4 验证点击胶囊展开按钮：侧边栏展开，胶囊隐藏
- [x] 4.5 验证点击胶囊新建按钮：侧边栏展开 + 跳转欢迎页 + 胶囊隐藏
- [x] 4.6 验证侧边栏工具栏搜索按钮：搜索框聚焦并闪烁
- [x] 4.7 验证侧边栏工具栏折叠按钮：侧边栏收起，胶囊出现
- [x] 4.8 验证折叠状态持久化：刷新后折叠/展开状态恢复，胶囊显隐正确
- [x] 4.9 验证 `chat-main__toolbar` 中侧边栏切换按钮已移除
- [x] 4.10 验证原有功能不受影响：会话切换、搜索过滤、新建会话、右键菜单、批量删除
