## Context

当前两个引导动画各自独立实现：`showSendGuide()` 在发送按钮上方创建 👇 元素，`showSearchGuide()` 在搜索框旁创建 👈 元素。两者代码高度重复（创建 span → 设样式 → 设位置 → setTimeout 移除）。此外搜索框还有一套独立的 CSS 闪烁动画（`sidebar-search-input--flash`、`@keyframes search-flash`）。

统一为 `showGuideHand(opts)` 工具函数可消除重复代码，同时让未来新增引导动画变得简单。

## Goals / Non-Goals

**Goals:**
- 提供 `showGuideHand(opts)` 统一入口，接受 emoji、坐标、方向动画类
- 移除旧的 `sidebar-search-input--flash` CSS 和 `@keyframes search-flash`
- CSS 统一为 `.guide-hand` 基础类 + 方向修饰器

**Non-Goals:**
- 不改变动画时长、大小等视觉参数
- 不改变引导手指的触发时机和条件

## Decisions

### 1. `showGuideHand(opts)` 接口设计

**决定**: 使用 options 对象（`emoji`, `left`, `top`, `cssClass`），时长固定 3500ms。

**理由**: options 模式比多参数可读性更好，扩展性强。时长固定是因为当前两个场景都使用相同时长，暂不需要参数化。

### 2. CSS 类命名：`.guide-hand` + 修饰器

**决定**: 基础类 `.guide-hand` 包含通用样式（`position: fixed`、`font-size`、`pointer-events`等），方向通过 `.guide-hand--bounce-y` / `.guide-hand--bounce-x` 添加组合动画。

**理由**: BEM 修饰器模式，一个基础类加方向后缀，清晰区分行为差异。

### 3. 搜索闪烁替换为手指引导

**决定**: 将 `flashSearchInput` 中的 CSS class 闪烁替换为 `showSearchGuide()` 调用。侧边栏展开后延迟 350ms（等待展开动画）再显示手指。

**理由**: 手指动画比闪烁更醒目，且风格与发送按钮引导统一。

## Risks / Trade-offs

- [侧边栏展开动画与手指定位时序] → 延迟 350ms 等待侧边栏展开动画完成后再计算位置
- [手指可能在滚动或窗口调整后位置错位] → 动画仅持续 3 秒，短期错位可接受
