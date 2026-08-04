## Why

当前记忆系统按域名分类存储，AI 在 `buildMemoryHint()` 中只向当前标签页域名注入记忆提示。但用户的许多经验和方法论是跨域通用的（如"如何设计功能地图"、"React 状态管理最佳实践"），当前仅靠当前域名记忆的查询范围导致这些通用经验被遗漏。同时记忆生成也写死当前域名，缺乏通用/特定域的智能分流。

## What Changes

- `buildMemoryHint()` 同时注入当前域名和 general 域名的记忆提示，引导 AI 主动查询两种记忆
- 对话结束后的记忆生成阶段，AI 自行判断新总结应存入当前域名还是 general 域名（或两者）
- `general` 域名从「无标签页 URL 时的后备」升级为「跨域通用记忆的正式载体」
- UI 层面记忆卡片元数据显示通用记忆的域名数量时，`general` 作为一个正式域计入

## Capabilities

### New Capabilities

- `general-memory-domain`: `general` 域名作为跨域通用记忆的正式载体，AI 在对话开始时可感知通用记忆，在对话结束后可自主决定存入通用记忆

### Modified Capabilities

- `memory-generation`: 记忆生成时的存储域名由写死当前 hostname 改为 AI 基于内容自主决定（当前域 / general / 两者）
- `memory-card`: `buildMemoryHint()` 的注入逻辑从单一当前域名扩展为同时涉及当前域和 general 域

## Impact

- `chrome-extension/src/panel/chat.js` — `buildMemoryHint()` 扩展 general 域查询；`triggerMemoryGeneration()` 调用时传入 general 域已有记忆供合并决策
- `chrome-extension/src/panel/memory.js` — `evaluateMemoryMerge()` prompt 扩展为双域判定；`generateMemory()` 加载 general 域记忆参与合并
- `chrome-extension/src/panel/panel.html` — 无需改动
- `chrome-extension/src/panel/knowledge.js` — 无需改动（`renderKnowledgeList()` 已有 `memory.js` 中触发刷新）
