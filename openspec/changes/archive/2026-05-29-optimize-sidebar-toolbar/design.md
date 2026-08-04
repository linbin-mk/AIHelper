## Context

当前项目是 Chrome Extension Manifest V3 Side Panel，使用 Catppuccin 主题（CSS 变量），无框架。侧边栏布局为：

```
.chat-sidebar
  .chat-sidebar__header     ← 新建按钮 + 搜索框
  .chat-sidebar__list        ← 会话列表
  .chat-sidebar__footer      ← 模型信息
.chat-main
  .chat-main__toolbar        ← 折叠按钮 + 会话标题 (padding: 6px 10px, 含按钮高度约 34px)
  .chat-main__content
  .chat-input-area
```

当前侧边栏折叠态为 `display: none`，无视觉残留。折叠/展开通过 `chat-main__toolbar` 的 `#sidebarToggleBtn` 触发。

用户参考样式来自 DeepSeek 工具栏 (`deepseek-toolbar (2).html`)：白色圆角胶囊容器 (border-radius: 100px)、内含 3 个图标按钮（侧边栏/搜索/添加）、hover 淡入淡出、focus 蓝色边框。

## Goals / Non-Goals

**Goals:**
- 在 `chat-sidebar__header` 上方新增 `.chat-sidebar__toolbar`，高度与 `chat-main__toolbar` 对齐
- 侧边栏展开时工具栏显示：AIHelper 文字 + 搜索放大镜按钮 + 折叠按钮
- 侧边栏收起时显示胶囊浮动按钮（3 个图标：展开侧边栏、搜索、新建会话）
- 点击搜索按钮：展开侧边栏 → 搜索框颜色闪烁 3 次
- 移除 `chat-main__toolbar` 中冗余的侧边栏切换按钮

**Non-Goals:**
- 不改变 `SessionManager` 的接口或实现
- 不影响会话列表渲染、时间分组、批量删除等现有功能
- 不改变侧边栏折叠状态的持久化逻辑（`SessionManager.setSidebarCollapsed`）
- 不引入框架或第三方库

## Decisions

### 1. HTML 结构调整

在 `chat-sidebar__header` 上方插入一行工具栏：

```html
<div class="chat-sidebar__toolbar">
  <span class="sidebar-toolbar__brand">AIHelper</span>
  <button class="sidebar-toolbar__search-btn" title="搜索会话">
    <svg><!-- 搜索图标 --></svg>
  </button>
  <button class="sidebar-toolbar__collapse-btn" title="收起侧边栏">
    <svg><!-- 折叠图标 --></svg>
  </button>
</div>
```

**理由：** 直接在侧边栏内放置工具栏，仅在侧边栏展开时可见，天然满足「收起时隐藏」的需求。

### 2. 胶囊浮动按钮

在 `chat-layout` 或 `tab-chat` 下新增胶囊容器，用 `position: absolute` 定位在侧边栏收起时的位置：

```html
<div class="sidebar-capsule" id="sidebarCapsule">
  <div class="sidebar-capsule__inner">
    <button class="capsule-btn" data-action="expand" title="展开侧边栏">
      <svg><!-- 侧边栏图标 --></svg>
    </button>
    <button class="capsule-btn" data-action="search" title="搜索会话">
      <svg><!-- 搜索图标 --></svg>
    </button>
    <button class="capsule-btn" data-action="new-session" title="新建会话">
      <svg><!-- 添加图标 --></svg>
    </button>
  </div>
</div>
```

**CSS 设计：**
```css
.sidebar-capsule {
  display: none;
  position: absolute;
  left: 8px;
  top: 8px;
  z-index: 10;
}

.sidebar-capsule--visible {
  display: block;
}

.sidebar-capsule__inner {
  display: flex;
  align-items: center;
  gap: 2px;
  height: 40px;
  padding: 0 3px;
  border: 1px solid var(--ctp-surface0);
  border-radius: 100px;
  background: var(--ctp-mantle);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.capsule-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--ctp-subtext0);
  cursor: pointer;
  transition: background 0.2s ease;
}

.capsule-btn:hover {
  background: var(--ctp-surface0);
}
```

