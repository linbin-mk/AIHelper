## 1. browser-page-refresh Skill 创建

- [x] 1.1 创建 `chrome-extension/skills/browser-page-refresh/index.js`，定义 Skill（id: `browser-page-refresh`，name: "页面刷新"），包含 `refresh_page` 工具定义（无参数，描述为刷新当前浏览器标签页）
- [x] 1.2 实现 `refresh_page` handler：通过 `chrome.runtime.sendMessage({ type: 'REFRESH_PAGE' })` 发送消息给 Background，Background 执行 `chrome.tabs.reload()` 后返回结果
- [x] 1.3 在 `background.js` 中新增 `REFRESH_PAGE` 消息处理：`chrome.tabs.query({ active: true, currentWindow: true })` 获取标签页，调用 `chrome.tabs.reload(tabId)`，返回 `{ success: true, url }` 或 `{ error: "no_active_tab" }`

## 2. test-data-generation Skill - prompt 规则更新

- [x] 2.1 更新 `getPrompt()` 方法，新增请求数据缺失时的自动刷新规则
- [x] 2.2 在 `getPrompt()` 中新增 `combinedTaskCard` 格式说明
- [x] 2.3 在 `getPrompt()` 中新增组合任务执行流程

## 3. test-data-generation Skill - combinedTaskCard 解析与渲染

- [x] 3.1 在 `index.js` 中实现 `parseCombinedTaskCardFromText(text)` 函数
- [x] 3.2 实现 `renderCombinedTaskCard(combinedData)` 函数
- [x] 3.3 实现 `updateCombinedTaskCard(taskId, stepIndex, status)` 函数
- [x] 3.4 实现 `handleCombinedTaskExecute(taskId)` 函数
- [x] 3.5 更新 `onMessageParsed` 回调
- [x] 3.6 在聊天历史消息结构中支持 `combinedTaskCard` 字段

## 4. CSS 样式

- [x] 4.1 在 `panel.css` 中新增 `.combined-task-card` 系列样式
- [x] 4.2 确保现有 `.task-card` 样式不被 `.combined-task-card` 样式覆盖，两者独立

## 5. Background 消息路由

- [x] 5.1 在 `background.js` 的 message listener 中新增 `REFRESH_PAGE` case，实现页面刷新逻辑
- [x] 5.2 在 `manifest.json` 中确认 `tabs` 权限已声明（用于 `chrome.tabs.reload`）

## 6. 验证

- [x] 6.1 验证 `refresh_page` 工具在未找到活动标签页时返回正确错误信息
- [x] 6.2 验证 `combinedTaskCard` 在解析无效 JSON 时返回 false，不破坏现有消息解析
- [x] 6.3 验证现有单步骤 `taskCard` 功能不受影响（向后兼容）
- [x] 6.4 验证组合任务按步骤顺序执行，前置失败时后续步骤正确跳过
- [x] 6.5 修复: AI 输出多个独立 taskCard 时自动合并为 combinedTaskCard（extractTaskCardJSONs + parseMultipleTaskCards）
