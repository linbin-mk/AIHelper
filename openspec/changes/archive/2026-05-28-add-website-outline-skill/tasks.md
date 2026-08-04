## 1. Content Script 工具实现

- [x] 1.1 创建 `src/content/page-interactive-elements.js`，实现 `extractInteractiveElements()` 函数：查询 `a, button, [role], [onclick], input[type="submit/button"], [class*="nav"], [class*="menu"], [class*="tab"], [class*="sidebar"]`，过滤隐藏元素，返回 JSON 数组（含 tagName, text, selector, rect, role, href, type, isVisible）
- [x] 1.2 创建 `src/content/element-click.js`，实现 `clickElement(selector, timeout)` 函数：`querySelector` 定位，`scrollIntoView`，`click()`，检测 URL 变化，返回 `{success, elementText, pageChanged, selector}`

## 2. Background.js 消息处理

- [x] 2.1 在 `background.js` 的 `chrome.runtime.onMessage` 中添加 `GET_PAGE_INTERACTIVE_ELEMENTS` case：通过 `chrome.scripting.executeScript` 以 `func` 方式执行元素提取逻辑，返回结果到 panel
- [x] 2.2 在 `background.js` 中添加 `CLICK_ELEMENT` case：通过 `chrome.scripting.executeScript` 以 `func` 方式执行点击逻辑，传入 `selector` 和 `timeout` 参数

## 3. Skill 注册与定义

- [x] 3.1 创建 `skills/website-outline/index.js`，注册 `website-outline` Skill（`id`, `name`, `description`, `category: '基础'`）
- [x] 3.2 实现 `getPrompt()`：返回导航探索规则（包含探索流程、安全约束、危险按钮跳过列表、地图生成指导），将 AI 角色定位为"系统导航探索专家"
- [x] 3.3 实现 `getTools()`：定义 `get_page_interactive_elements` 和 `click_element` 两个工具，提供 handler 通过 `chrome.runtime.sendMessage` 与 background.js 通信
- [x] 3.4 在 `click_element` handler 中实现安全约束：检查参数中 `selector` 是否可能匹配危险按钮

## 4. 功能地图生成与存储

- [x] 4.1 在 Skill Prompt 中定义功能地图 Markdown 模板格式（功能目录 + 功能详情表格），指导 AI 如何从探索结果生成地图文档
- [x] 4.2 实现地图存储逻辑：AI 通过 `get_memory_file` 和记忆写入工具将地图存入 `{hostname}/功能地图.md`

## 5. 主提示词优化

- [x] 5.1 修改 `chat.js` 中 `buildMemoryHint()` 函数：扫描当前域名下记忆文件，若存在 `功能地图.md` 或 `function-map.md`，在提示中注入功能地图发现信息
- [x] 5.2 在 `buildMemoryHint()` 返回提示中增加引导："当用户询问功能位置时，优先调用 search_memories 查找功能地图"
- [x] 5.3 在 `i18n.js` 中添加功能地图相关中英文提示文案（`memoryHint.mapFound`、`memoryHint.mapGuidance`）

## 6. 跨 Skill 协作优化

- [x] 6.1 更新 `skills/browser-page-refresh/index.js` 的 `getPrompt()`：返回简短引导，提示 AI 在页面加载后可通过"建立网站大纲"技能探索页面结构
- [x] 6.2 确保 `website-outline` Skill 的 `get_page_interactive_elements` 工具和 `test-data-generation` Skill 的 `get_page_context` 工具在语义上不冲突、可协作

## 7. 验证与测试

- [ ] 7.1 手动测试：在目标测试后台页面通过 `/website-outline` 命令触发探索，验证元素提取、点击、页面切换、地图生成全流程
- [ ] 7.2 验证功能地图文件正确存入记忆文件夹，可通过 `search_memories` 查询到
- [ ] 7.3 验证主提示词优化后，AI 在询问"某功能位置"时自动查地图回答
- [ ] 7.4 验证 `click_element` 失败场景：选择器无匹配、危险按钮拒绝、页面加载超时
