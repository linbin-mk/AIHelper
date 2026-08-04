## Why

AIHelper 目前只能被动分析用户发起的对话和页面请求，缺乏主动探索网站结构的能力。用户在接手新系统或不熟悉某个 Web 平台时，需要手动逐一点击导航栏功能来了解系统全貌。"建立网站大纲" Skill 能自动遍历导航栏、记录每个页面的功能描述，生成结构化的系统功能地图，帮助用户快速理解目标系统的功能布局。

## What Changes

- 新增浏览器扩展 Skill `website-outline`（建立网站大纲），注册到 Skill 系统
- 新增 Content Script `outline-scanner.js`，负责在目标页面 DOM 中识别导航菜单结构、模拟点击、提取页面功能描述
- 为该 Skill 提供 2 个 AI 工具：`scan_website_navigation`（扫描导航栏结构并遍历）和 `build_outline_map`（根据扫描结果生成系统功能地图 Markdown）
- 生成的系统功能地图 MD 文件自动存入记忆文件夹，按域名分类（路径格式：`{hostname}/网站大纲.md`）
- Skill 类别归入"基础"（与页面刷新同级）

## Capabilities

### New Capabilities
- `website-outline-skill`: 浏览器扩展 Skill，提供网站导航扫描和功能地图生成的 AI 工具
- `website-outline-scanner`: Content Script 注入机制，在目标页面中执行 DOM 导航识别、模拟点击与页面功能提取

### Modified Capabilities
<!-- 无现有规格需求变更 -->

## Impact

- 新增 `chrome-extension/skills/website-outline/index.js` — Skill 注册入口
- 新增 `chrome-extension/src/content/outline-scanner.js` — 页面导航扫描脚本
- 修改 `chrome-extension/src/background.js` — 新增消息处理路由（消息类型约 2-3 个）
- 修改 `chrome-extension/src/panel/chat.js` — 无需修改（工具通过 Skill 注册机制自动注册）
- 依赖记忆系统（`memory.js`）— 保存生成的网站大纲文件到 IndexedDB
