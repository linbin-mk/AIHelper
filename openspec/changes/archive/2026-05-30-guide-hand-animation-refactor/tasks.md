## 1. 搜索引导动画替换

- [x] 1.1 修改 `flashSearchInput()` — 移除 CSS 闪烁逻辑，改为展开侧边栏后延迟调用 `showSearchGuide()`
- [x] 1.2 在 CSS 中移除 `sidebar-search-input--flash` 类和 `@keyframes search-flash`

## 2. 引导手指工具函数抽离

- [x] 2.1 实现 `showGuideHand(opts)` 通用工具函数（接受 emoji、left、top、cssClass）
- [x] 2.2 将 `showSendGuide()` 简化为 `showGuideHand()` 包装调用
- [x] 2.3 将 `showSearchGuide()` 简化为 `showGuideHand()` 包装调用

## 3. CSS 统一重构

- [x] 3.1 新增 `.guide-hand` 基础类（通用固定定位、字号、淡出动画）
- [x] 3.2 新增 `.guide-hand--bounce-y` 和 `.guide-hand--bounce-x` 方向修饰器
- [x] 3.3 移除旧的 `.send-guide-hand` 和 `.search-guide-hand` 样式
- [x] 3.4 移除旧的 `@keyframes sendGuideBounce`、`@keyframes sendGuideFadeOut`、`@keyframes searchGuideBounce`、`@keyframes searchGuideFadeOut`
- [x] 3.5 新增统一的 `@keyframes guideBounceY`、`@keyframes guideBounceX`、`@keyframes guideFadeOut`

## 4. 验证

- [x] 4.1 点击推荐卡片验证发送按钮上方 👇 手指引导正常
- [x] 4.2 点击胶囊搜索按钮验证搜索框右侧 👈 手指引导正常
- [x] 4.3 点击工具栏放大镜按钮验证搜索框右侧 👈 手指引导正常
