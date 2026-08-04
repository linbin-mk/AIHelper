## Why

`dev-system-qa` 分支已完成了原 `system-qa` 技能的丰富内容编写，但当前主干分支仅有占位骨架。需要将成熟内容迁移到主干，同时将技能重新定位为 `product-expert`「产品专家」——一个深度掌握产品前后端代码及全部文档的 AI，面向使用者、实施人员、开发者给出精准回答。

按照"一个技能文件 = 技能的全部上下文"原则整理：4 份参考文档的有用内容合并到 skill MD 中，技能文件自包含。

## What Changes

- 技能重命名：目录从 `system-qa` 改为 `product-expert`，id 改为 `product-expert`，中文名改为「产品专家」，英文名改为「Product Expert」
- 技能身份重新定义：从"系统解答专家"升级为"产品专家"——深度掌握产品前后端代码及全部文档，能用最直白语言向小白解释操作步骤，也能和技术专家讨论实现细节
- 用 `dev-system-qa` 分支的内容为基础，将 4 份参考文档（模块详解、技能一览、故障排查表、FAQ）的有用内容合并进 skill MD 正文
- 精简技能内容：删除所有引用不存在工具/方法的描述（如 `get_extension_info`、`list_skills`、`get_config_summary`、`list_active_headers`、`diagnose.js` 等），工作流中工具调用策略替换为现行 22 个公共工具中已有的方法
- 最终 `product-expert/` 目录仅保留 `skill.cn.md`、`skill.en.md` 两个文件
- 清理所有冗余文件
- 更新 `manifest.json` 中技能注册：`system-qa` → `product-expert`

## Capabilities

### New Capabilities

- `product-expert-skill-content`: product-expert 技能的自包含 MD 文件（中英文各一份）。一个 skill MD 文件 = 技能的全部上下文。AI 身份为「产品专家」——深度掌握产品前后端代码及全部文档，面向使用者/实施人员/开发者给出有据可依的回答。正文包含完整工作流 + 全部知识库内容，只引用现行 22 个公共工具。覆盖功能说明、操作引导、配置建议、故障排查、架构设计讨论等场景。

### Modified Capabilities

无。

## Impact

- `chrome-extension/skills/product-expert/skill.cn.md` — 新建，自包含完整中文技能文稿
- `chrome-extension/skills/product-expert/skill.en.md` — 新建，自包含完整英文技能文稿
- `chrome-extension/skills/system-qa/` — 整个目录删除（重命名为 product-expert）
- `chrome-extension/skills/manifest.json` — `system-qa` → `product-expert`
- 删除原 `system-qa/` 下的所有冗余文件

## 协作过程 — 与 AI 协同抽丝剥茧

这次变更的背景是：同事在 `dev-system-qa` 分支开发了这个通用 skill，今天需要合并到主干。但同事的产出偏向"AI Helper 自描述"方向（9 大模块详解、故障排查、FAQ），和预期的通用产品专家定位有偏差。整个过程是人与 AI 协同，把同事产出中有用的部分提取出来，去掉不对的部分，还原到正确的形态。

### 四轮抽丝剥茧

**第一轮：去掉独立 reference 文件**

AI 最初把同事的 4 份 `references/` 文档作为独立公共组件保留，skill MD 中通过相对链接引用。

→ 纠正：「一个 SKILL.md 文件 = 技能的全部上下文」。`skill-md-loader` 加载后直接注入 AI 提示词，AI 看不到跨文件链接。全部合并到正文。

**第二轮：剥离 AI Helper 自描述**

合并后的 skill MD 包含了同事写的 9 大模块详解、故障排查表、FAQ 等（约 7600 字），本质是教用户用 AI Helper，而不是用 AI Helper 回答产品问题。

→ 纠正：「skill 的思路错了，变成了解答 AI Helper 如何使用了。要做通用产品专家，用知识库+记忆来回答任何产品问题」。全部推倒重写，正文从 7600 字精简到 1000 字（中文一份，英文为翻译不计入）。

| 维度 | 同事产出（剥离） | 最终形态（保留） |
| --- | --- | --- |
| 定位 | 教用户用 AI Helper | 结合知识库+记忆回答产品问题 |
| 知识来源 | AI Helper 自描述文本 | `search_project_code` + `search_memories` |
| 正文量 | 7600 字 | 1000 字（87% 精简） |
| 工具引用 | `get_extension_info` 等不存在的方法 | 仅现行 22 个工具 |

**第三轮：瘦身**

通用产品专家初版仍有「受众适配」「边界与禁区」「不调工具场景」「格式支持」等冗余章节。

→ 纠正：角色描述里「用最直白语言…也能讨论实现细节」已经隐含自适应能力；不需要画边界；5 种卡片形式已够用。

**第四轮：对齐实际存在的东西**

初版引用了同事写的 `/fullstack-dev`、`/requirement-summary` 等不存在的技能命令。

→ 纠正：逐条对照 `manifest.json` 修正。`/fullstack-dev` → `/code-master`，`/requirement-summary` → `/requirement-to-prd`。

### 经验

1. **AI 协同适合做「减法」**。同事产出中哪些该留哪些该删，AI 能快速给出判断并执行，人只需确认方向
2. **一个文件 = 全部上下文**。跨文件引用在 AI 加载模式下无效
3. **只写实际存在的东西**。引用不存在的工具/方法会干扰 AI 判断
4. **精简比完整更重要**。7600 字的自描述不如 1000 字的工作指令有效
