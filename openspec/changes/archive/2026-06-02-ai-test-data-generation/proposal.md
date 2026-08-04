## Why

测试人员在管理页面（如"用户管理"）手动造测试数据效率低下，每次需要了解接口协议、构造请求参数、处理鉴权。利用 AI 自动分析当前页面及前后端代码，智能生成 API 调用方案并一键执行，可将造数据时间从分钟级降低到秒级。

## What Changes

- 新增"测试数据生成"功能：AI 根据用户当前所在页面（通过 chrome.tabs 获取 URL/标题）及已缓存的项目代码，分析出创建该页面数据的 API 接口及参数结构
- 聊天框中输出"任务卡片"组件，卡片展示要执行的操作摘要（如"批量创建 10 个用户"），包含"执行"按钮
- 点击"执行"按钮后，AI 自动从当前页面提取鉴权信息（Cookie、Authorization Header 等），直接发起 API 请求批量创建测试数据
- 执行过程中任务卡片显示实时进度（如"已创建 3/10，成功 2，失败 1"），执行完成后展示结果摘要
- 支持用户在执行前修改数据模板（如修改默认密码、角色等字段）

## Capabilities

### New Capabilities
- `test-data-generation`: AI 驱动的测试数据批量生成，包含页面上下文感知、API 接口分析、鉴权提取、任务卡片 UI、批量执行与进度展示

### Modified Capabilities
<!-- None -->

## Impact

- 依赖 `ai-code-context` 中的 `search_project_code`、`get_project_file`、`list_project_files` 工具来分析 API 接口
- 需要 chrome.tabs API 获取当前页面 URL/标题
- 需要 chrome.cookies API 或 Content Script 获取页面鉴权信息
- 需要 chrome.scripting API 或 fetch API 直接发起跨域请求
- 影响范围：AI 聊天组件（新增任务卡片 UI）、Agent 工具函数（新增页面上下文获取、API 调用工具）、Content Script（获取页面 DOM 信息和鉴权 token）
