## Why

测试数据生成 Skill 当前依赖页面已捕获的请求数据来分析 API 接口，但用户在新页面或页面刚刷新后可能尚未产生目标请求（如未点击过"保存"按钮），导致 `get_captured_requests` 返回空或缺少所需接口。同时，复杂业务场景（如"创建开销记录"需要先创建"开销分类"）需要多表组合操作，当前 taskCard 仅支持单接口，无法表达依赖关系和先后顺序。

## What Changes

- 新增 `browser-page-refresh` 插件能力：提供 `refresh_page` 工具，通过 `chrome.tabs.reload()` 刷新当前标签页
- 增强 `test-data-generation` Skill：当 `get_captured_requests` 未收录目标请求时，AI 调用 `refresh_page` 工具重新加载页面以捕获请求
- 增强 `test-data-generation` Skill：支持多表组合任务卡片（`combinedTaskCard`），可定义多个有序步骤（`steps`），每个步骤包含独立的 API 配置和数据模板
- 组合任务卡片 UI 展示步骤间的先后依赖关系，用户授权后智能体按顺序逐步执行

## Capabilities

### New Capabilities
- `browser-page-refresh`: 浏览器页面刷新工具，支持刷新当前标签页以重新捕获 HTTP 请求

### Modified Capabilities
- `skill-test-data-generation`: 新增自动刷新触发逻辑和多表组合任务卡片能力

## Impact

- 影响范围：`chrome-extension/skills/test-data-generation/index.js`（taskCard 模板、prompt 规则、UI 渲染、执行流程）
- 新增文件：`chrome-extension/skills/browser-page-refresh/index.js`（页面刷新工具定义和 handler）
- 需要 `chrome.tabs.reload` API 权限（manifest.json 中已有 `tabs` 权限）
- taskCard UI 组件需扩展以支持 `combinedTaskCard` 类型的多步骤渲染
