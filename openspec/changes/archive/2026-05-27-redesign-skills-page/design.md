## Context

当前"技能"Tab 以完整卡片展示 Skill 信息（名称、描述、工具标签、使用提示），每个卡片占用大量垂直空间。随着 Skill 从 2 个扩展到 7 个，需要紧凑的布局。同时用户需要一种方式在不切换到聊天 Tab 的情况下预览 Skill 的 prompt 规则内容，并能快速触发使用。

约束：Chrome Extension 环境，纯 JS/HTML/CSS，无构建工具。

## Goals / Non-Goals

**Goals:**
- 技能 Tab 改版为分类分组 + 紧凑行列表，Card → Row
- 新增分类体系，Skill 可通过 `category` 字段声明归属
- 点击技能行弹出详情弹窗，展示 `getPrompt()` 完整内容
- 弹窗右上角"使用"按钮：切换到聊天 Tab、激活 Skill、填入 `/skill-id `
- 新增 6 个占位 Skill，按分类分布
- 现有 2 个 Skill 添加 `category` 字段（不改变行为）

**Non-Goals:**
- 不改变 Skill 注册、激活、Prompt 注入、工具分发的核心逻辑
- 不改变斜杠命令面板
- 占位 Skill 暂不提供实际工具和 Prompt（后续迭代完善）

## Decisions

### Decision 1: 分类体系设计

分类硬编码在渲染层，Skill 定义中声明 `category` 字段。

```js
// Skill 定义新增字段
category: '测试'  // 可选，不提供则归入"其他"
```

分类顺序固定：通用 → 业务 → 产品 → 开发 → 测试 → 基础 → 其他

```
┌─────────────────────────────┐
│  通用                        │
│  📋 系统解答专家              │
│  📋 系统功能使用              │
├─────────────────────────────┤
│  业务                        │
│  📋 研发人天预估              │
│  📋 业务问题反馈              │
├─────────────────────────────┤
│  产品                        │
│  📋 需求分析总结              │
├─────────────────────────────┤
│  开发                        │
│  （暂无技能）                 │
├─────────────────────────────┤
│  测试                        │
│  📋 测试数据生成              │
│  📋 智能测试                  │
├─────────────────────────────┤
│  基础                        │
│  📋 页面刷新                  │
└─────────────────────────────┘
```

**备选方案**：从 Skill 定义中读取自定义顺序 → 拒绝，9 个 Skill 无需动态排序，硬编码排序更简单可靠。

### Decision 7: "基础"分类调试模式可见

"基础"分类（当前仅含"页面刷新"）属于底层辅助工具 Skill，普通用户无需感知。SHALL 仅在使用者开启"调试模式"时在技能 Tab 中展示。

```
renderSkillsList()
  │
  ├─ 非调试模式：通用 → 业务 → 产品 → 开发 → 测试（跳过基础）
  └─ 调试模式：  通用 → 业务 → 产品 → 开发 → 测试 → 基础
```

实现方式：`renderSkillsList()` 渲染时检查调试模式设置，非调试模式下跳过 `category === '基础'` 的 Skill。`applyDebugMode()` 扩展为：切换到调试模式时刷新技能列表。

**备选方案**：Skill 自身声明可见性 → 拒绝，可见性规则属于 UI 层关注点，不应下放到 Skill 定义。

### Decision 2: 技能行结构（紧凑行）

每行 = 标题 + 简短描述，替代原来的完整卡片。

```
┌────────────────────────────────────────┐
│ 测试数据生成                            │
│ AI驱动的测试数据批量生成...              │
└────────────────────────────────────────┘
```

左侧可加一个视觉标记（色条/图标），区分分类。移除工具标签列表和使用提示文字。

**备选方案**：纯文本列表 → 拒绝，需要可点击行高亮和 hover 效果来引导交互。

### Decision 3: 弹窗内容展示

点击技能行弹出模态弹窗，按以下区块展示 Skill 的完整信息：

