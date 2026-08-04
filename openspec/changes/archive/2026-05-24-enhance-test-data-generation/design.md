## Context

aiHelper Chrome 扩展的 `test-data-generation` Skill 已实现基础的单接口测试数据生成，通过 `get_captured_requests` 获取页面 HTTP 请求、`execute_request` 注入脚本执行请求。当前存在两个关键局限：

1. **请求数据缺失**：`get_captured_requests` 依赖 webRequest API 捕获的请求，但用户可能在未触发目标操作（如未点击"保存"按钮）前就请求造数据，导致捕获列表为空或不含目标接口。需要一种方式触发页面重新加载以捕获请求。
2. **单接口限制**：许多业务场景中，创建一条记录需要先创建其依赖项（如"创建开销记录"需要先有"开销分类"）。当前 taskCard 仅支持单个 API 接口，无法表达多步骤的先后依赖关系。

架构上，当前 Skill 系统通过 `__registerSkill()` 注册，每个 Skill 提供 tools、prompt 和 UIDelegate。tools 通过 handler 函数调用 `chrome.runtime.sendMessage` 与 Background Service Worker 通信，Background 再通过 `chrome.scripting.executeScript` 注入脚本或直接 fetch 请求。

## Goals / Non-Goals

**Goals:**
- 提供通用页面刷新工具 `refresh_page`，任何 Skill 均可使用
- `test-data-generation` Skill 的 prompt 规则中增加"请求数据不足时自动刷新页面"逻辑
- 新增 `combinedTaskCard` 类型，支持多步骤有序任务卡片（步骤间有先后依赖关系）
- 组合任务卡片 UI 清晰展示步骤顺序和依赖关系
- 用户授权后，智能体按步骤顺序逐步执行，前一步失败则跳过后续依赖步骤

**Non-Goals:**
- 不实现通用的步骤间数据传递（如步骤1的返回值注入步骤2的 bodyTemplate）。当前通过预定义模板处理，后续按需扩展
- 不支持并发执行多个步骤
- 不过度修改现有 `taskCard` 格式，保持向后兼容

## Decisions

### Decision 1: refresh_page 作为独立 Skill 工具注册

**方案**：创建新的 Skill `browser-page-refresh`，提供 `refresh_page` 工具。Background Service Worker 新增 `REFRESH_PAGE` 消息处理，调用 `chrome.tabs.reload()`。

```
Panel (chat.js) → sendMessage(REFRESH_PAGE) → Background → chrome.tabs.reload()
```

**替代方案考虑**：将 `refresh_page` 直接作为通用工具加入 `chat.js` 的 `TOOLS` 数组。被拒绝原因：打破 Skill 模块化设计原则，工具应归属特定 Skill。

**理由**：遵循现有 Skill 架构模式（`test-data-generation` Skill 自包含所有工具），`browser-page-refresh` 作为独立 Skill，可被任何场景复用。

### Decision 2: Auto-refresh 通过 prompt 规则实现

**方案**：在 `test-data-generation` Skill 的 getPrompt() 中新增规则：「如果 `get_captured_requests` 返回空或未找到目标接口的请求，先调用 `refresh_page` 刷新页面，等待页面加载完成后重新调用 `get_captured_requests`」。

AI 在执行流程中：
1. 调用 `get_captured_requests` → 返回空或不含目标接口
2. 调用 `refresh_page` → 页面重新加载
3. 等待 2-3 秒（通过 prompt 指示 AI 在刷新后等待）
4. 再次调用 `get_captured_requests` → 获取到刷新后产生的请求

**替代方案考虑**：在 `get_captured_requests` handler 中自动检测并刷新。被拒绝原因：刷新是破坏性操作（可能丢失用户未保存数据），必须由 AI 判断后主动触发，让用户有感知。

**理由**：通过 prompt 规则控制刷新行为，AI 可根据上下文判断是否需要刷新（如请求列表非空但缺少特定接口时），保持灵活性。刷新前 AI 会在聊天消息中说明将执行刷新操作。

