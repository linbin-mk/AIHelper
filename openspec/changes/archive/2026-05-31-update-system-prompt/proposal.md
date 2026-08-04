## Why

当前 `systemPrompt` 将 AI 定位为"HTTP 请求分析助手"，但 README 已将产品定义为"浏览器 AI Agent「小A」"——集成 AI 对话、Agent 自主执行、网络请求分析、可扩展技能生态、知识库与长期记忆于一体。系统提示词是 AI 行为的核心约束，其内容必须与产品实际能力对齐，否则 AI 会在对话中表现出局限的自我认知，无法充分利用 27 个内置工具和技能系统。

## What Changes

- 更新 `systemPrompt.role`：从"HTTP 请求分析助手"改为"浏览器 AI Agent"，反映 Agent 自主执行、页面操作、知识检索等完整能力
- 更新 `systemPrompt.rule1`：扩展规则覆盖范围，不再仅限于"分析 API 请求"，包括页面操作、知识检索、记忆管理、文件保存等多类工具
- 更新 `systemPrompt.rule2`：保留请求为空的引导建议
- 更新 `systemPrompt.rule3`：保留并行工具调用效率策略
- 更新 `systemPrompt.rule4`：保留写操作授权安全约束
- 更新 `systemPrompt.rule5`：保留技能感知行为
- 新增规则：要求 AI 区分"通用知识"和"当前页面/项目相关"两类任务，根据任务类型选择合适的工具策略
- 新增规则：要求 AI 优先搜索记忆中的功能地图文件来回答位置类问题
- 新增规则：涉及技能时，必须调用 `activate_skill` 工具获取完整规则后方可执行
- 中英文双语同步更新

## Capabilities

### New Capabilities
- `system-prompt-content`: 定义系统提示词 `role` 和各条 `rule` 的中英文内容规范，确保其覆盖产品 README 描述的全部核心能力

### Modified Capabilities
- `agents-md-cache`: 系统提示词默认内容变更，首次使用或用户重置时将生成新的系统提示词文本，但缓存机制和编辑器行为不变

## Impact

- 影响文件：`chrome-extension/src/panel/i18n.js`（`systemPrompt` 翻译条目）
- 影响流程：AI 对话时 system prompt 内容变更，AI 行为模式可能改变
- 不影响：UI 文本、缓存逻辑、编辑器功能
