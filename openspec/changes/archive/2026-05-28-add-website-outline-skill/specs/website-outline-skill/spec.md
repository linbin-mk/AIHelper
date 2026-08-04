## ADDED Requirements

### Requirement: Skill 注册接口
系统 SHALL 通过 `window.__registerSkill()` 注册"建立网站大纲"技能，`id` 为 `website-outline`，`name` 为"建立网站大纲"，`category` 为"基础"，`description` 为"自动探索页面导航结构，逐项点击导航栏功能，记录各页面提供的功能入口，生成系统功能地图 MD 文档并存入记忆文件夹"。

#### Scenario: 技能注册成功
- **WHEN** `skills/website-outline/index.js` 在页面加载时调用 `window.__registerSkill({id: 'website-outline', name: '建立网站大纲', category: '基础', ...})`
- **THEN** 该 Skill 被添加到 SkillRegistry，`category` 为"基础"，在调试模式下可见

#### Scenario: 技能提供工具定义
- **WHEN** 查询 `website-outline` Skill 的 `getTools()`
- **THEN** 返回包含 `get_page_interactive_elements` 和 `click_element` 两个工具定义的数组

### Requirement: 技能 Prompt 规则
技能 `getPrompt()` SHALL 返回导航探索规则片段，包含以下指导：
- 首先调用 `get_page_interactive_elements` 获取全量可交互元素
- 自主分析元素列表（按位置、语义、文本），识别导航区域（侧边栏、顶部菜单栏、标签页等）
- 制定点击顺序（按菜单层级从上到下或从左到右，跳过危险按钮如"删除/登出/退出"）
- 每次使用 `click_element` 点击导航项后，重新获取元素列表确认是否进入目标页面
- 汇总所有导航→页面→功能信息，生成功能地图 Markdown 存入记忆系统

#### Scenario: AI 获取技能规则
- **WHEN** 用户通过 `/website-outline 探索导航` 激活该技能
- **THEN** AI 在系统 prompt 中收到完整导航探索规则，包含安全约束（跳过危险按钮）和探索流程指导

#### Scenario: 技能 Prompt 包含安全约束
- **WHEN** AI 读取到技能 Prompt 规则
- **THEN** 规则中明确列出需跳过的按钮文本关键词（"删除"、"登出"、"退出"、"重置"、"清空"、"注销"、"退出登录"、"sign out"、"log out"）

### Requirement: 技能工具 Handler 实现
技能 SHALL 为每个工具提供 handler 函数，通过 `chrome.runtime.sendMessage` 与 background.js 通信。

#### Scenario: get_page_interactive_elements 工具调用
- **WHEN** AI 调用 `get_page_interactive_elements`
- **THEN** handler 发送 `{type: 'GET_PAGE_INTERACTIVE_ELEMENTS'}` 消息到 background.js，等待 `PAGE_INTERACTIVE_ELEMENTS_DATA` 响应

#### Scenario: click_element 工具调用
- **WHEN** AI 调用 `click_element` 并传入 `{selector: ".nav-item:first-child"}`
- **THEN** handler 发送 `{type: 'CLICK_ELEMENT', data: {selector: ".nav-item:first-child", timeout: 3000}}` 消息到 background.js，等待 `CLICK_ELEMENT_RESULT` 响应