### Decision 3: combinedTaskCard 格式设计

**方案**：新增 `combinedTaskCard` JSON 格式，与现有 `taskCard` 并列但结构不同：

```json
{
  "combinedTaskCard": {
    "title": "创建开销记录",
    "description": "先创建开销分类，再批量创建开销记录",
    "steps": [
      {
        "name": "创建开销分类",
        "url": "https://api.example.com/api/categories",
        "method": "POST",
        "headers": {},
        "bodyTemplate": "{\"name\":\"测试分类\"}",
        "count": 1,
        "templatePreview": { "columns": ["name"], "rows": [["测试分类"]] }
      },
      {
        "name": "创建开销记录",
        "url": "https://api.example.com/api/expenses",
        "method": "POST",
        "headers": {},
        "bodyTemplate": "{\"categoryId\":\"<上一步创建的分类ID>\",\"amount\":{{random}},"description":"测试开销-{{index}}"}",
        "count": 5,
        "dependsOn": 0,
        "templatePreview": { "columns": ["categoryId", "amount", "description"], "rows": [["<分类ID>", "100", "测试开销-1"]] }
      }
    ]
  }
}
```

**关键字段说明**：
- `steps[].dependsOn`：该步骤依赖的步骤索引（从 0 开始），执行时前一步失败则跳过该步骤
- `title`：整个组合任务的标题
- `description`：任务说明，解释各步骤作用和依赖关系

**替代方案考虑**：扩展现有 `taskCard` 增加 `steps` 字段。被拒绝原因：命名冲突导致解析代码复杂，且单步骤和多步骤在 UI 和执行逻辑上差异大，分类型处理更清晰。

**理由**：使用独立的 `combinedTaskCard` 键名，与现有 `taskCard` 互斥（一个消息中只会出现一种），UI 渲染逻辑可清晰分支。

### Decision 4: 组合任务卡片的 UI 展示

**方案**：组合任务卡片渲染为垂直步骤列表，步骤间用箭头或编号连接线表示先后顺序。每个步骤是一个子卡片，显示步骤名称、URL、方法、模板预览。

```html
<div class="combined-task-card">
  <div class="task-card-header">创建开销记录</div>
  <div class="task-card-desc">先创建开销分类，再创建开销记录</div>
  <ol class="task-card-steps">
    <li class="task-card-step">步骤1: 创建开销分类 [POST] /api/categories</li>
    <li class="task-card-step depends-on-1">步骤2: 创建开销记录 [POST] /api/expenses (依赖步骤1)</li>
  </ol>
  <div class="task-card-actions">[允许执行] [取消]</div>
</div>
```

执行时高亮当前正在执行的步骤，已完成步骤显示 ✓ 标记。

**理由**：步骤式展示比嵌套卡片更直观，编号和连接线清晰表达先后关系。`depends-on-N` 类名提示用户哪些步骤有依赖。

## Risks / Trade-offs

- **[页面刷新风险] 刷新可能丢失用户未保存数据** → AI 在调用 `refresh_page` 前必须在聊天消息中说明原因（"未捕获到目标请求，需要刷新页面以重新捕获"），给用户心理预期。刷新是用户可见可感知的操作。
- **[刷新时机风险] 刷新后请求捕获窗口不足** → prompt 指示 AI 在刷新后等待 2-3 秒再调用 `get_captured_requests`，确保请求已被 webRequest API 捕获。
- **[步骤依赖风险] 前置步骤失败导致后续步骤无法执行** → 执行逻辑中，如果某步骤所有请求失败，则跳过所有 `dependsOn` 指向该步骤的后续步骤，并在结果摘要中标记为"跳过（前置步骤失败）"。
- **[兼容性风险] 现有 taskCard 逻辑不受影响** → `parseTaskCardFromText` 函数扩展判断 `combinedTaskCard` 键，与现有 `taskCard` 键互斥，不改变现有行为。
