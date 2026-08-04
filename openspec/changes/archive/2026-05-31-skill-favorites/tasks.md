## 1. 数据层与国际化

- [x] 1.1 在 `panel.js` 中实现收藏数据管理函数：`loadFavorites()` 从 `chrome.storage.local` 读取 `ai_helper_skill_favorites` 键
- [x] 1.2 实现 `saveFavorites(data)` 写入 `chrome.storage.local`
- [x] 1.3 实现 `generateUUID()` 辅助函数生成收藏夹唯一标识
- [x] 1.4 在 `i18n.js` 中补充收藏功能相关翻译键（中文+英文）

## 2. HTML 结构

- [x] 2.1 在 `panel.html` 的 `#tab-skills` 顶部添加收藏卡容器 `#favoritesContainer`
- [x] 2.2 在 `panel.html` 中添加技能右键收藏菜单 `#skillContextMenu`（含"收藏"选项）
- [x] 2.3 在 `panel.html` 中添加收藏卡右键菜单 `#favoriteCardContextMenu`（含"删除收藏卡"选项）
- [x] 2.4 在 `panel.html` 中添加收藏夹选择悬浮框 `#favoriteCollectionPopup`（含收藏夹列表、新建按钮、重命名功能）

## 3. CSS 样式

- [x] 3.1 在 `panel.css` 中添加收藏卡样式（`.favorites-container`、`.favorite-card`、`.favorite-card-header`、`.favorite-card-title`、`.favorite-card-skills`）
- [x] 3.2 添加收藏卡名称编辑输入框样式
- [x] 3.3 添加收藏夹选择悬浮框样式（遮罩层 `.favorite-overlay`、弹窗 `.favorite-popup`、列表项、新建按钮、重命名输入框）
- [x] 3.4 复用现有上下文菜单样式，微调确保收藏相关菜单视觉效果一致

## 4. 交互逻辑 — 右键收藏菜单与悬浮框

- [x] 4.1 在 `panel.js` 中为技能行绑定 `contextmenu` 事件，阻止默认行为并显示 `#skillContextMenu`
- [x] 4.2 实现菜单定位逻辑（根据鼠标位置计算菜单位置，避免溢出视口）
- [x] 4.3 实现点击菜单外区域关闭菜单的逻辑
- [x] 4.4 实现"收藏"菜单项点击：若无收藏夹则自动创建默认收藏夹并添加技能；若有收藏夹则弹出 `#favoriteCollectionPopup`
- [x] 4.5 实现悬浮框内收藏夹列表渲染（名称、技能数量、编辑图标）
- [x] 4.6 实现点击收藏夹选择：将当前技能添加到该收藏夹并关闭悬浮框
- [x] 4.7 实现新建收藏夹功能：创建默认命名的新收藏夹、自动添加技能、关闭悬浮框
- [x] 4.8 实现悬浮框内重命名功能：编辑图标点击切换为输入框、Enter 保存、Escape 取消、空值校验

## 5. 交互逻辑 — 收藏卡展示与管理

- [x] 5.1 实现 `renderFavorites()` 函数：从数据层读取收藏夹数组，在 `#favoritesContainer` 中渲染收藏卡
- [x] 5.2 收藏卡内容渲染：根据 `skillIds` 从 `SkillRegistry` 查找技能名称并展示
- [x] 5.3 实现点击收藏卡中技能名称跳转激活技能（调用现有 `useSkill` 或切换聊天 Tab）
- [x] 5.4 实现收藏卡名称单击编辑：切换为输入框、Enter/失焦保存、空值回退
- [x] 5.5 实现收藏卡右键菜单：显示"删除收藏卡"选项，确认后删除该收藏夹并刷新页面
- [x] 5.6 确保每次收藏数据变更后自动调用 `renderFavorites()` 刷新视图

## 6. 集成与测试

- [x] 6.1 在 `switchTab('skills')` 和页面初始化时调用 `renderFavorites()` 展示收藏卡
- [x] 6.2 处理边界情况：技能从 `SkillRegistry` 中移除时，收藏卡中忽略不存在的 `skillIds`
- [x] 6.3 处理边界情况：同一技能重复收藏到同一收藏夹时去重（静默忽略）
- [x] 6.4 处理边界情况：从收藏卡中移除技能（右键收藏卡中的技能项 → "取消收藏"）
- [x] 6.5 验证国际化文本在语言切换后正确更新
- [x] 6.6 验证数据在关闭/重新打开面板后正确恢复
