## Context

当前 AIHelper 的技能创建流程是纯表单驱动：用户在弹窗中手动填写名称、描述、分类、提示词，然后保存。文件上传体系已有基础设施（`user-files.js` 的 `saveUserFile`、聊天附件 `handleFileSelect`），AI 搜索已有"跳转聊天并激活技能"的前例（`triggerSmartSearch` + `activateSkill('recommend-skill')`）。

本次变更复用这些现有机制，新增一条"AI 导入"通道：用户提交文本文件 → AI 分析 → 交互确认 → 一键创建技能。

### 约束
- 文件数量上限：5 个（与聊天附件上限一致）
- 文件类型白名单复用 `isFileTypeAllowed()`（`.txt`, `.md`, `.json`, `.js`, `.py` 等文本格式）
- 文件存储复用 `saveUserFile(sessionId + '/' + fileName, content)`，路径前缀为 AI 导入专用会话 ID
- 技能存储复用 `SkillRegistry.createUserSkill()` / `update()` / `unregister()`
- 通过 `sync.sh` 保持 Chrome / Firefox 双平台一致

## Goals / Non-Goals

**Goals:**
- 技能 Tab 新增「AI 导入」按钮，点击弹出文件多选面板（悬浮框）
- 支持多选文本文件（最多 5 个），确认后存入用户文件卡片
- 自动跳转 AI 聊天 Tab，向 AI 发送文件路径并激活 `smart-skill-create` 技能
- `smart-skill-create` 技能分析文本内容，通过 `ask_user` 卡片与用户交互确认技能信息
- 用户确认后 AI 调用 `create_skill` 工具完成创建
- 注册 `create_skill` / `update_skill` / `delete_skill` 到 TOOLS 数组供 AI 调用

**Non-Goals:**
- 不支持图片、PDF 等非文本文件（V1 仅文本）
- 不自动分类技能（AI 自行判断 category）
- 不支持一次性导入多个不相关的技能（由 AI 自行决定提炼为一个还是多个）
- 不提供导入历史记录（复用现有会话记录即可）

## Decisions

### 1. UI 布局

```
skills-create-bar
├── [+ 创建技能]  (现有)
└── [🤖 AI导入]   (新增，右侧)
```

「AI 导入」按钮位于 `skills-create-bar` 内部，`skillCreateBtn` 右边。使用与「创建技能」相同高度的按钮风格。

点击后弹出独立的悬浮面板（overlay），而非复用现有弹窗，因为文件选择交互与前两者完全不同：

```
┌─────────────────────────────────────┐
│  AI 导入技能                   [×]  │
│                                     │
│  ┌─────────────────────────────┐    │
│  │  📄 选择文本文件（最多5个）  │    │
│  │                             │    │
│  │  [+ 选择文件]               │    │
│  │                             │    │
│  │  已选文件列表：              │    │
│  │  📄 requirements.md  (2.1KB) │    │
│  │  📄 api-spec.json    (5.3KB) │    │
│  │  📄 user-guide.txt   (0.8KB) │    │
│  │                             │    │
│  └─────────────────────────────┘    │
│                                     │
│       [取消]        [确认导入]       │
└─────────────────────────────────────┘
```

### 2. 文件选择与会话创建流程

```
用户点击「AI导入」
  → showAiImportPanel()
    清空已选列表 → 显示悬浮面板

用户点击「选择文件」
  → <input type="file" multiple accept=".txt,.md,.json,.js,.py,.css,.html,.xml,.yaml,.yml,.csv,.ts,.tsx,.jsx,.vue,.svelte,.sql,.sh">
  → 文件数量上限 5，类型校验，FileReader.readAsText()

用户点击「确认导入」
  → hideAiImportPanel()
  → triggerAiImport(files)：
    ① 创建新会话 SessionManager.createSession()
    ② sid = 新会话 ID
    ③ 保存全部文件到 user-files: saveUserFile(sid + '/' + file.name, file.content)
    ④ 构建消息文本（文件路径列表 + 提示词）
    ⑤ switchTab('chat')
    ⑥ activateSkill('smart-skill-create')
    ⑦ chatInput.value = 构建的消息
    ⑧ sendChatMessage()
```

**与 `triggerSmartSearch` 的区别**：
- Smart Search 在发送消息前清空旧会话（`currentSessionId = null`），AI 导入需要新会话承载文件
- Smart Search 不涉及文件保存，AI 导入需先保存文件再发消息
- Smart Search 的消息是用户输入的 query，AI 导入的消息是自动构建的（文件路径 + 指令）

### 3. smart-skill-create 技能设计

技能定义文件：`skills/smart-skill-create/skill.cn.md`

```yaml
---
id: smart-skill-create
name: 智能技能创建
description: 分析用户提供的文本内容，自动提炼并创建技能
category: Product
---
# 角色定义
你是一个技能设计专家。用户会通过「用户提交的文件」卡片向你提供文本材料，你需要：

## 工作流程

### 第一步：读取文件
使用 get_user_file 工具读取每个文件的完整内容。

### 第二步：分析提炼
根据文本内容，提炼出 1-3 个技能草案。每个草案包含：
- 名称（简洁，3-8字）
- 描述（一句话概括技能用途）
- 分类：Development / Testing / Product / Business / Other
- 提示词（完整的角色设定和任务指令）

### 第三步：交互确认
使用 ask_user 工具向用户展示技能草案，让用户确认或修改。
展示格式：按草案编号列出，每个草案包含完整字段。

### 第四步：创建技能
用户确认后，调用 create_skill 工具逐一创建技能。
每创建一个技能后报告结果。

## 提示词写作规范
- 使用第二人称（"你是..."），不要用第三人称
- 包含明确的任务指令和输出格式要求
- 中文技能的提示词用中文，英文技能用英文
- 提示词末尾不要加额外说明，直接结束
```

