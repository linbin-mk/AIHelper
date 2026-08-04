## Why

当前侧边栏顶部区域 (`chat-sidebar__header`) 信息密度低，仅有「新建会话」按钮和搜索框。侧边栏折叠后缺乏品牌标识和快速入口，用户需要先展开侧边栏再操作搜索，交互路径过长。同时在聊天主区工具栏缺乏搜索功能的快捷入口。

## What Changes

- 在 `chat-sidebar__header` 上方新增 `.chat-sidebar__toolbar` 区域，高度与 `chat-main__toolbar` 对齐
- 侧边栏展开时显示：应用名称 "AIHelper" + 搜索放大镜按钮 + 折叠侧边栏按钮
- 侧边栏收起时显示：一颗胶囊形态浮动按钮（参考 DeepSeek 风格），包含侧边栏展开、搜索、新建会话三个图标按钮
- 点击搜索放大镜：先展开侧边栏（若已收起），然后对搜索框做短时间颜色闪烁动画
- 移除 `chat-main__toolbar` 中冗余的侧边栏折叠按钮（折叠操作统一到胶囊/侧边栏工具栏）

## Capabilities

### New Capabilities
- `sidebar-capsule-toolbar`: 侧边栏收起时渲染胶囊形态浮动按钮，侧边栏展开时隐藏胶囊，统一管理侧边栏折叠/展开的视觉入口

### Modified Capabilities
- `chat-sidebar-layout`: 侧边栏头部结构调整 — 新增 `.chat-sidebar__toolbar` 区域，修改折叠态行为（收起时隐藏侧边栏改为 display: none 侧边栏本体，胶囊按钮作为视觉替代）
- `multi-session-management`: 搜索交互调整 — 点击搜索按钮时触发侧边栏展开并闪烁搜索框，替代原来需要手动展开侧边栏再点击搜索框的流程

## Impact

- 影响文件: `chrome-extension/src/panel/panel.html`（侧边栏和胶囊 HTML 结构）、`chrome-extension/src/panel/panel.css`（新增约 120+ 行样式）、`chrome-extension/src/panel/panel.js`（新增胶囊交互和搜索闪烁逻辑）
- 无 API 或依赖变更
- 不影响现有会话管理、聊天消息、技能等核心功能
- 向后兼容：侧边栏折叠状态持久化逻辑不变