**理由：**
- 使用项目已有 Catppuccin 配色（`--ctp-mantle`, `--ctp-surface0`, `--ctp-subtext0`）保持视觉一致
- `border-radius: 100px` 胶囊造型参考 DeepSeek 设计
- `position: absolute` 不占文档流，不影响聊天区布局
- 胶囊仅在侧边栏折叠时显示（`sidebar-capsule--visible`），展开时隐藏

### 3. 显示逻辑

| 状态 | `.chat-sidebar` | `.chat-sidebar__toolbar` | `.sidebar-capsule` |
|------|----------------|--------------------------|---------------------|
| 侧边栏展开 | `display: flex` | 可见 | `display: none` |
| 侧边栏收起 | `display: none` | 跟随侧边栏隐藏 | `display: block` |

**JS 逻辑：**
```javascript
function toggleSidebar() {
  var sidebar = document.getElementById('chatSidebar');
  var capsule = document.getElementById('sidebarCapsule');
  if (!sidebar) return;
  var collapsed = sidebar.classList.toggle('chat-sidebar--collapsed');
  if (capsule) capsule.classList.toggle('sidebar-capsule--visible', collapsed);
  SessionManager.setSidebarCollapsed(collapsed);
}
```

### 4. 搜索闪烁动画

```css
@keyframes search-flash {
  0%, 100% { border-color: var(--ctp-surface1); background: var(--ctp-crust); }
  50% { border-color: var(--ctp-blue); background: var(--ctp-surface0); }
}

.sidebar-search-input--flash {
  animation: search-flash 0.4s ease 3;
}
```

**JS 逻辑：**
```javascript
function flashSearchInput() {
  var sidebar = document.getElementById('chatSidebar');
  var capsule = document.getElementById('sidebarCapsule');
  var input = document.getElementById('sessionSearchInput');

  // 1. 展开侧边栏（若收起）
  if (sidebar && sidebar.classList.contains('chat-sidebar--collapsed')) {
    toggleSidebar();
  }

  // 2. 输入框获取焦点并闪烁
  if (input) {
    input.focus();
    input.classList.add('sidebar-search-input--flash');
    // 动画时长 0.4s × 3 = 1.2s，之后移除 class
    setTimeout(function() {
      input.classList.remove('sidebar-search-input--flash');
    }, 1300);
  }
}
```

### 5. 移除 `chat-main__toolbar` 中的折叠按钮

`chat-main__toolbar` 中移除 `#sidebarToggleBtn`，保留 `#sessionTitleDisplay`。折叠功能统一由侧边栏工具栏的 `.sidebar-toolbar__collapse-btn` 和胶囊按钮处理。

**理由：** 遵循单一入口原则，避免两个折叠按钮状态不一致。用户始终通过侧边栏区域（展开时工具栏、收起时胶囊）控制侧边栏显示/隐藏。

### 6. 工具栏高度对齐

`.chat-main__toolbar` 当前 `padding: 6px 10px`，内部按钮高度 ≈ 34px（SVG 14px + padding）。工具栏行高约为 `6 + 34 + 6 = 46px`。

`.chat-sidebar__toolbar` 需要相同的视觉高度：
```css
.chat-sidebar__toolbar {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-bottom: 1px solid var(--ctp-surface0);
  flex-shrink: 0;
  height: 46px;
  box-sizing: border-box;
}
```

## Risks / Trade-offs

- **胶囊绝对定位可能遮挡内容** — 定位在 sidebar 区域，侧边栏收起后该区域空出，不遮挡聊天区。若侧边栏区域被设为 `display: none`，胶囊需放在 `chat-layout` 层级而非 sidebar 内。
- **侧边栏折叠后侧边栏 `display: none` 导致胶囊无承载容器** → 胶囊作为 `.chat-layout` 的直接子元素，或放在 `tab-chat` 层级下，脱离 sidebar DOM 树，通过 CSS 类控制显隐。
- **搜索闪烁动画可能因浏览器限制被跳过** → 使用 `@keyframes` CSS 动画而非 JS `setInterval`，性能更好且更可靠。
