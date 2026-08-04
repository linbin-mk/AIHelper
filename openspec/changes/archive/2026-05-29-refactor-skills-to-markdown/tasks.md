## 1. SkillRegistry 扩展 — MD 加载能力

- [x] 1.1 在 `skill-registry.js` 中新增 `loadSkillsFromDirectory()` 异步方法，扫描 `skills/` 目录获取子目录列表
- [x] 1.2 实现语言感知文件选择：根据当前语言（`zh-CN` → `.cn.md`，`en` → `.en.md`）构造 `skill.<lang>.md` URL，目标文件不存在时回退到另一语言
- [x] 1.3 实现 MD 文件内容获取：通过 `chrome.runtime.getURL('skills/<skill-id>/skill.<lang>.md')` 构造 URL，`fetch()` 读取内容
- [x] 1.4 实现 YAML front matter 解析：提取 `---` 分隔符之间的 YAML，解析 `id`、`name`、`description`、`category` 字段
- [x] 1.5 实现 Markdown 正文提取：截取 `---` 分隔符之后的内容作为 prompt
- [x] 1.6 构建兼容的技能对象（含 `getPrompt()`、`getTools()`、`getUIDelegate()` 方法），调用 `register()` 注册
- [x] 1.7 添加错误处理：fetch 失败或解析失败时跳过该技能，记录 console.warn，不影响其他技能加载

## 2. Panel 初始化流程改造

- [x] 2.1 在 `panel.js` 初始化流程中调用 `skillRegistry.loadAllSkills()` 异步加载技能
- [x] 2.2 等待技能加载完成后再调用 `renderSkillsList()` 渲染技能列表
- [x] 2.3 技能加载过程中，技能 Tab 展示"技能加载中..."的加载状态提示
- [x] 2.4 从 `panel.html` 移除所有 `skills/*/index.js` 的 `<script>` 标签引入

## 3. 技能详情弹窗改造 — MD 渲染

- [x] 3.1 修改 `showSkillDetail(skill)` 函数：弹窗内容改为渲染技能 `getPrompt()` 返回的 Markdown 正文
- [x] 3.2 移除原有的 4 段式硬编码布局（描述、方法集合、技能规则、使用方式区块）
- [x] 3.3 正文为空时显示"该技能暂无详细说明"占位提示
- [x] 3.4 调整弹窗 CSS 样式适配 Markdown 渲染内容（标题、列表、代码块等）
- [x] 3.5 保留弹窗的"使用"按钮和关闭交互逻辑

## 4. 聊天系统 Prompt 构建适配

- [x] 4.1 确认 `buildActiveSkillPrompt()` 中调用 `skill.getPrompt()` 的逻辑无需变更（MD 技能的 `getPrompt()` 已返回正文）
- [x] 4.2 验证 `buildSkillDirectory()` 中读取 `skill.name` 和 `skill.description` 的逻辑对 MD 技能正常工作
- [x] 4.3 验证 `buildMergedTools()` 中处理 `getTools()` 返回空数组的逻辑对 MD 技能正常工作

## 5. 现有技能迁移 — 纯提示类技能

- [x] 5.1 迁移 `code-master`：编写 `skill.cn.md`，将 JS 中的 prompt 内容转换为自然语言 Markdown，使用 `ask_user`/`request_auth` 工具名替代 JS 工具调用
- [x] 5.2 迁移 `openspec-explore`：编写 `skill.cn.md`，保留探索模式的自然语言描述
- [x] 5.3 迁移 `openspec-propose`：编写 `skill.cn.md`，保留提案流程的自然语言描述
- [x] 5.4 迁移 `openspec-apply`：编写 `skill.cn.md`，保留实现流程的自然语言描述
- [x] 5.5 迁移 `openspec-archive`：编写 `skill.cn.md`，保留归档流程的自然语言描述

## 6. 现有技能迁移 — 占位/简单类技能

- [x] 6.1 迁移 `requirement-summary`：编写 `skill.cn.md`，占位内容标注"待完善"
- [x] 6.2 迁移 `system-qa`：编写 `skill.cn.md`，占位内容标注"待完善"
- [x] 6.3 迁移 `smart-testing`：编写 `skill.cn.md`，占位内容标注"待完善"
- [x] 6.4 迁移 `aic-time-eye`：编写 `skill.cn.md`，占位内容标注"待完善"
- [x] 6.5 迁移 `business-issue-feedback`：编写 `skill.cn.md`，占位内容标注"待完善"

## 7. 现有技能迁移 — 工具类技能

- [x] 7.1 迁移 `browser-page-refresh`：编写 `skill.cn.md`，将页面刷新能力用自然语言描述
- [x] 7.2 迁移 `website-outline`：编写 `skill.cn.md`，将网站大纲扫描能力用自然语言描述，工具调用由 AI 自主判断
- [x] 7.3 迁移 `test-data-generation`：编写 `skill.cn.md`，将测试数据生成流程用自然语言描述，taskCard 交互通过 `ask_user` + `display_table` 基础组件描述替代

## 8. 清理与验证

- [x] 8.1 删除所有 `skills/*/index.js` 文件（迁移完成后）
- [x] 8.2 验证技能 Tab 正确展示所有技能，分类分组正确
- [x] 8.3 验证技能详情弹窗正确渲染 MD 内容
- [x] 8.4 验证斜杠命令面板正常列出所有技能
- [x] 8.5 验证技能激活后系统 prompt 正确注入 MD 正文内容
- [x] 8.6 验证基础组件（询问卡、授权卡、表格卡、下载卡）在 AI 对话中正常工作
- [x] 8.7 验证语言切换：切换中英文界面后技能列表名称、详情页内容正确对应
- [x] 8.8 整体回归测试：打开插件 → 查看技能 → 使用技能对话 → 验证基础组件交互
