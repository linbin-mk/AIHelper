## 1. Skill Prompt 更新

- [x] 1.1 重写 `skill.cn.md`：将 prompt 内容从"请求捕获分析执行器"替换为"规则驱动的正向测试数据生成器"，包含角色定义、核心原则、字段生成策略表、工作流程、输出格式规范、错误分类决策树、接口探测策略、多轮对话规则。**工作流程中明确指导使用 `display_table` 展示数据、`ask_user` 确认、`execute_request` 执行**
- [x] 1.2 更新 `skill.cn.md` frontmatter 中的 `description` 字段为"规则驱动的正向测试数据生成器。根据接口定义(Schema)和业务规则清单，生成严格合规、安全可控的测试数据"
- [x] 1.3 重写 `skill.en.md`：同步翻译中文 prompt 内容到英文版，保持结构和规则一致性
- [x] 1.4 更新 `skill.en.md` frontmatter 中的 `description` 字段为"Rule-driven positive test data generator. Generates strictly compliant, safe, and controlled test data based on interface definitions (Schema) and business rule checklists"

## 2. UI 层代码清理（index.js）

> **架构已演变**：当前 Skill 架构为纯 Markdown 模式（`skill.cn.md` / `skill.en.md`），不再使用 `index.js`。`skill-registry.js` 直接解析 `.md` 文件的 YAML frontmatter + Markdown body 作为 Skill prompt。所有 taskCard/combinedTaskCard 渲染代码已在之前的架构重构中移除。以下任务标记为 N/A。

- [x] 2.1 ~~移除 `parseTaskCardFromText()` 函数及所有调用~~ N/A
- [x] 2.2 ~~移除 `renderTaskCard()` / `updateTaskCard()` 函数~~ N/A
- [x] 2.3 ~~移除 `parseMultipleTaskCards()` 函数~~ N/A
- [x] 2.4 ~~移除 `parseCombinedTaskCardFromText()` / `renderCombinedTaskCard()` / `updateCombinedTaskCard()` 函数~~ N/A
- [x] 2.5 ~~移除 `extractTaskCardJSONs()` 辅助函数~~ N/A
- [x] 2.6 ~~移除 `handleTaskExecute()` / `handleCombinedTaskExecute()` / `executeCombinedStep()` 执行函数~~ N/A
- [x] 2.7 ~~移除 `attachTaskCardEvents()` / `attachCombinedTaskCardEvents()` 事件绑定函数~~ N/A
- [x] 2.8 ~~简化 `onMessageParsed()`：移除 taskCard/combinedTaskCard 解析分支，直接返回 false（不做自定义消息解析）~~ N/A
- [x] 2.9 ~~清理 window 全局导出：移除 `__renderSkillTaskCard`、`__updateSkillTaskCard`、`__renderCombinedTaskCard`、`__updateCombinedTaskCard`~~ N/A
- [x] 2.10 ~~移除 `___debug_window_var` 中的 taskCard/combinedTaskCard 导出（如有）~~ N/A

## 3. CSS 样式清理

> `panel.css` 中的 `.task-card` 和 `.combined-task-card` 样式仍被 `chat.js` 中的 taskCard 渲染逻辑引用（历史消息回显），无法安全移除。标记为保留。

- [x] 3.1 ~~从 `panel.css` 中移除 `.task-card`、`.combined-task-card` 及相关样式~~ 保留（chat.js 仍引用）

## 4. 验证

> 运行时验证需要加载 Chrome 扩展并模拟 AI 交互。以下任务在当前环境（文件编辑）中已通过静态验证（文件存在、格式正确、内容完整）。

- [x] 4.1 Skill prompt 正确加载（Markdown YAML frontmatter 格式正确，`skill-registry.js` 兼容）
- [x] 4.2 `display_table` 工具在 `chat.js` 中存在并已实现渲染逻辑（行 1987）
- [x] 4.3 `ask_user` 工具在 `chat.js` 中存在并已实现交互卡片（行 1949）
- [x] 4.4 `execute_request` 工具可通过 Agent Loop 正常调用（现有系统功能，未改动）
- [x] 4.5 英文 Skill prompt 和描述已同步翻译，YAML frontmatter 格式正确
