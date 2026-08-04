## Context

当前 AIHelper 技能系统使用 `chrome-extension/skills/<skill-id>/index.js` 的 JavaScript IIFE 格式定义技能。每个技能文件调用 `window.__registerSkill({...})` 注册，提供 `getPrompt()`、`getTools()`、`getUIDelegate()` 等方法。`panel.html` 中通过硬编码 `<script>` 标签引入所有技能文件。

已有 4 个基础交互组件：`ask_user`（询问卡）、`request_auth`（授权卡）、`display_table`（表格卡）、`provide_file`（下载卡），它们在 `chat.js` 中实现，通过 LLM 工具调用触发。现有技能中的 UI 委托（如 test-data-generation 的 taskCard）是独立实现，未复用基础组件。

浏览器扩展中无法使用 Node.js `fs` 模块读取文件系统，需要通过 `chrome.runtime.getURL()` 获取扩展内文件的 URL，再通过 `fetch()` 读取内容。

## Goals / Non-Goals

**Goals:**
- 技能文件统一为 Markdown 格式，降低创建和维护门槛
- 插件初始化时自动扫描并加载技能目录中的所有 MD 文件，无需手动维护导入列表
- 技能内容与代码逻辑解耦，AI 通过自然语言理解使用基础组件
- 技能详情页面直接渲染 MD 内容

**Non-Goals:**
- 不改变 SkillRegistry 的对外 API（`register`、`activate`、`deactivate`、`getAll`、`getActive` 接口保持不变）
- 不改变聊天系统中的技能激活/停用逻辑
- 不改变斜杠命令面板的行为
- 不实现技能热更新或外部文件动态加载
- 不改变现有基础组件的实现

## Decisions

### Decision 1: MD 文件使用 YAML Front Matter + Markdown 正文

**选择**: 使用 YAML front matter 存储元数据，正文为 Markdown 自然语言内容。

**理由**:
- Front matter 是 Markdown 生态中的标准做法，易于解析和编辑
- 元数据和内容分离清晰，程序化读取元数据时不需要解析正文
- 正文为纯 Markdown，可直接渲染，也可作为 AI 提示词注入

**替代方案**:
- JSON + Markdown 混合文件：解析更复杂，不如 front matter 优雅
- 纯 JSON 配置文件 + 独立 MD 文件：增加文件数量，维护成本高

### Decision 5: 双文件国际化方案

**选择**: 每个技能目录按语言后缀存放 MD 文件：`skill.cn.md`（中文）、`skill.en.md`（英文）。加载时根据当前语言选择对应文件，目标语言文件不存在时回退到另一语言。

**理由**:
- 单文件双语混杂难以维护，双文件各自独立
- `.cn.` / `.en.` 后缀简洁，与项目中 `zh-CN` / `en` 的语言代码体系对齐
- 不需要改动现有 `i18n.js`，技能语言切换在文件加载层面处理
- 技能作者只需维护自己会的语言版本

**替代方案**:
- 单文件 front matter 内嵌多语言字段：导致文件冗长混乱
- 子目录分语言（`zh-CN/skill.md`、`en/skill.md`）：增加目录层级，扫描复杂度高

### Decision 2: 通过 fetch() + chrome.runtime.getURL() 动态加载

**选择**: 在扩展初始化时，通过 `fetch()` 请求 `chrome.runtime.getURL('skills/<skill-id>/skill.<lang>.md')` 读取文件内容。

**理由**:
- 浏览器扩展无法使用 Node.js 文件系统 API
- `chrome.runtime.getURL()` 可获取扩展内打包文件的 URL
- `fetch()` 可同步读取扩展内文件内容（不需要网络请求）

**替代方案**:
- 使用 `chrome.runtime.getPackageDirectoryEntry()`：仅在 ChromeOS/Chrome App 中可用，不适用于 Manifest V3 扩展
- 在构建时生成导入清单：需要额外构建步骤，增加复杂度

**关键约束**: 由于 `fetch()` 是异步的，技能加载需要改为异步初始化流程。`panel.js` 需要在技能加载完成后再渲染 UI。

### Decision 3: 工具调用由 AI 自然语言驱动，不在 MD 中编写工具定义

**选择**: 技能 MD 文件中不包含工具定义代码，AI 通过理解 MD 中的自然语言描述自行判断何时调用已有基础组件（`ask_user`、`request_auth`、`display_table`、`provide_file`）。

**理由**:
- 降低技能编写门槛，无需理解工具定义的 JSON Schema
- AI 本身具备理解自然语言并映射到工具调用的能力
- 基础组件已经是 LLM 工具调用的一部分，AI 在系统提示中已知晓这些工具

**替代方案**:
- 在 MD 中声明工具列表（如 `tools: [ask_user, display_table]`）：增加了格式复杂度但收益有限
- 在 MD 中编写工具调用示例：可作为内容的一部分，但不作为结构化元数据

### Decision 4: 技能详情弹窗直接渲染 Markdown

**选择**: 移除当前的 4 段式硬编码布局（描述/方法集合/技能规则/使用方式），改为渲染技能 MD 文件的完整正文内容。

**理由**:
- 用户可直接看到技能的完整自然语言描述
- Markdown 渲染已由 `renderMarkdown()` 支持
- 简化了弹窗实现逻辑，内容结构由技能作者决定

**替代方案**:
- 保留分段布局但内容从 MD 解析：增加解析复杂度，限制内容灵活性

## Risks / Trade-offs

- **[风险] `fetch()` 加载失败导致技能不可用** → 自动跳过加载失败的技能文件，仅记录错误日志，不影响其他技能
- **[风险] MD 文件解析错误导致技能注册失败** → 对每个文件使用 try-catch，解析失败时跳过并记录错误
- **[风险] AI 可能不理解 MD 中的自然语言，不调用正确的工具** → 在系统提示中保留基础工具的使用说明，确保 AI 始终知晓可用工具
- **[风险] 现有技能 JS 中 test-data-generation 的 taskCard UI 委托无法简单用 MD 描述** → taskCard 作为复杂 UI 场景，暂时保留其基础组件能力通过 `display_table` + `ask_user` 组合实现，后续可扩展基础组件
- **[权衡] 失去 `getTools()` 的编程式工具定义能力** → 技能不再能定义专属工具，所有交互通过 4 个基础组件完成。对于已有的专属工具（如 website-outline 的 `saveOutline`），这些能力需要通过基础组件组合或后续扩展实现

## Migration Plan

1. 在 `skill-registry.js` 中新增 `loadSkillsFromDirectory()` 异步函数
2. 修改 `panel.js` 初始化流程为异步，等待技能加载完成后渲染
3. 创建 `skill.md` 模板和格式文档
4. 逐个迁移现有 13 个技能：编写 `skill.cn.md`，删除 `index.js`
5. 从 `panel.html` 移除所有技能 `<script>` 标签
6. 修改技能详情弹窗为 MD 渲染模式
7. 修改系统提示词构建逻辑，使用 MD 正文替代 `getPrompt()`
8. 验证所有基础组件（询问卡、授权卡、表格卡、下载卡）在 AI 自主调用时正常工作

## Open Questions

- 占位技能的 "待完善" 提示如何在 MD 中表达？
- 是否需要支持技能 MD 中声明依赖的基础组件列表（作为 AI 提示增强）？
