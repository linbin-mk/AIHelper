## 1. 技能文件创建 — openspec-explore

- [x] 1.1 创建 `chrome-extension/skills/openspec-explore/index.js`，实现技能注册对象：id `openspec-explore`，name "OpenSpec 探索"，category "基础"，description "需求探索与分析，不产生文件"
- [x] 1.2 实现 `getPrompt()` 函数，返回探索模式引导规则（需求分析框架、技术可行性评估、方案对比维度），明确规定不写入任何文件

## 2. 技能文件创建 — openspec-propose

- [x] 2.1 创建 `chrome-extension/skills/openspec-propose/index.js`，实现技能注册对象：id `openspec-propose`，name "OpenSpec 提案"，category "基础"，description "创建变更提案，生成 proposal/design/specs/tasks"
- [x] 2.2 实现 `getPrompt()` 函数，返回提案阶段规则：变更名称推导逻辑、artifact 生成顺序、各 artifact 模板（proposal.md / design.md / tasks.md 结构）、记忆存储路径 `{hostname}/openspec/changes/{change-name}/`

## 3. 技能文件创建 — openspec-apply

- [x] 3.1 创建 `chrome-extension/skills/openspec-apply/index.js`，实现技能注册对象：id `openspec-apply`，name "OpenSpec 实现"，category "基础"，description "按任务清单逐步实现变更"
- [x] 3.2 实现 `getPrompt()` 函数，返回实现阶段规则：读取 tasks.md + design.md 获取上下文、按依赖顺序逐步实现、每完成一项标记 `[x]`、更新记忆文件

## 4. 技能文件创建 — openspec-archive

- [x] 4.1 创建 `chrome-extension/skills/openspec-archive/index.js`，实现技能注册对象：id `openspec-archive`，name "OpenSpec 归档"，category "基础"，description "归档已完成的变更"
- [x] 4.2 实现 `getPrompt()` 函数，返回归档阶段规则：检查 tasks.md 完成度、移动到 `archive/` 子目录、记录归档元信息

## 5. 技能注册集成

- [x] 5.1 在 `chrome-extension/src/panel/panel.html` 中，按工作流顺序（explore → propose → apply → archive）依次添加 4 个技能的 `<script>` 标签引用，确保 4 个技能在页面加载时自动注册

## 6. 记忆系统集成（共享层）

- [x] 6.1 创建 `chrome-extension/src/panel/output-files.js`，实现独立的"工作产物"卡片系统，包括 init/save/search/get/delete 全套函数
- [x] 6.2 在 chat.js 中新增 `save_output_file`、`get_output_file`、`search_output_files` 三个工具定义和处理器
- [x] 6.3 在 panel.html 中引入 output-files.js；4 个 skill prompt 全部改用 output 工具，增加严格的文件命名约束（禁止 README.md 等自创名）

## 7. 技能分类与可见性

- [x] 7.1 确保 4 个技能均声明 `category: '基础'`，按工作流顺序（explore → propose → apply → archive）排在现有基础技能（页面刷新、建立网站大纲）之后
- [x] 7.2 验证"基础"分类的调试模式可见性规则适用于 4 个新技能 — 基础分类规则在 `skill-category-system` 中已定义，`category: '基础'` 的 skill 自动遵循调试模式可见性，无需额外代码

## 8. 端到端验证

- [ ] 8.1 验证 openspec-explore：激活后 AI 进入思考模式分析需求，不产生任何文件
- [ ] 8.2 验证 openspec-propose：输入变更描述后 AI 生成完整 artifacts（proposal/design/specs/tasks），存入记忆系统
- [ ] 8.3 验证 openspec-apply：AI 读取已有变更的 tasks.md 并按顺序实现，每步标记状态
- [ ] 8.4 验证 openspec-archive：AI 检查完成度后将变更移动到归档目录
- [ ] 8.5 验证 4 个技能独立激活互不干扰，可通过斜杠命令 `/openspec-*` 分别调用
- [ ] 8.6 验证记忆系统：`search_memories` 支持路径前缀过滤，`buildMemoryHint` 正确展示变更概览
