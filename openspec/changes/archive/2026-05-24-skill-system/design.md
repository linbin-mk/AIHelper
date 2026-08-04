## Context

当前 AI Chat 系统所有能力（工具定义、系统 prompt 规则、taskCard 处理、UI 渲染）全部硬编码在 `chat.js` 中。新增任何 AI 能力都需要修改核心文件，无法按需组合。例如"测试数据创建"的整个过程——从 prompt 规则到 taskCard UI 到执行按钮——都散落在 `chat.js` 的不同函数中，没有清晰的边界。

目标是将 AI 能力抽象为 **Skill**：每个 Skill 是 prompt + tools + UI 的自包含模块，通过 Registry 统一管理。用户可在新增的"技能"Tab 中查看和切换 Skill。

约束：Chrome Extension 环境，纯 JS/HTML/CSS，无构建工具，无 npm 模块系统。

## Goals / Non-Goals

**Goals:**
- 定义 Skill 抽象接口：每个 Skill 提供 `id`、`name`、`prompt`、`tools`、`uiFactory`（可选）
- 实现 `SkillRegistry`：注册、激活/停用、查询、事件通知
- 重构 `chat.js`：Agent Loop 的 prompt 构建和工具分发改为 Skill 驱动
- Panel 新增"技能"Tab，以只读目录形式展示已注册 Skill 列表
- 将"测试数据创建"抽离为独立 Skill `test-data-generation`，不依赖 `chat.js` 内的硬编码逻辑
- 输入框"`/`"触发斜杠命令面板，支持鼠标/键盘选择 Skill，临时激活
- 聊天框底部展示当前激活 Skill 的 tag 列表，支持点击 × 快速停用
- 保持现有用户交互流程不变（聊天 → taskCard → 确认执行）

**Non-Goals:**
- 不支持动态加载外部 Skill 文件（本地文件系统）。所有 Skill 内嵌在扩展中
- 不支持 Skill 间依赖或编排
- 不改变现有 API（chrome.runtime.sendMessage 协议保持不变）
- 不引入构建工具或模块系统

## Decisions

### Decision 1: Skill 数据结构

```js
interface SkillDefinition {
  id: string;           // 唯一标识，如 "test-data-generation"
  name: string;         // 显示名称，如 "测试数据生成"
  description: string;  // 简短描述
  getPrompt: () => string;          // 注入到系统 prompt 的规则片段
  getTools: () => ToolDefinition[]; // 该 Skill 使用的工具定义
  getUIDelegate: () => SkillUIDelegate | null; // UI 扩展点（可选）
}

interface SkillUIDelegate {
  onMessageParsed: (messageEl, parsedText) => boolean; // 识别并渲染自定义内容（如 taskCard），返回 true 表示已处理
  onActivate?: () => void;
  onDeactivate?: () => void;
}
```

**备选方案**：JSON 声明式 Skill（纯配置文件）- 工具处理逻辑仍需 JS，声明式无法覆盖运行时行为。

**选择原因**：JS 对象注册方式与当前代码风格一致，无需额外解析层。工具处理函数直接附着在 Skill 上，不用散落到别处。

### Decision 2: Skill 注册方式

Skill 文件采用**自注册**模式。每个 `skills/*/index.js` 文件加载时通过 `window.__registerSkill(skillDefinition)` 自行注册到全局 Registry。`panel.js` 不做任何注册调用。

```
chrome-extension/skills/test-data-generation/index.js:

  window.__registerSkill({
    id: 'test-data-generation',
    name: '测试数据生成',
    description: '...',
    getPrompt: () => '...',
    getTools: () => [...],
    getUIDelegate: () => ({...})
  });
```

**新增 Skill 只需两步**：
1. 在 `skills/` 下创建 `skill-name/index.js`，文件内自注册
2. 在 `panel.html` 中加一行 `<script src="../../skills/skill-name/index.js">`

**为什么不能零脚本标签**：Chrome Extension 无文件系统 API，HTML 必须显式声明加载的脚本。这是浏览器沙箱的根本限制。

