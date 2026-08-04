## 1. Content Script — 页面导航扫描与功能捕获

- [x] 1.1 创建 `chrome-extension/src/content/outline-scanner.js`，实现双模式（scan/capture）入口逻辑，通过 `window.__OUTLINE_MODE` 变量控制模式
- [x] 1.2 实现 Scan 模式：按优先级链识别导航菜单（nav 标签 → role="navigation" → 已知 CSS class → 回退策略），返回导航项列表，每个项包含 text/href/selector/type，支持 `maxItems` 数量截断
- [x] 1.3 实现 Capture 模式：提取页面功能摘要（title、h1-h3 headings、可见操作按钮/链接、表单描述），过滤导航/页脚等副作用元素
- [x] 1.4 实现消息通信：Scan 结果发 `OUTLINE_SCAN_RESULT`，Capture 结果发 `OUTLINE_CAPTURE_RESULT`，错误发对应的 ERROR 消息类型

## 2. Background 消息路由

- [x] 2.1 在 `background.js` 中新增 `SCAN_NAVIGATION` 和 `CAPTURE_PAGE_SECTION` 消息处理分支
- [x] 2.2 `SCAN_NAVIGATION` 处理：接收 `maxItems` 参数，注入 `outline-scanner.js`（传入 `maxItems`），监听 `OUTLINE_SCAN_RESULT` 回调并通过 `sendToPanel` 转发
- [x] 2.3 `CAPTURE_PAGE_SECTION` 处理：首次调用时记录当前 Tab URL 作为 `originalUrl`，后续调用复用
- [x] 2.4 `CAPTURE_PAGE_SECTION` 处理：支持 URL 跳转模式（`chrome.tabs.update` + `chrome.tabs.onUpdated` 等待 `complete`）和 DOM 点击模式
- [x] 2.5 `CAPTURE_PAGE_SECTION` 处理：捕获完成后自动调用 `chrome.tabs.update({url: originalUrl})` 切回起始页面
- [x] 2.6 支持 AbortController 中断：`CAPTURE_PAGE_SECTION` 处理过程中若收到 `STOP_EXPLORATION` 消息则中止并返回错误

## 3. Skill 注册与工具定义

- [x] 3.1 创建 `chrome-extension/skills/website-outline/index.js`，通过 `window.__registerSkill()` 注册 Skill（id: `website-outline`，name: `建立网站大纲`，category: `基本`）
- [x] 3.2 实现 `getPrompt()` 返回 AI 行为指引：默认探索 30 个导航项、逐项访问收集、中断后生成不完整大纲并标注
- [x] 3.3 实现 `getTools()` 返回 3 个工具定义：
  - `scan_navigation_menu`：参数 `maxItems`（可选，默认 30，最大 40），Handler 发送 `SCAN_NAVIGATION` 消息等待回调
  - `navigate_to_section`：参数 `url`（必需）/ `selector`（可选）/ `originalUrl`（可选），Handler 发送 `CAPTURE_PAGE_SECTION` 消息等待回调
  - `build_outline_map`：参数 `content`（必需）/ `filename`（可选），Handler 调用记忆系统 `saveMemoryFile()` 保存到大纲文件
- [x] 3.4 实现工具 Handler 的异步回调机制：发送消息后返回 Promise，监听 Background 响应的对应消息类型后 resolve，同时绑定 AbortController 支持中断
- [x] 3.5 在 `panel.html` 中引入 `skills/website-outline/index.js`

## 4. 探索进度提示与停止支持

- [x] 4.1 在 `navigate_to_section` Handler 执行期间，在 Panel 的 `#skillStatusBar` 区域显示探索进度提示文本（如"正在探索网站大纲..."）
- [x] 4.2 工具执行完成（成功或失败）后自动清除 `#skillStatusBar` 中的探索提示
- [x] 4.3 确保"停止"按钮（已有的 `stopBtn`/`currentAbortController`）可中断 `navigate_to_section` 工具调用链：abort 后 Agent Loop 终止，AI 根据已有结果生成不完整大纲

## 5. 系统功能地图生成与保存

- [x] 5.1 `build_outline_map` Handler 中实现：获取当前域名 → 调用 `saveMemoryFile(hostname, filename, content)` 写入 IndexedDB
- [x] 5.2 确保记忆卡片同步更新：调用 `initMemoryCard()` 后更新 `fileCount` 和 `domainCount`，触发 `renderKnowledgeList()` 刷新 UI

## 6. 集成验证（需加载扩展后手动测试）

- [ ] 6.1 验证 Skill 在 Panel 的"技能"Tab 中正确显示（名称、描述、分类）
- [ ] 6.2 验证斜杠命令 `/website-outline` 可正常过滤和使用
- [ ] 6.3 验证 `scan_navigation_menu` 的 `maxItems` 参数生效（默认 30、自定义值、超过 40 被截断）
- [ ] 6.4 验证 `navigate_to_section` 捕获完成后自动切回起始页面
- [ ] 6.5 验证探索过程中 `#skillStatusBar` 显示进度提示，完成后自动清除
- [ ] 6.6 验证用户点击"停止"按钮后探索中断，AI 基于已有数据生成不完整大纲
- [ ] 6.7 验证生成的网站大纲 MD 文件正确保存到记忆文件夹对应域名下，可在知识面板中查看
