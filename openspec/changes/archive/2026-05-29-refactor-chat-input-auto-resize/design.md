## Context

当前 `chatInput` textarea 的高度自适应是纯 JS 方案：
- `measureChatInputHeight()`: 初始化时将 height 设为 `auto`，读取 `scrollHeight` 作为基准 `minHeight`，`maxHeight = 4 × minHeight`
- `autoResizeChatInput()`: 登录 `input` 事件，每次输入时 height → `auto` → 读 `scrollHeight` → clamp 到 `[minHeight, maxHeight]`
- `resetChatInputHeight()`: 发送后恢复为 `minHeight`
- `MutationObserver`: 监听 `<html data-theme>` 变化，触发 re-measure（主题切换可能改变字体大小，影响 `scrollHeight`）

Chrome 从 M123 开始稳定支持 `field-sizing: content`，该属性让 textarea 自动根据内容撑开高度，无需 JS 干预。

本项目是 Chrome 插件（MV3），运行环境为 Chromium 内核浏览器，无需考虑非 Chromium 兼容性。天然适合 `field-sizing` progressive enhancement。

## Goals / Non-Goals

**Goals:**
- 用 `field-sizing: content` 作为主要 auto-resize 机制（占绝大多数用户）
- 保留极简 JS fallback（`CSS.supports` 检测），覆盖不支持 `field-sizing` 的环境
- 删除 `MutationObserver` 主题监听、`measureChatInputHeight()`、`resetChatInputHeight()` 的显式高度操作
- 删除 `.scrollable` 类及所有相关 toggle 逻辑（`overflow-y: auto` 已使其冗余）
- 保持所有现有行为：自动增高、4 行上限、发送后重置、滚动条、禁用态

**Non-Goals:**
- 不改变 `chat-input-autoresize` spec 的任何需求
- 不改变 Enter/Shift+Enter 快捷键行为
- 不改变发送中禁用逻辑(`_chatInputEl.disabled`)

## Decisions

### Decision 1: CSS-first (`field-sizing: content`) + JS fallback

**选择**: `field-sizing: content` 为主，`CSS.supports` 检测后按需挂载 fallback。

**替代方案**:
- **纯 JS 维持现状**: 保留 observer + measure + reset，不引入新依赖。优点是零风险，缺点是不利用新能力，observer 有隐性开销。
- **纯 CSS，删除所有 JS**: 风险太高。`field-sizing` 在极端输入（粘贴大量文本、IME 输入、emoji）下的行为还未经过充分验证，且发送后 reset 的实现不直观。
- **CSS-first + fallback (采纳)**: 兼顾新能力与可靠性。大多数路径走 CSS，fallback 作为安全网。

**理由**: Chrome 插件运行环境可控，`field-sizing` 覆盖率高；但 `input` 交互是高频场景，保留 fallback 是 defensive programming 的合理实践。

### Decision 2: max-height 用 CSS 自定义属性计算

**选择**: 使用 CSS 自定义属性 + `calc()` 表达 4 行上限，不写死像素值。

```css
.chat-input {
  --chat-font-size: 13px;
  --chat-line-height: 1.4;
  --chat-max-rows: 4;
  --chat-padding-v: 16px;    /* 上下 padding 之和 */

  min-height: calc(var(--chat-font-size) * var(--chat-line-height) + var(--chat-padding-v));
  max-height: calc(var(--chat-font-size) * var(--chat-line-height) * var(--chat-max-rows) + var(--chat-padding-v));
}
```

**替代方案**: 硬编码 `max-height: 120px`。简单但脆弱——font-size、line-height、padding、zoom 任一变化都会破坏关系。

**理由**: CSS 自定义属性让设计意图自我文档化。`calc()` 自动适应任何 `font-size` / `line-height` 变化，主题切换时无需 JS 干预，也彻底消除了观测 `data-theme` 的需求。这是一个无需 observer、无需 JS、但可维护的设计。

### Decision 3: 彻底删除 `.scrollable` 类

**选择**: 移除 `.chat-input.scrollable` 规则及其所有 JS toggle 逻辑。`.chat-input` 直接设 `overflow-y: auto`。

**理由**: `overflow-y: auto` 本身已在内容超出 `max-height` 时自动显示滚动条、不足时隐藏。`.scrollable` 状态类变成了冗余的状态机，形成 "CSS 是 auto + JS 又 toggle class" 的双轨控制，这是典型的 UI complexity regression。彻底删除简化状态管理。

### Decision 4: 能力检测冻结为模块级常量

**选择**: 将 `field-sizing` 支持检测冻结为模块级 `const`，不在运行时重复判断。

```js
const SUPPORTS_FIELD_SIZING = CSS.supports('field-sizing', 'content');
if (!SUPPORTS_FIELD_SIZING) {
  chatInputEl.addEventListener('input', autoResizeChatInput);
}
```

**理由**: capability 是静态环境属性，不是 runtime state。`input` 事件频率极高，每次触发时做 `CSS.supports()` 检查是纯粹的浪费。初始化阶段冻结、一次判断、永不重复。

## Risks / Trade-offs

- **[Risk] `field-sizing` 在大量粘贴或 IME 组合输入时行为不一致** → 影响面小（Chrome 插件，单用户），且 fallback 路径存在
- **[Risk] `overflow-y: auto` + `field-sizing` 交互可能有视觉抖动** → 默认 `overflow-y: auto` 确保滚动条按需出现；使用 `scrollbar-gutter: stable` 预留滚动条空间
- **[Trade-off] max-height 用 `calc()` 而非动态测量** → CSS 自定义属性表达的 max-height 精确性与浏览器 `scrollHeight` 可能存在亚像素偏差（±1px），但对 chat 输入框体验影响可忽略

## Open Questions

无。方案足够明确。
