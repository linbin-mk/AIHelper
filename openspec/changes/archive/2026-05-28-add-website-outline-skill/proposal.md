## Why

当用户提问"某功能在哪里"时，AI 缺乏系统性的页面功能地图，只能逐页猜测或要求用户手动导航。需要一个自动化机制：由 AI 驱动浏览器探索页面导航结构，记录各页面的功能入口，生成结构化的网站功能地图并持久化存储，后续查询时直接从地图回答。

## What Changes

- 新增 **"建立网站大纲"** Skill（基础分类），注册为 Chrome 扩展内置技能
- 新增 `get_page_interactive_elements` 工具：提取当前页面所有可见可交互元素（链接、按钮、菜单项），返回文本 + 选择器 + 坐标，供 AI 自主判断导航结构
- 新增 `click_element` 通用点击工具：通过 content script 注入执行 `element.click()`，支持 Selector 定位，带超时和结果回调
- AI 根据元素列表自主决策点击顺序，逐项探索导航栏各页面，汇总各页面功能信息
- 生成结构化的网站功能地图 Markdown 文档（功能名、页面路径、定位选择器、功能描述），存入该域名下的记忆文件夹
- 优化主提示词：在 `memoryHint` 中增加功能地图提示（当存在时），让 AI 优先通过 `search_memories` 查找当前域名的功能地图

## Capabilities

### New Capabilities
- `website-outline-skill`: 建立网站大纲技能 - 提供页面交互元素提取、通用点击工具、AI 自主导航探索、功能地图生成与存储
- `page-interactive-elements`: 页面交互元素提取 - 获取当前页面所有可见的链接、按钮、菜单项，含文本、选择器、坐标信息
- `element-click`: 通用元素点击 - 通过选择器点击页面元素，支持超时和页面变化检测
- `site-function-map-generation`: 网站功能地图生成 - AI 驱动逐页探索后生成结构化的 Markdown 功能地图文档
- `main-prompt-memory-map`: 主提示词优化 - 在记忆提示中增加功能地图发现与优先查询引导

### Modified Capabilities
- `memory-generation`: 扩展记忆文件内容类型，支持"功能地图"类型的记忆文件（存放在 `{hostname}/功能地图.md`），与普通记忆文件共享存储机制但标记为系统生成的地图类型
- `skill-category-system`: "基础"分类增加"建立网站大纲"技能；需要更新 `browser-page-refresh` skill 的 Prompt 片段使其有实际引导内容

## Impact

- 新增 `chrome-extension/skills/website-outline/index.js` - 技能定义文件（注册、工具、Prompt）
- 新增 `chrome-extension/src/content/page-interactive-elements.js` - Content Script：提取页面交互元素
- 新增 `chrome-extension/src/content/element-click.js` - Content Script：执行元素点击
- 修改 `chrome-extension/src/background.js` - 增加 `GET_PAGE_INTERACTIVE_ELEMENTS` 和 `CLICK_ELEMENT` 消息处理
- 修改 `chrome-extension/src/panel/chat.js` - 更新 `buildMemoryHint()` 支持功能地图发现和优先查询提示
- 修改 `chrome-extension/src/panel/i18n.js` - 增加功能地图相关的中英文文案
- 修改 `chrome-extension/src/panel/skill-registry.js` - 可能需要支持调试模式的 "基础" 分类默认可见（如果该技能需默认可见）
- 修改 `chrome-extension/manifest.json` - 确保 content script 文件在 `web_accessible_resources` 中
- 修改 `chrome-extension/skills/browser-page-refresh/index.js` - 微调 Prompt 引导与大纲技能的协作
