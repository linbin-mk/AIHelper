## ADDED Requirements

### Requirement: 技能目录自动扫描
系统 SHALL 在插件初始化时自动扫描 `chrome-extension/skills/` 目录，发现所有子目录并为每个子目录注册一个技能。扫描通过 `chrome.runtime.getURL()` 获取技能目录清单实现。每个子目录按 id 去重（相同 id 的目录只注册一次）。

#### Scenario: 扫描发现多个技能
- **WHEN** `skills/` 目录下存在 `code-master/`、`system-qa/`、`test-data-generation/` 子目录，各含至少一个 `skill.*.md` 文件
- **THEN** 系统注册 3 个技能，分别对应上述目录

#### Scenario: 空目录跳过
- **WHEN** `skills/` 下存在 `empty-skill/` 子目录但不包含任何 `skill.*.md` 文件
- **THEN** 该目录被跳过，不注册技能

#### Scenario: 无技能目录
- **WHEN** `skills/` 目录下没有任何包含 `skill.*.md` 文件的子目录
- **THEN** 技能列表为空，技能 Tab 显示空状态

### Requirement: 语言感知文件选择
系统 SHALL 根据当前界面语言选择对应的技能 MD 文件。语言代码为 `zh-CN` 时选择 `skill.cn.md`，`en` 时选择 `skill.en.md`。目标语言文件不存在时 SHALL 回退到另一可用语言文件。

#### Scenario: 中文环境加载中文文件
- **WHEN** 界面语言为 `zh-CN` 且技能目录下存在 `skill.cn.md`
- **THEN** 系统加载 `skill.cn.md` 文件

#### Scenario: 英文环境加载英文文件
- **WHEN** 界面语言为 `en` 且技能目录下存在 `skill.en.md`
- **THEN** 系统加载 `skill.en.md` 文件

#### Scenario: 目标语言文件不存在时回退
- **WHEN** 界面语言为 `en` 但技能目录下仅有 `skill.cn.md`，无 `skill.en.md`
- **THEN** 系统回退加载 `skill.cn.md`

#### Scenario: 双版本都存在时选择正确语言
- **WHEN** 界面语言为 `en` 且技能目录下同时存在 `skill.cn.md` 和 `skill.en.md`
- **THEN** 系统加载 `skill.en.md`，忽略 `skill.cn.md`

### Requirement: MD 文件解析
系统 SHALL 通过 `fetch()` 请求 `chrome.runtime.getURL('skills/<skill-id>/skill.<lang>.md')` 读取技能 MD 文件内容，解析 YAML front matter 和 Markdown 正文，构建技能对象注册到 SkillRegistry。

#### Scenario: 成功解析 MD 文件
- **WHEN** 系统 fetch `skills/code-master/skill.cn.md` 成功获取内容，front matter 包含完整字段，正文为有效 Markdown
- **THEN** 系统提取 `id`、`name`、`description`、`category` 作为元数据，正文作为 prompt 内容，调用 `SkillRegistry.register()` 注册

#### Scenario: MD 文件格式错误
- **WHEN** MD 文件缺少 front matter 分隔符（`---`），或 front matter 不是合法 YAML
- **THEN** 该文件被跳过，不注册技能，记录错误日志

#### Scenario: fetch 失败
- **WHEN** `fetch()` 请求技能 MD 文件返回非 200 状态码或网络错误
- **THEN** 该技能被跳过，如果另一语言文件可用则尝试回退，否则记录错误日志

### Requirement: 异步加载流程
技能加载 SHALL 为异步流程。`panel.js` 初始化时调用 `SkillRegistry.loadAllSkills()` 异步函数，等待所有技能加载完成后再渲染技能列表 UI。加载过程中技能 Tab 展示加载状态指示器。

#### Scenario: 加载过程中显示加载状态
- **WHEN** 技能正在异步加载中且用户切换到技能 Tab
- **THEN** 技能 Tab 显示加载中提示（如 "技能加载中..."）

#### Scenario: 加载完成后渲染技能列表
- **WHEN** 所有技能 MD 文件的 fetch 和解析完成
- **THEN** 技能 Tab 按分类分组渲染所有成功加载的技能

#### Scenario: 并行加载
- **WHEN** `skills/` 目录下有 5 个技能
- **THEN** 所有技能文件的 fetch 请求并行发起，而非串行加载

### Requirement: SkillRegistry 接口兼容
新增的 MD 加载机制 SHALL 保持 `SkillRegistry` 现有对外 API 不变。注册到 `SkillRegistry` 的技能对象 SHALL 提供与原有 JS 注册兼容的接口：
- `id`、`name`、`description`、`category` 字段直接从 front matter 映射
- `getPrompt()` 方法返回 MD 正文内容
- `getTools()` 方法返回空数组
- `getUIDelegate()` 方法返回 `null`
- `sourcePath` 字段记录原始 MD 文件路径（调试用）

#### Scenario: MD 技能对象兼容现有 API
- **WHEN** `SkillRegistry.getAll()` 返回 MD 加载的技能对象
- **THEN** 该对象具有 `id`、`name`、`description`、`category`、`getPrompt()`、`getTools()`、`getUIDelegate()` 属性，调用方式与 JS 注册技能一致

#### Scenario: getPrompt() 返回 MD 正文
- **WHEN** 调用 MD 加载技能的 `getPrompt()` 方法
- **THEN** 返回该技能 MD 文件的正文部分（不含 front matter）

### Requirement: panel.html 移除硬编码引入
系统 SHALL 从 `panel.html` 中移除所有技能 `<script>` 标签的硬编码引入。技能加载完全由 `loadAllSkills()` 异步方法完成。

#### Scenario: panel.html 不再包含技能脚本标签
- **WHEN** 查看 `panel.html` 的 `<head>` 部分
- **THEN** 不存在任何指向 `skills/*/index.js` 的 `<script>` 标签

#### Scenario: 无 JS 技能文件仍正常运行
- **WHEN** 所有 `skills/*/index.js` 文件被删除，仅保留 `skill.*.md` 文件
- **THEN** 插件正常启动，技能列表展示所有 MD 定义的技能
