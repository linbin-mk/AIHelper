## 1. Skill 定义变更

- [x] 1.1 为 `skills/test-data-generation/index.js` 添加 `category: '测试'` 字段
- [x] 1.2 为 `skills/browser-page-refresh/index.js` 添加 `category: '基础'` 字段
- [x] 1.3 创建 `skills/system-qa/index.js`：占位 Skill 系统解答专家（category: "通用"）
- [x] 1.4 创建 `skills/system-usage/index.js`：占位 Skill 系统功能使用（category: "通用"）
- [x] 1.5 创建 `skills/rd-manhour-estimation/index.js`：占位 Skill 研发人天预估（category: "业务"）
- [x] 1.6 创建 `skills/business-issue-feedback/index.js`：占位 Skill 业务问题反馈（category: "业务"）
- [x] 1.7 创建 `skills/requirement-summary/index.js`：占位 Skill 需求分析总结（category: "产品"）
- [x] 1.9 创建 `skills/smart-testing/index.js`：占位 Skill 智能测试（category: "测试"）

## 2. panel.html 结构变更

- [x] 2.1 在 `panel.html` 中引入新增的 7 个 Skill 文件的 `<script>` 标签
- [x] 2.2 重构 `#tab-skills` DOM 结构：移除 `#skillsList` 单层容器，改为分类分组容器 `#skillsCategories`
- [x] 2.3 在 `#tab-skills` 底部添加弹窗 DOM：`#skillDetailOverlay` > `#skillDetailPopup`（含标题区、正文区、使用按钮和关闭按钮）

## 3. panel.css 样式变更

- [x] 3.1 移除旧的 `.skill-card`、`.skill-card-name`、`.skill-card-desc`、`.skill-card-tools`、`.skill-card-tool-tag`、`.skill-card-hint` 样式
- [x] 3.2 新增分类分组样式：`.skill-category`、`.skill-category-title`
- [x] 3.3 新增紧凑技能行样式：`.skill-row`、`.skill-row-name`、`.skill-row-desc`、hover 效果
- [x] 3.4 新增弹窗样式：`.skill-detail-overlay`（遮罩）、`.skill-detail-popup`（弹窗容器）、`.skill-detail-header`（标题+操作区）、`.skill-detail-title`（标题）、`.skill-detail-actions`（按钮容器）、`.skill-detail-use-btn`（使用按钮）、`.skill-detail-close-btn`（关闭按钮）、`.skill-detail-body`（正文区）、`.skill-detail-section`（区块容器）、`.skill-detail-section-title`（区块标题）、`.skill-detail-section-content`（区块内容）、`.skill-detail-tags`（工具标签容器）、`.skill-detail-tag`（工具标签）

## 4. panel.js 逻辑变更

- [x] 4.1 更新 `getToolDisplayName()`（如果有）中新增 Skill 工具名称的映射（占位 Skill 无工具，暂无需修改）
- [x] 4.2 重写 `renderSkillsList()` 函数：按分类分组遍历 `registry.getAll()`，为每个分类渲染分组标题和技能行列表；检查调试模式设置，非调试模式下跳过 `category === '基础'` 的分组
- [x] 4.3 新增 `showSkillDetail(skill)` 函数：弹窗标题 `skill.name`，正文按顺序渲染四个区块：描述（`skill.description`）、方法集合（`skill.getTools()` 标签列表）、技能规则（`renderMarkdown(skill.getPrompt())`）、使用方式（`输入 /skill-id 或直接描述需求即可使用`），显示弹窗
- [x] 4.4 新增 `hideSkillDetail()` 函数：隐藏弹窗
- [x] 4.5 弹窗背景遮罩点击事件：关闭弹窗
- [x] 4.6 弹窗关闭按钮（×）点击事件：关闭弹窗
- [x] 4.7 弹窗"使用"按钮点击事件：切换到聊天 Tab → `registry.activate(skillId)` → `#chatInput` 填入 `/skill-id `，光标定位末尾
- [x] 4.8 技能行点击事件绑定：点击行调用 `showSkillDetail(skill)`
- [x] 4.9 监听 `skillRegistry.onSkillEvent()`：Skills Tab 可见时刷新列表
- [x] 4.10 扩展 `applyDebugMode()`：切换调试模式时，若当前在技能 Tab 则刷新技能列表

## 5. 验证

- [x] 5.1 打开"技能"Tab（非调试模式），验证展示 8 个 Skill，不显示"基础"分类和"页面刷新"
- [x] 5.2 开启调试模式，验证"基础"分类出现在底部，包含"页面刷新"技能行
- [x] 5.3 在技能 Tab 页面切换调试模式开关，验证列表实时刷新
- [x] 5.4 点击"测试数据生成"技能行，验证弹窗展示四个区块：描述、方法集合（5个工具标签）、技能规则（Markdown渲染）、使用方式（/test-data-generation）
- [x] 5.5 点击占位 Skill（如"智能测试"），验证弹窗展示占位说明
- [x] 5.6 在弹窗中点击"使用"按钮，验证切换到聊天 Tab、Skill 被激活、输入框填入 `/test-data-generation `
- [x] 5.7 点击弹窗背景遮罩和 × 按钮，验证弹窗关闭
- [x] 5.8 在聊天中通过 `/test-data-generation` 和 `/smart-testing` 斜杠命令正常激活 Skill
- [x] 5.9 验证现有功能不受影响：斜杠命令面板、Skill 状态指示器、Agent 工具调用
