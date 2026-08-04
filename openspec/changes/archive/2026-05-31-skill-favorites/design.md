## Context

当前技能页面（`#tab-skills`）按分类分组展示所有技能，用户通过点击技能行打开详情弹窗后点击"使用"按钮来激活技能。技能列表不区分常用/非常用，所有技能平铺展示。会话已有右键菜单实现（`.context-menu`），可作为技术参考。

项目为 Chrome Extension Manifest V3，使用纯 HTML/CSS/JS（无框架），技能数据由 `SkillRegistry` 管理，用户配置持久化到 `chrome.storage.local`。

## Goals / Non-Goals

**Goals:**
- 用户可右键技能行弹出上下文菜单，选择"收藏"
- 点击"收藏"后弹出悬浮框，选择已有收藏夹或新建收藏夹
- 收藏夹支持重命名
- 收藏卡展示在技能页面顶部，包含收藏夹名称和技能列表
- 点击收藏卡名称可编辑名称
- 一个用户可拥有多张收藏卡
- 收藏数据通过 `chrome.storage.local` 持久化

**Non-Goals:**
- 不改变技能激活流程
- 不修改 `SkillRegistry` 核心逻辑
- 不修改技能文件或 manifest.json
- 不支持收藏夹拖拽排序（首版）

## Decisions

### 1. 数据模型：收藏夹数组存储到 chrome.storage.local

**选择**：使用单一键 `ai_helper_skill_favorites` 存储收藏夹数组。

```js
// 数据结构
[
  {
    id: "uuid-v4",           // 唯一标识
    name: "收藏",            // 收藏夹名称
    skillIds: ["code-master", "frontend-copy-master"],  // 技能ID列表
    createdAt: 1700000000000  // 创建时间戳
  }
]
```

**理由**：`chrome.storage.local` 已在项目中使用（设置、主题、语言），兼容性好；数组结构简单直观，方便渲染和查询。每个收藏夹一个 UUID 便于重命名和删除时精确定位。

**备选方案**：IndexedDB — 功能过剩，对于简单数组数据引入复杂性不必要。

### 2. UI 组件策略：纯 DOM 操作

**选择**：使用 `document.createElement` 动态构建收藏卡 HTML 和悬浮框，不引入 UI 框架。

**理由**：项目当前无前端框架，保持一致性；收藏卡和悬浮框交互简单，原生 DOM 操作足够。

### 3. 右键菜单复用

**选择**：复用现有 `.context-menu` 风格，为技能右键单独创建菜单实例，添加"收藏"菜单项。

**理由**：会话右键菜单已有成熟的样式和定位逻辑，复用可减少 CSS 重复。技能右键菜单需要在点击"收藏"后弹出二级悬浮框，与会话菜单的行为不同，因此需独立的菜单实例。

### 4. 悬浮框设计：模态对话框

**选择**：参考现有 `.skill-detail-overlay` 的遮罩+弹窗模式，创建独立的收藏夹选择悬浮框。

**理由**：保持 UI 一致性；遮罩层阻止背景交互，确保用户完成收藏夹选择后再继续。

## Risks / Trade-offs

- **[存储容量]** `chrome.storage.local` 有 10MB 限制（扩展未设置 `unlimitedStorage` 权限）。收藏数据量极小（数组元素数十个），无风险。
- **[右键事件冲突]** 技能行已有 `click` 事件（打开详情弹窗），需确保 `contextmenu` 事件不触发 `click`。方案：在 `contextmenu` 事件处理中调用 `e.preventDefault()` 并在全局添加 `click` 事件捕获判断菜单是否刚关闭。
- **[性能]** 收藏卡渲染在每次打开技能 Tab 时执行，数据量极小，无性能风险。
