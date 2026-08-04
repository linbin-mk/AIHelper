## Context

AIHelper 是一个 Chrome DevTools 侧边栏扩展，具备 AI 对话、Skill 系统、记忆管理和页面交互能力（通过 `chrome.scripting.executeScript` 注入 Content Script）。

当前系统缺乏自动探索页面导航结构的能力——AI 不知道用户在看的系统有哪些功能入口。现有的 `browser-page-refresh` Skill 只能刷新页面，`test-data-generation` Skill 提供 form 字段提取但仅用于数据生成场景。

用户希望在任意后台管理系统页面中，让 AI 自动点击导航栏的每一项，记录对应页面提供的功能，生成一份系统功能地图。后续用户问"XX功能在哪"时，AI 能直接查地图回答，无需猜测或要求用户手动导航。

## Goals / Non-Goals

**Goals:**
- 提供通用 `get_page_interactive_elements` 工具，将页面所有可见可交互元素（链接、按钮、菜单项）以结构化数据喂给 AI
- 提供通用 `click_element(selector)` 工具，支持任意选择器点击，不限框架
- AI 自主分析元素列表，识别导航结构，决策点击顺序
- 每点击一个导航项后，AI 重新获取新页面的元素列表，判断是否进入目标页面
- 汇总所有导航→页面→功能列表，生成结构化 Markdown 功能地图文档
- 功能地图存入记忆文件夹（`{hostname}/功能地图.md`），可被 `search_memories` / `get_memory_file` 查询
- 优化主提示词，让 AI 优先检查功能地图

**Non-Goals:**
- 不做自动表单填写或多步操作流程录制
- 不做跨域页面截图/OCR
- 不做 SPA 路由变化的历史监听
- 不做权限检测（哪些功能当前用户不可见/无权限）

## Decisions

### D1: Content Script 注入 vs. chrome.scripting.executeScript 即时执行

**选择**: 使用 `chrome.scripting.executeScript` 注入 func 方式即时执行，不创建持久 Content Script。

**理由**:
- 与现有 `page-context.js`、`auth-extractor.js` 模式一致（`handleInjectScript`）
- 不会因持久注入影响目标页面性能或产生内存泄漏
- 每次点击后页面可能刷新或导航，重新注入能拿到最新 DOM 状态
- CSP 限制下的回退策略已有成熟方案

**替代方案**:
- 持久 Content Script + `sendMessage` 通信：需要匹配所有 URL，增加 manifest 声明复杂度，且每次 DOM 变化都需通知 panel，开销大
- 使用 `chrome.debugger` API：权限更高但用户体验差（顶部黄色警告条），且需要 `debugger` 权限

### D2: 元素提取格式 - 自定义 JSON vs. ARIA snapshot vs. AXTree

**选择**: 自定义 JSON 格式，包含 `tagName`, `text`(可见文本), `selector`(CSS 选择器), `rect`(坐标), `role`(ARIA role), `href`(链接), `isVisible`(布尔值)。

**理由**:
- CSS Selector 是 AI 最容易理解和生成的选择器（AI 对 CSS 选择器有广泛训练数据）
- 坐标数据让 AI 判断元素位置（左上角、右下角、中心区域等），帮助识别导航栏与内容区
- ARIA role 辅助识别元素语义（navigation, menubar, button 等）
- 不与特定框架绑定（不依赖 Vue/React/Angular 的组件树）

**替代方案**:
- 使用 `window.getComputedAccessibleNode()` 的 AXTree：Chrome 实验性 API，不稳定，且 AI 训练数据少
- 纯文本表示（类似屏幕阅读器输出）：丢失选择器信息，无法回传点击

### D3: click_element 实现 - document.querySelector + click()

**选择**: 注入 Content Script，在页面 MAIN world 中执行：
```js
const el = document.querySelector(selector);
el.scrollIntoView({block:'center'});
el.click();
```
返回 `{success: true, pageChanged, elementText}`。

**理由**:
- `click()` 触发元素绑定的所有事件处理器（React、Vue、原生）
- `scrollIntoView` 确保元素在视口内才能被正确点击（`click()` 对不视口内元素可能无效）
- 返回 `pageChanged` 标志让 AI 判断是否需要等待新页面加载

**风险**:
- 某些框架使用事件委托，`click()` 可能不触发预期行为——提供回退建议（`dispatchEvent(new MouseEvent(...))`）
- Shadow DOM 中的元素无法被 `document.querySelector` 选中——可视为局限，后续迭代改进

### D4: 导航检测策略 - AI 自主判断 vs. 启发式规则

**选择**: AI 完全自主判断，不预设导航选择器规则。

**理由**:
- 系统后台页面框架多样（Element UI, Ant Design, 自定义组件库），类名无规律
- AI 有大量前端框架训练数据，能识别 `<nav>`, `class="sidebar-menu"`, `role="navigation"` 等模式
- AI 可以根据元素位置分布（坐标聚类）识别导航区域，比固定规则更智能

**替代方案**:
- 预设常见框架的导航选择器（`.el-menu`, `.ant-menu`, `.sidebar` 等）：维护成本高，覆盖不全，且 AI 仍需要知道对应框架名称
- 纯启发式（总是点击 sidebar 内的元素）：应对不了水平导航栏、多级菜单等

### D5: 功能地图生成策略 - AI 总结 vs. 模板填充

**选择**: 在 AI Agent Loop 中，由 AI 逐页探索完成后，调用专门的总结 prompt 生成功能地图 Markdown。

**理由**:
- AI 能理解和归纳页面功能描述（比正则匹配标签更智能）
- 地图内容需要自然语言描述（"用户管理：新增、编辑、删除用户"），非结构化模板能覆盖各种页面类型
- 复用已有的记忆生成 pipeline（`buildMemoryFileContent`），将地图作为特殊类型记忆文件存储

### D6: 功能地图持久化 - 记忆文件夹 vs. 独立存储

**选择**: 存入现有记忆系统（`{hostname}/功能地图.md`），作为记忆文件的一种。

**理由**:
- 已有的 `search_memories(domain)` 和 `get_memory_file(path)` 可复用
- `buildMemoryHint()` 已有域名级别的记忆提示逻辑，扩展即可
- 不引入新的存储机制，降低实现复杂度
- 用户可像查看其他记忆文件一样查看/管理功能地图

## Risks / Trade-offs

- **[R1] AJAX/SPA 页面导航后 DOM 未完全加载** → AI 需要在点击后等待并重新获取元素列表验证页面变化，`click_element` 返回 `pageChanged` 标志辅助判断
- **[R2] 嵌套 iframe 中的元素** → `document.querySelector` 无法穿透 iframe，需 AI 判断是否为 iframe 内容并跳过
- **[R3] AI token 消耗大（元素列表可能上百条）** → 元素列表仅返回 100 条以内，优先返回导航区域附近的元素（坐标 y < 页面中线或带有导航语义 role）
- **[R4] 误点危险操作（删除/登出按钮）** → 在 Skill Prompt 中明确约束 AI，遇到危险按钮文本时跳过（"删除/登出/退出/重置/清空"等）
- **[R5] 探索过程长，需要多轮 Agent Loop** → 该技能设计为人工触发（通过斜杠命令 `/website-outline`），AI 在单次 Agent Loop 中执行探索（支持 50+ tool_calls 的深度循环）

## Open Questions

1. 是否需要支持"继续探索"（上次未完成的地图继续扩展）？—— 首次 MVP 只做全量探索，后续迭代考虑增量
2. 功能地图文件是否需要随时间自动刷新？—— MVP 不做自动刷新，用户需要时手动重新触发
