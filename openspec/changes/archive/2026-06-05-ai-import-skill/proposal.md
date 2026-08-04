## Why

当前技能创建方式单一，用户只能通过填写表单手动输入名称、描述、分类和提示词来创建技能。对于有现成文档、需求说明、技术规范等文本素材的用户，手动提取和整理这些信息效率低下。

需要一种"AI 导入"通道：用户提交已有的文本文件，AI 自动分析内容、提炼出技能定义，并通过交互式对话与用户确认后一键创建技能。这能大幅降低创建技能的门槛，让非技术用户也能快速构建自己的技能库。

此外，当前 AI 工具集缺少直接操作技能的接口（创建/编辑/删除），AI 无法在对话中帮助用户管理技能，需要在 TOOLS 体系中补齐。

## What Changes

**新增「AI 导入」入口**：
- 在技能 Tab 的"创建技能"按钮右边新增「AI 导入」按钮
- 点击后弹出悬浮文件选择面板，支持多选文本文件（最多 5 个），类型白名单与现有聊天附件一致
- 确认后文件通过 `saveUserFile` 存入用户文件卡片

**跳转 AI 对话并激活智能技能创建**：
- 文件保存完毕后，自动切换到 AI 聊天 Tab
- 向 AI 发送文件存储路径信息，并激活内置的 `smart-skill-create` 技能
- 该技能引导 AI 分析文件内容，总结提炼出技能定义（名称、描述、分类、提示词）

**交互式确认流程**：
- AI 通过 `ask_user` 工具卡片与用户交互，展示提炼出的技能草案
- 用户可修改、确认或要求重新生成，直到满意为止
- 用户确认后 AI 调用 `create_skill` 工具完成创建

**新增 AI 工具**：
- `create_skill`：创建新的用户技能（含 name、description、category、prompt）
- `update_skill`：编辑已有技能（按 skillId 更新字段）
- `delete_skill`：删除用户技能（软删除，按 skillId）
- 三个工具注册到 TOOLS 数组，AI 可在对话中直接调用

**新增内置技能**：
- `smart-skill-create`：分析用户文本内容，提炼技能定义，通过交互卡片与用户确认后创建技能

## Capabilities

### New Capabilities
- `ai-import-skill-ui`：技能 Tab 的「AI 导入」按钮 + 悬浮文件选择面板 UI
- `ai-import-skill-flow`：文件选择 → 存储 → 跳转聊天 → 激活技能 的完整流程
- `smart-skill-create-skill`：智能分析文本、提炼技能定义的 AI 技能定义（.md 文件）
- `skill-crud-tools`：create_skill / update_skill / delete_skill 三个 AI 工具

## Impact

- `chrome-extension/src/panel/panel.html` — 新增「AI 导入」按钮 + 文件选择悬浮面板 HTML
- `chrome-extension/src/panel/panel.js` — 新增按钮事件、文件选择逻辑、跳转聊天并激活技能
- `shared/chat.js` — TOOLS 数组新增 create_skill / update_skill / delete_skill 工具定义 + executeToolCall 实现；新增 smart-skill-create 工具调用处理
- `skills/` — 新增 `smart-skill-create/skill.cn.md` / `skill.en.md` 技能定义
- `skills/skills.json` — 新增 `smart-skill-create` 条目
- `shared/css/panel.css` — 新增 AI 导入悬浮面板样式
- `firefox-extension/` 对应文件 — 通过 `sync.sh` 同步