**英文版本** `skill.en.md` 结构相同，内容翻译为英文。

**skills.json 更新**：在数组中新增 `"smart-skill-create"`。

### 4. Tools 注册

在 `shared/chat.js` 的 TOOLS 数组中新增三个工具：

#### create_skill
```
name: create_skill
description: 创建新的用户自定义技能。创建前应先通过 ask_user 与用户确认技能信息
parameters:
  name: 技能名称（3-20字）
  description: 一句话描述技能用途
  category: Development | Testing | Product | Business | Other
  prompt: 完整的角色设定和任务指令文本
required: [name, description, category, prompt]
```

#### update_skill
```
name: update_skill
description: 编辑已有的用户自定义技能。支持部分字段更新，只传需要修改的字段
parameters:
  skillId: 技能ID
  name: 新名称（可选）
  description: 新描述（可选）
  category: 新分类（可选）
  prompt: 新提示词（可选）
required: [skillId]
```

#### delete_skill
```
name: delete_skill
description: 删除指定的用户自定义技能（软删除）。内置技能不可删除
parameters:
  skillId: 要删除的技能ID
required: [skillId]
```

#### 执行逻辑（executeToolCall 中）

```javascript
// create_skill
if (name === 'create_skill') {
  var args = JSON.parse(argsStr);
  var registry = window.__getSkillRegistry();
  var newSkill = await registry.createUserSkill(args.name, args.description, args.category, args.prompt);
  return JSON.stringify({ success: true, skillId: newSkill.id, name: newSkill.name });
}

// update_skill
if (name === 'update_skill') {
  var args = JSON.parse(argsStr);
  var registry = window.__getSkillRegistry();
  var updated = registry.update(args.skillId, args, undefined);
  return JSON.stringify({ success: updated, skillId: args.skillId });
}

// delete_skill
if (name === 'delete_skill') {
  var args = JSON.parse(argsStr);
  var registry = window.__getSkillRegistry();
  var skill = registry.getAll().find(function(s) { return s.id === args.skillId; });
  if (skill && skill.type === 'builtin') {
    return JSON.stringify({ success: false, error: '内置技能不可删除' });
  }
  registry.unregister(args.skillId);
  return JSON.stringify({ success: true, skillId: args.skillId });
}
```

**安全约束**：
- `delete_skill` 仅允许删除 `type === 'user'` 的技能，内置技能拒绝
- `update_skill` 受 `SkillRegistry.update()` 内部逻辑限制（历史记录、同步到 storage）
- `create_skill` 自动生成 `user-` 前缀 ID，由 `createUserSkill()` 处理

### 5. 数据流总览

```
┌─────────────────────────────────────────────────────────────────────┐
│                     panel.js (Skills Tab)                           │
│                                                                     │
│  [🤖 AI导入] 点击                                                    │
│    → showAiImportPanel()                                            │
│      → 显示悬浮面板 (overlay)                                        │
│      → 用户选择文件 (input[type=file][multiple])                     │
│      → FileReader 读取内容 → 存入内存数组                             │
│    → 确认导入                                                        │
│      → hideAiImportPanel()                                          │
│      → triggerAiImport(files)                                       │
└──────────────────────────────────┬──────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│  ① SessionManager.createSession() → sid                             │
│  ② for each file: saveUserFile(sid + '/' + file.name, file.content) │
│  ③ 构建消息: "AI导入文件:\n- sid/file1\n- sid/file2\n请分析..."     │
│  ④ switchTab('chat')                                                │
│  ⑤ activateSkill('smart-skill-create')                              │
│  ⑥ chatInput.value = message; sendChatMessage()                     │
└──────────────────────────────────┬──────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     chat.js (Agent Loop)                            │
│                                                                     │
│  AI 收到消息 → system prompt 含 smart-skill-create 的 prompt        │
│  → AI 调用 get_user_file 读取文件内容                                │
│  → AI 分析文本，提炼技能草案                                         │
│  → AI 调用 ask_user 展示草案，等待用户确认                           │
│  → 用户确认后 AI 调用 create_skill(...)                              │
│  → SkillRegistry.createUserSkill() → _syncToStorage()               │
│  → 向用户报告创建结果                                                │
└─────────────────────────────────────────────────────────────────────┘
```

## Risks / Trade-offs

- [文件大小限制] 5 个文件 × 无大小限制可能导致大文件上传。V1 不做限制，后续可增加单文件 5MB 上限。
- [技能质量依赖 AI 能力] 提炼的技能质量取决于 LLM 的理解能力。通过交互确认环节降低风险。
- [工具权限] create_skill/update_skill/delete_skill 为全局工具，任何激活技能的场景 AI 都能调用。通过 prompt 约束（"仅当用户明确要求时使用"）降低误调用风险。
- [会话管理] AI 导入创建独立会话，如果当前已有活跃会话不会被清除（与 Smart Search 不同）。用户可手动管理会话。

## Migration Plan

无需数据迁移。新增功能独立，不影响现有流程：
1. 部署后技能 Tab 出现「AI 导入」按钮
2. 内置技能 `smart-skill-create` 随 skills.json 加载（bootstrapped）
3. 三个 skill-crud 工具注册到 TOOLS 数组，AI 立即可用