`SkillRegistry` 内部在 `register()` 时自动激活该 Skill（注册即激活）。停用仅通过状态指示器的 `×` 按钮临时终止。

### Decision 3: 系统 Prompt 组装方式

当前 `buildRequestContext()` 返回一个巨大的固定字符串。改造后，系统 prompt 分**两层**注入：

```js
function buildSystemPrompt() {
  const base = buildRequestContext();  // 基础上下文（身份设定、请求列表注入、通用行为规则）

  // 第1层：技能目录（所有已注册 Skill 的 name + description）
  const skillDir = buildSkillDirectory();  // 始终注入，无论激活状态

  // 第2层：已激活 Skill 的完整 prompt 规则
  const activePrompt = skillRegistry.getActive()
    .map(s => s.getPrompt())
    .join('\n\n---\n\n');

  return base
    + '\n\n' + skillDir
    + '\n\n## 已激活技能规则\n\n' + activePrompt;
}
```

**两层注入的意图**：
- **技能目录**（始终可见）：AI 知道所有 Skill 的存在和用途，能**自主判断**用户意图是否匹配某个 Skill
- **活跃规则**（仅激活 Skill）：完整的 prompt 规则（如 taskCard 格式、执行流程），只有激活的 Skill 才会被注入

**AI 自主激活规则**：当技能目录存在但未激活时，系统 prompt 包含引导语"如果用户请求明显匹配某个技能意图，你可以主动使用该技能的规则。但需向用户说明你正在使用该技能。" AI 自行决定是否应用某 Skill 的规则，无需专门 tool call。

base prompt 只保留"你是 HTTP 请求分析助手"身份 + 请求列表注入 + taskCard JSON 格式模板（确保 AI 始终知道正确格式）+ 通用行为规则。所有特定能力的详细规则（taskCard 格式、执行流程）同时保留在 Skill 的 prompt 中，激活时注入更详细的规则。

### Decision 4: 工具可见性与分发（统一 getAll）

工具可见性和分发**不区分激活状态**——所有已注册 Skill 的工具始终对所有 AI 调用可用。

```js
// buildMergedTools() — 发送给 LLM 的 tools 数组
all.forEach(skill => merge(skill.getTools()));

// executeToolCall(name, args) — 工具执行分发
all.forEach(skill => {
  const tool = skill.getTools().find(t => t.function.name === name);
  if (tool) return tool.handler(args);
});

// onMessageParsed 调度 — UI 渲染分发
all.forEach(skill => {
  if (skill.getUIDelegate()?.onMessageParsed(...)) break;
});
```

**激活**只控制两件事：
1. **Prompt 规则注入**（`getActive()` → `buildActiveSkillPrompt()`）
2. **状态栏显示**（`getActive()` → `renderSkillStatusBar()`）

工具、UI 渲染对所有已注册 Skill 始终可用——AI 无需显式激活即可输出 taskCard 并被正确渲染。安全边界由基础 prompt 中的约束保障（"必须先出 taskCard 再执行"）。

### Decision 5: taskCard 处理方式

`chat.js` 中 taskCard 的解析（正则匹配 JSON）、渲染（`renderTaskCard`）、执行（`handleTaskExecute`）全部移到 `test-data-generation` Skill 的 `SkillUIDelegate` 中。

`chat.js` 在处理 AI 返回文本时，先调用所有激活 Skill 的 `onMessageParsed`。如果返回 `true` 表示已处理，不再走默认 Markdown 渲染。

### Decision 6: "技能"Tab 位置与内容

在现有 Tab 栏中插入，排在 "AI 聊天" 之后：

```
[🔑] [AI 聊天] [技能] [请求监控] [资源管理]
```

"技能" Tab 是**只读目录**，用于展示当前扩展所有已注册的 Skill，每个 Skill 卡片显示：
- 名称和描述
- 关联的工具列表（标签展示）
- 使用提示："输入 /skill-id 或直接描述需求即可使用"

