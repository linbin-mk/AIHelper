## Why

用户在技能页面面对大量技能时缺乏高效的发现方式，无法用自然语言描述场景来找到适合自己的技能组合。当前只能逐行浏览分类列表，效率低且无法获得组合推荐。需要提供一个"智慧搜索"入口，让用户通过对话式引导快速找到匹配的技能集合并一键收藏。

## What Changes

- 在技能页面的"收藏"卡片上方新增"智慧搜索"搜索框，仅在 AI 模型联通性检测通过时显示
- 搜索框包含提示文字"输入你需要解决的场景"和右侧搜索按钮
- 用户输入场景描述后点击搜索，自动跳转到"AI聊天"页面并激活"推荐Skill"技能
- 新增"推荐Skill"技能：通过多轮对话引导用户明确需求，最终推荐匹配的技能集合（多选框），用户选中后自动创建收藏夹（含名称、描述、技能列表）
- "推荐Skill"复用现有的收藏夹创建 API，直接生成带名称和描述的收藏夹
- 支持中英文多语言

## Capabilities

### New Capabilities
- `smart-skill-search`: 技能页面的"智慧搜索"入口 —— 搜索框UI、联通性校验、跳转逻辑、与"推荐Skill"技能的联动
- `recommend-skill`: "推荐Skill"技能定义 —— 通过引导式对话提问，最终输出推荐技能多选卡片，用户确认后创建收藏夹

### Modified Capabilities
- `skill-favorites`: 新增由"推荐Skill"技能自动创建收藏夹的路径（包含名称与描述），不改变现有收藏功能

## Impact

- 受影响文件：`chrome-extension/src/panel/panel.html`（新增搜索框HTML）、`chrome-extension/src/panel/panel.js`（联通性检测调用、搜索框交互逻辑、跳转逻辑）、`chrome-extension/src/panel/panel.css`（搜索框样式）、`chrome-extension/src/panel/chat.js`（"推荐Skill"技能的消息渲染处理）
- 新增技能文件：`skills/recommend-skill/skill.cn.md`、`skills/recommend-skill/skill.en.md`
- 无Breaking Change
- 依赖现有 `testConnectivity()` 函数、`switchTab()` 导航、`activateSkill()` 激活函数、`SkillUIDelegate` 消息渲染机制、`chrome.storage.local` 收藏数据持久化
