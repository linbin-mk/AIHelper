## 1. 展开 header 捕获

- [x] 1.1 修改 `background.js` 中 `onBeforeSendHeaders` listener，移除 header 名称白名单过滤，存储全部 header

## 2. 新建 Content Script 批量执行器

- [x] 2.1 创建 `chrome-extension/src/content/batch-executor.js`，接收配置参数，在页面内执行批量 `fetch()`
- [x] 2.2 实现并发控制（max 5）+ body 占位符替换 + 进度回报（`chrome.runtime.sendMessage`）
- [x] 2.3 实现取消机制（监听 `BATCH_CANCEL` 消息或内置 AbortController）

## 3. 重构 Background 执行逻辑

- [x] 3.1 删除 `executeBatch()` 中原有的 4 层 header 组装和 `fetch()` 逻辑
- [x] 3.2 实现匹配请求全量复制 header
- [x] 3.3 改为通过 `chrome.scripting.executeScript` 注入 `batch-executor.js`，传入配置
- [x] 3.4 Background 转发 Content Script 的 `BATCH_PROGRESS`/`BATCH_COMPLETE` 消息给 Panel

## 4. 清理无用代码

- [x] 4.1 删除 `storedAuthToken` 变量声明及 `EXTRACT_AUTH` 处理器中对它的赋值
- [x] 4.2 删除 `getCookieHeader()` 函数
- [x] 4.3 删除 `resolveUrl()`