**不是控制面板**：此 Tab 不提供激活/停用开关。Skill 的激活完全由 AI 聊天中驱动（斜杠命令 或 AI 自主判断意图）。

### Decision 7: 文件组织

Skill 文件放在扩展根目录的 `skills/` 文件夹下，"技能"Tab 自动扫描展示。

```
chrome-extension/
├── skills/                      ← Skill 根目录（与 src/ 同级）
│   └── test-data-generation/
│       ├── index.js             # Skill 定义 + 工具处理 + UI delegate
│       ├── prompt.md            # Skill prompt 规则（被 index.js 引用）
│       └── tools.js             # 工具定义（被 index.js 引用）
├── src/
│   ├── panel/
│   │   ├── panel.html           # 引入 skill-registry.js + skills/*/index.js
│   │   ├── panel.css
│   │   ├── panel.js             # 初始化时注册 Skill
│   │   ├── chat.js              # Skill 驱动的 prompt 和工具分发
│   │   └── skill-registry.js    # SkillRegistry 实现
│   └── ...
└── manifest.json
```

**备选方案**：Skill 放 `panel/skills/` 子目录。选择根目录 `skills/` 是为了与 UI 层解耦，未来如果有非 panel 的 Skill 消费方（如 background.js）也方便引用。

### Decision 8: 斜杠命令面板

用户在聊天输入框中输入 `/` 时，弹出下拉面板展示所有已注册 Skill 的列表。交互方式与 Kilocode/VSCode 斜杠命令一致：

```
┌─────────────────────────────────────────────────┐
│  /                                               │
│  ┌─────────────────────────────────────────────┐ │
│  │ /test-data-generation                          │ │
│  │   AI驱动的测试数据批量生成，分析页面API并执行  │ │
│  │                                               │ │
│  │ (未来: /code-review , /api-debug ...)         │ │
│  └─────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────┐ │
│  │ 输入内容...                        [发送]    │ │
│  └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

**交互行为**：
- 输入框为空时输入 `/` → 弹出面板，列出所有 Skill
- 输入 `/` 后有字符（如 `/test`）→ 按前缀过滤匹配 Skill
- 鼠标点击某行 → 将对应 Skill 的 `id` 填入输入框：`/test-data-generation `（末尾带空格，光标定位在空格后），面板关闭
- 键盘 ↑↓ 选择行，高亮跟随移动；Enter 确认选择；Esc 关闭面板
- 面板可视化为绝对定位浮层，位于输入框正上方

**语义**：`/skill-id` 表示**本次对话（本轮 Agent Loop）启用该 Skill**。这是一种"临时激活"——不影响"技能"Tab 中的持久开关状态。临时激活和持久激活的 prompt 会合并注入。

**备选方案**：斜杠选择后直接持久激活 Skill → 拒绝，因为斜杠是"快速动作"，持久状态管理应该在 Tab 中完成。

**跨 CSS 作用域**：下拉面板必须是自身 DOM 内联样式控制，不能依赖 `panel.css` 中的全局选择器（因为 panel.css 是 Catppuccin 双主题，有 `data-theme` 切换）。

### Decision 10: AI 自主意图激活

除斜杠命令的显式激活外，AI SHALL 能够根据用户自然语言请求**自主判断**意图并匹配 Skill。激活方式仅有两种，均为临时生效：

```
┌────────────┬──────────────┬──────────────────────┐
│   方式      │   触发方式    │      生命周期         │
├────────────┼──────────────┼──────────────────────┤
│ 显式激活    │ 斜杠 /skill  │ 本轮对话              │
│ 自主激活    │ AI 判断意图   │ 本轮对话              │
└────────────┴──────────────┴──────────────────────┘
```

**自主激活流程**：

```
用户: "给我创建10条数据"（无 / 前缀）
         │
         ▼
系统 Prompt 包含：
  ## 已注册技能
  - test-data-generation: 批量创建测试数据...
  - code-review: 代码审查...

  ## 已激活技能规则
  (空——因无 Skill 激活)

  引导语: "若用户请求匹配某技能意图，主动使用该技能规则，并向用户说明"
         │
         ▼