```
┌─────────────── 弹窗 ───────────────┐
│  测试数据生成                    [使用]│
│  ─────────────────────────────────── │
│                                      │
│  描述                                │
│  AI驱动的测试数据批量生成，分析当前...│
│                                      │
│  方法集合                            │
│  [get_captured_requests] [get_page_context] │
│  [extract_auth_token] [execute_request]     │
│                                      │
│  技能规则                            │
│  **测试数据生成技能规则：**           │
│  **核心规则（两条）：**               │
│  1. 所有数据写入操作必须先收集...     │
│  ...                                 │
│                                      │
│  使用方式                            │
│  输入 /test-data-generation 或直接   │
│  描述需求即可使用                     │
└──────────────────────────────────────┘
```

弹窗内容按以下顺序排列四个区块，用分割线隔开：

1. **描述**：Skill 的 `description` 字段，普通文本
2. **方法集合**：`skill.getTools()` 返回的工具列表，以标签形式展示工具名称（无工具时显示"无"）
3. **技能规则**：`skill.getPrompt()` 经 `renderMarkdown()` 渲染
4. **使用方式**：`输入 /skill-id 或直接描述需求即可使用`（skill-id 用实际 id 替换）

- "使用"按钮行为：切换到聊天 Tab → 激活 Skill → 输入框填入 `/skill-id `，光标定位在空格后
- 弹窗标题为 Skill 的 `name` 字段
- 点击弹窗背景遮罩或右上角 × 关闭

**备选方案**：仅展示 Prompt → 拒绝，原卡片的信息（描述、方法集合、使用方式）应保留在弹窗中。}

### Decision 4: 占位 Skill 定义

占位 Skill 是完整的 Skill 定义（有 id、name、description、category），但 `getPrompt()` 暂时返回简短说明，`getTools()` 返回空数组，`getUIDelegate()` 返回 null。

```js
// 占位 Skill 示例
window.__registerSkill({
  id: 'smart-testing',
  name: '智能测试',
  description: 'AI驱动的智能测试用例生成和执行',
  category: '测试',
  getPrompt: function () { return '（智能测试技能 - 待完善）'; },
  getTools: function () { return []; },
});
```

**未来**：各占位 Skill 可在后续变更中逐步添加实际 Prompt 规则和工具。

### Decision 5: 弹窗"使用"按钮实现

弹窗"使用"按钮需要跨 Tab 操作，涉及：
1. 切换到聊天 Tab
2. 调用 `registry.activate(skillId)`
3. 设置 `chatInputEl.value = '/' + skillId + ' '`，光标定位末尾

这些操作依赖 `panel.js` 和 `chat.js` 中已有的全局函数和变量。弹窗按钮的实现放在 `panel.js` 中，因为 `skill-registry.js` 是纯数据层，不能依赖 UI。

### Decision 6: 弹窗 DOM 位置

弹窗 DOM 放在 `#tab-skills` 内部，作为技能 Tab 的绝对定位子元素。不需要全局模态层。

```html
<div id="tab-skills" class="tab-content">
  <!-- 分类分组内容 -->
  <div class="skill-detail-overlay hidden" id="skillDetailOverlay">
    <div class="skill-detail-popup">
      <div class="skill-detail-header">
        <span class="skill-detail-title"></span>
        <div class="skill-detail-actions">
          <button class="skill-detail-use-btn">使用</button>
          <button class="skill-detail-close-btn">&times;</button>
        </div>
      </div>
      <div class="skill-detail-body"></div>
    </div>
  </div>
</div>
```

## Risks / Trade-offs

- **[复杂度] renderSkillsList 重写**：`panel.js` 中 `renderSkillsList()` 需完全重写，同时新增弹窗逻辑。→ 保持函数间职责清晰：`renderSkillsList()` 只负责列表渲染，弹窗逻辑独立为 `showSkillDetail(skill)` / `hideSkillDetail()`。
- **[兼容性] 现有 Skill 未声明 `category`**：渲染时视为"其他"分类，不报错。→ 给现有 2 个 Skill 添加 `category` 字段。
- **[性能] 7 个 Skill 渲染无明显性能问题**：当前轻量 DOM 操作，无需虚拟滚动。

## Open Questions

- 占位 Skill 的 Prompt 规则何时完善？→ 非本次变更范围，在后续独立变更中逐一添加。
- 弹窗是否需要展示工具列表？→ 暂不需要，Prompt 内容已足够。如需展示可后续迭代。
