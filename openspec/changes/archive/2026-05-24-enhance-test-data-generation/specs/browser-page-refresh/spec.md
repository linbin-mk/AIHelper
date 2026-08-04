## ADDED Requirements

### Requirement: 页面刷新工具定义
系统 SHALL 提供一个名为 `browser-page-refresh` 的内置 Skill，包含 `refresh_page` 工具，用于刷新当前浏览器标签页。

#### Scenario: Skill 注册
- **WHEN** `browser-page-refresh` Skill 被加载
- **THEN** `__skillRegistry` 中包含 `browser-page-refresh`，且其 `getTools()` 返回包含 `refresh_page` 工具的数组

#### Scenario: 工具参数
- **WHEN** 查询 `refresh_page` 工具定义
- **THEN** 工具无必填参数，描述说明该工具会刷新当前用户正在浏览的标签页

### Requirement: 页面刷新执行
系统 SHALL 通过 Background Service Worker 执行页面刷新操作，调用 `chrome.tabs.reload()` 重新加载当前活动标签页。

#### Scenario: 刷新成功
- **WHEN** AI 调用 `refresh_page` 工具且存在当前活动标签页
- **THEN** 系统通过 `chrome.tabs.query({ active: true, currentWindow: true })` 获取标签页信息，调用 `chrome.tabs.reload(tabId)` 刷新页面，返回成功状态 `{ success: true, url: "<当前页面URL>" }`

#### Scenario: 无活动标签页
- **WHEN** 调用 `refresh_page` 但无活动标签页
- **THEN** 返回错误 `{ error: "no_active_tab", message: "未找到活动标签页" }`

### Requirement: Skill 独立性
`browser-page-refresh` Skill SHALL 不依赖其他 Skill，其所有工具定义、handler 函数和 prompt 规则 MUST 在 Skill 模块内部自包含。

#### Scenario: 模块自包含
- **WHEN** 查看 `browser-page-refresh` Skill 的源代码文件
- **THEN** 所有工具处理代码位于 `skills/browser-page-refresh/` 目录下，通过 `chrome.runtime.sendMessage` 与 Background 通信