AI 推理: 意图匹配 test-data-generation → 自主应用其规则
         │
         ▼
AI 回复开头: "我将使用「测试数据生成」技能来帮你创建数据...\n\n"
         接着: 分析页面 → 调用工具 → 生成 taskCard
         │
         ▼
UI: 状态指示器自动显示该 Skill tag（临时激活，本轮对话）
    用户仍须在 taskCard 上点击"允许执行"
```

**安全考量**：
- AI 自主激活不绕过安全边界——taskCard 的 "允许执行" 确认依然存在
- AI 自主激活的 Skill 同样标记为临时激活，本轮对话结束后自动清除
- 用户可在状态指示器的 tag 上点击 × 提前终止

**备选方案（拒绝）**：通过 `activate_skill` tool call 实现。增加一轮往返，体验下降。AI 在上游判断意图比多一次 tool call 更自然。

激活的 Skill 需在聊天界面可见，位于消息区域与输入框之间：

```
┌─────────────────────────────────────────────────┐
│  [AI 回复内容...]                                │
│                                                 │
├─────────────────────────────────────────────────┤
│ 🧩 测试数据生成 ×                                │
│                                                 │
│ ┌─────────────────────────────────────────────┐ │
│ │ /test-data-generation 帮我创建10个用户        │ │
│ └─────────────────────────────────────────────┘ │
│                                    [发送][停止]  │
└─────────────────────────────────────────────────┘
```

**交互**：
- 每个激活 Skill 显示为一个 tag：`[Skill名称 ×]`
- 点击 `×` 可快速终止该 Skill 的本次使用（tag 消失，当前对话不再使用该 Skill 的规则）
- tag 在两种情况下出现：
  1. 用户通过斜杠命令激活了 Skill
  2. AI 自主判断意图并激活了 Skill
- 所有激活均为**临时激活**（本轮对话生效，对话结束后自动清除）

**视觉**：所有 tag 使用统一样式（无持久/临时区分，因为不存在持久激活）。

**实现**：tag 区域为一个 `<div id="skillStatusBar">`，`skillRegistry` 事件触发时重新渲染。

## Risks / Trade-offs

- **[复杂度] Skill UI 覆盖机制**：`onMessageParsed` 需要返回 boolean 表示是否处理了消息内容，如果有多个 Skill 的 UI delegate 都想处理同一段内容（不太可能但存在），只有第一个返回 true 的生效。→ 文档约定每个 Skill 的 UI delegate 应该只处理自己特有的内容格式（如 taskCard 的特定 JSON 结构）。
- **[迁移风险] 测试数据创建功能中断**：重构 chat.js 时可能引入回归。→ 先实现 Skill 框架，保持 chat.js 原有逻辑不变，再将 test-data-generation 逐步迁移，每步可独立验证。
- **[性能] N 个 Skill 线性扫描工具**：当前 8 个工具，即使扩展到 20+ 也无需担心。→ 如果未来工具数量激增到 50+，再考虑 Map 索引优化。

## Migration Plan

1. 创建 `skill-registry.js` 和 Skill 框架
2. 重构 `chat.js` 的工具分发和 prompt 构建，接入 Registry（此时 Registry 为空，行为不变）
3. 创建 `test-data-generation` Skill，注册但不激活
4. 在 `chat.js` 中硬编码逻辑和 Skill 逻辑并存，通过 flag 切换验证
5. 确认 Skill 版本正常工作后，删除 `chat.js` 中的旧实现
6. 添加"技能"Tab UI

## Open Questions

- Q: 是否需要支持 Skill 配置参数（如"每次创建几条"的默认值）？→ 暂不需要，保持 Skill 简单。未来可通过 `SkillConfig` 扩展。
- Q: Skill 的 prompt 是否应该有 token 预算控制？→ 当前不控制。当 Skill 数量增多时再考虑 token 预算分配机制。
