## ADDED Requirements

### Requirement: Skill 定义与注册
系统 SHALL 在 `chrome-extension/skills/website-outline/index.js` 中通过 `window.__registerSkill()` 注册一个 `id` 为 `website-outline` 的 Skill，`name` 为"建立网站大纲"，`category` 为"基础"，`getPrompt()` 返回网站大纲生成的 AI 行为指引，`getTools()` 返回 3 个 AI 工具。

#### Scenario: Skill 自注册
- **WHEN** 扩展 Panel 加载 `skills/website-outline/index.js`
- **THEN** `SkillRegistry` 中注册该 Skill，`name` 为"建立网站大纲"，`category` 为"基础"
- **AND** 该 Skill 自动激活

#### Scenario: Skill Prompt 规则
- **WHEN** 该 Skill 被激活后构建系统 Prompt
- **THEN** `getPrompt()` 返回的规则片段包含以下指引：
  - AI 应在用户要求了解网站功能时主动使用 `scan_navigation_menu` 工具，默认传入 `maxItems: 30`
  - 扫描到导航结构后，应逐项调用 `navigate_to_section` 收集各页面功能
  - 每次调用 `navigate_to_section` 前应从消息历史中确认尚未超出已探索项数
  - 收集完成后应整理为结构化 Markdown，调用 `build_outline_map` 保存
  - 如果探索被用户中断，应基于已收集的部分数据生成不完整大纲并标注"探索被中断"

### Requirement: 工具 scan_navigation_menu
系统 SHALL 提供一个名为 `scan_navigation_menu` 的 AI 工具，扫描当前浏览器标签页的主导航菜单结构。

工具参数：
- `maxItems`（可选，integer）：返回的最大导航项数量，默认 30，最大 40

工具行为：
1. Panel 通过 `chrome.runtime.sendMessage` 发送 `type: 'SCAN_NAVIGATION'` 到 Background，附带 `maxItems` 参数
2. Background 通过 `chrome.scripting.executeScript` 注入 `outline-scanner.js`（模式：`scan`）
3. Content Script 扫描 DOM 识别导航菜单，返回导航项列表
4. 每个导航项包含：`text`（显示文本）、`href`（链接地址，可选）、`selector`（CSS 选择器路径）、`type`（`nav`/`tab`/`sidebar`）

#### Scenario: 扫描包含语义化 <nav> 的页面
- **WHEN** AI 调用 `scan_navigation_menu({maxItems: 10})`，当前页面 DOM 包含 `<nav><a href="/users">用户管理</a><a href="/orders">订单管理</a></nav>`
- **THEN** 工具返回导航结构：`{items: [{text: "用户管理", href: "/users", selector: "nav a:nth-child(1)", type: "nav"}, {text: "订单管理", href: "/orders", selector: "nav a:nth-child(2)", type: "nav"}], total: 2, maxItems: 10}`

#### Scenario: 使用默认最大探索次数
- **WHEN** AI 调用 `scan_navigation_menu` 未传入 `maxItems` 参数
- **THEN** 默认 `maxItems` 为 30，返回最多 30 个导航项

#### Scenario: 导航项超过最大探索次数限制
- **WHEN** 页面导航栏有 25 个一级入口，AI 调用 `scan_navigation_menu({maxItems: 15})`
- **THEN** 仅返回前 15 个导航项，且结果包含 `truncated: true, total: 25` 标记

#### Scenario: 扫描 Ant Design 菜单组件
- **WHEN** 当前页面 DOM 包含 `<ul class="ant-menu"><li>仪表盘</li><li>设置</li></ul>`
- **THEN** 工具能识别 `.ant-menu` 作为导航容器，返回对应导航项

#### Scenario: 扫描无导航栏的页面
- **WHEN** 当前页面 DOM 中不包含任何可识别的导航结构
- **THEN** 工具返回 `{items: [], message: "未检测到导航菜单"}`

### Requirement: 工具 navigate_to_section
系统 SHALL 提供一个名为 `navigate_to_section` 的 AI 工具，将浏览器标签页导航到指定 URL，等待页面加载完成后提取页面功能摘要，并自动导航回起始页面。

工具参数：
- `url`（必需，string）：目标页面完整 URL 或相对路径
- `selector`（可选，string）：若页面为 SPA，提供导航项的 CSS 选择器用于模拟点击
- `originalUrl`（可选，string）：探索起始页面的 URL，用于捕获完成后切回。若未提供，以工具首次调用时当前页面 URL 作为起始页

