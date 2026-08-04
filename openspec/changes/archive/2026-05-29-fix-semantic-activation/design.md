## Context

当前两套激活路径：
- 手动：`selectSlashSkill(skillId)` / panel "使用"按钮 → `registry.activate()` → `renderSkillStatusBar()` → 注入 `buildActiveSkillPrompt()`
- 语义：无入口，AI 只能看目录

两套路径各自调 `registry.activate()`，逻辑重复但行为一致。

## Goals / Non-Goals

**Goals:**
- 提取共享 `activateSkill(skillId)` 函数，手动和语义激活统一入口
- 新增 `activate_skill` 工具让 AI 可调用，返回完整 `getPrompt()` 正文
- 两种激活方式行为完全一致（状态栏 tag、激活状态）

**Non-Goals:**
- 不改变 `doSendMessage` 的 deactivate 逻辑
- 不改变 `buildSkillDirectory()` / `buildActiveSkillPrompt()` 核心逻辑

## Decisions

### 决策 1：提取 `activateSkill(skillId)` 共享函数

**选择**：在 `chat.js` 中新增 `activateSkill(skillId)` 函数，封装激活逻辑：

```javascript
function activateSkill(skillId) {
  var registry = window.__getSkillRegistry();
  var all = registry.getAll();
  var skill = null;
  for (var i = 0; i < all.length; i++) {
    if (all[i].id === skillId) { skill = all[i]; break; }
  }
  if (!skill) {
    return { activated: false, error: 'skill not found: ' + skillId };
  }
  registry.activate(skillId);  // triggers renderSkillStatusBar via _notify
  return {
    activated: true,
    skillId: skill.id,
    name: skill.name,
    prompt: skill.getPrompt ? skill.getPrompt() : ''
  };
}
```

**调用方**：
- `selectSlashSkill(skillId)` → 调用 `activateSkill(skillId)` 后设置输入框 UI
- panel "使用"按钮 → 调用 `activateSkill(skillId)` 后切换 tab
- `activate_skill` 工具 handler → 调用 `activateSkill(skillId)` 后返回 JSON 给 AI

**理由**：
- 单一真相源：激活逻辑只在一处
- 自动触发状态栏：`registry.activate()` → `_notify()` → `renderSkillStatusBar()`
- 返回结构化结果：调用方按需使用（UI 忽略，工具返回给 AI）

### 决策 2：`activate_skill` 工具 handler 直接复用共享函数

**选择**：工具 handler 只做两件事：调 `activateSkill(skillId)` + `JSON.stringify(result)`。

**理由**：
- 零重复逻辑
- 工具定义在 `TOOLS` 数组中（AI 可发现），处理逻辑在 `executeToolCall` 中（单行调用）

### 决策 3：不改变手动激活的 UI 行为

**选择**：`selectSlashSkill()` 和 panel "使用"按钮在调用 `activateSkill()` 后保留原有 UI 操作（设置输入框文本、切换 tab），但不使用返回值。

**理由**：
- 手动激活的 prompt 注入仍由 `buildActiveSkillPrompt()` 在 `doSendMessage` 时完成
- 共享函数的返回值在 UI 路径中无需使用

## Risks / Trade-offs

- **[两套 prompt 注入方式并行]**：手动激活用 `buildActiveSkillPrompt()` 预注入，语义激活用 tool result 后注入 → 可接受，两种方式覆盖不同场景（预知 vs 运行时决策）
- **[activateSkill 返回值在手动路径中被忽略]**：不算浪费，结构化返回值对未来扩展有价值