工具行为：
1. 首次调用时，Background 记录当前 Tab URL 作为 `originalUrl`（若未显式传入），后续调用复用该值
2. 如果提供 `selector`，注入 Content Script 执行 `document.querySelector(selector).click()`，等待 2 秒
3. 如果提供 `url`（无 selector），使用 `chrome.tabs.update` 导航到目标 URL
4. 页面加载完成后，注入 Content Script（模式：`capture`）提取页面功能摘要
5. 捕获完成后，自动导航回 `originalUrl`（调用 `chrome.tabs.update({url: originalUrl})`）
6. 返回摘要对象，包含：`title`（页面标题）、`headings`（主要标题列表）、`actions`（可见操作按钮/链接）、`forms`（表单区域描述）、`url`（当前 URL）

#### Scenario: 通过 URL 导航并捕获页面后切回起始页
- **WHEN** AI 首次调用 `navigate_to_section({url: "/users"})`，当前页面为 `https://example.com/dashboard`
- **THEN** Background 记录 `originalUrl` 为 `https://example.com/dashboard`
- **AND** Background 导航到 `https://example.com/users`
- **AND** 页面 `complete` 后注入 Content Script 提取摘要并返回
- **AND** 工具返回结果后，Background 自动导航回 `https://example.com/dashboard`

#### Scenario: 多次调用 navigate_to_section 共用同一 originalUrl
- **WHEN** AI 第二次调用 `navigate_to_section({url: "/orders"})`（未传 `originalUrl`）
- **THEN** 使用首次调用时记录的 `originalUrl` 作为切回目标
- **AND** 捕获完成后切回同一 `originalUrl`

#### Scenario: 页面捕获完成后 Panel 显示进度提示
- **WHEN** `navigate_to_section` 工具正在执行（页面切换 + 捕获过程）
- **THEN** Panel 聊天区域底部 `#skillStatusBar` 区域显示进度提示文本（如"正在探索网站大纲..."）
- **AND** 捕获完成并切回起始页后，进度提示自动清除

#### Scenario: 通过点击 SPA 导航项捕获页面
- **WHEN** AI 调用 `navigate_to_section({selector: "nav a[data-route='orders']"})`
- **THEN** Content Script 模拟点击该选择器对应的元素
- **AND** 等待 2 秒后提取页面摘要并返回

#### Scenario: 页面加载超时
- **WHEN** `navigate_to_section` 执行后 15 秒内页面未完成加载
- **THEN** 工具返回 `{error: "timeout", message: "页面加载超时，已等待 15 秒"}`

### Requirement: 探索过程可被用户中断
系统 SHALL 支持用户通过聊天框"停止"按钮中断正在进行的网站大纲探索任务。中断后，AI 应基于已收集的部分数据生成不完整的大纲。

#### Scenario: 用户点击停止中断探索
- **WHEN** AI 正在循环调用 `navigate_to_section` 探索第 5 个导航项
- **AND** 用户点击聊天框"停止"按钮
- **THEN** `currentAbortController.abort()` 被触发，当前工具调用返回错误
- **AND** Agent Loop 终止，AI 在终止前看到已收集的 4 个页面捕获结果
- **AND** AI 应基于已有数据生成不完整大纲，标注"⚠️ 探索被用户中断，已探测 4/12 项"

#### Scenario: 探索完成后正常结束
- **WHEN** AI 完成所有导航项的探索并调用 `build_outline_map` 保存大纲
- **THEN** 聊天框"停止"按钮恢复为"发送"按钮，状态栏进度提示清除

### Requirement: 工具 build_outline_map
系统 SHALL 提供一个名为 `build_outline_map` 的 AI 工具，接收 AI 生成的 Markdown 格式系统功能地图，保存到记忆文件夹中对应域名目录下。

工具参数：
- `content`（必需，string）：Markdown 格式的系统功能地图内容
- `filename`（可选，string）：文件名，不指定则默认为"网站大纲"

工具行为：
1. 将 Markdown 内容保存到 IndexedDB 记忆存储，路径为 `{hostname}/{filename}.md`
2. 如果同名文件已存在则覆盖（版本追加序号：`网站大纲(2).md`）
3. 更新记忆卡片的 `fileCount` 和 `domainCount`
4. 返回保存后的文件路径

#### Scenario: 首次为某域名生成网站大纲
- **WHEN** AI 调用 `build_outline_map({content: "# GitHub 功能地图\n...", filename: "网站大纲"})`，当前域名 `github.com`
- **THEN** 文件保存到 IndexedDB 路径 `github.com/网站大纲.md`
- **AND** 工具返回 `{success: true, path: "github.com/网站大纲.md"}`

#### Scenario: 覆盖已有网站大纲
- **WHEN** `github.com/网站大纲.md` 已存在，AI 再次调用 `build_outline_map`
- **THEN** 新文件保存为 `github.com/网站大纲(2).md`

#### Scenario: 自定义文件名
- **WHEN** AI 调用 `build_outline_map({content: "...", filename: "管理后台功能地图"})`
- **THEN** 文件保存为 `{hostname}/管理后台功能地图.md`
