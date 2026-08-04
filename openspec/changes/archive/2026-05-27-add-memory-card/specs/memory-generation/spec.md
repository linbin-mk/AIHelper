## ADDED Requirements

### Requirement: AI 任务完成后自动生成记忆总结
系统 SHALL 在 AI Agent Loop 完成一轮完整对话（最终回复已保存）后，自动生成一份结构化的记忆总结。记忆生成 MUST 异步执行，不阻塞 UI。

#### Scenario: 正常对话完成后生成记忆
- **WHEN** `startAgentLoop` 中无 tool_calls 分支执行到 `await saveCurrentMessages()` 之后
- **THEN** 系统异步调用记忆生成函数 `generateMemory(sessionMessages, hostname)`
- **AND** 生成的记忆内容包含：对话时间、用户问题摘要、AI 回答摘要、关键技术点

#### Scenario: 错误或取消时跳过记忆生成
- **WHEN** 用户取消对话或 AI 返回错误
- **THEN** 系统不触发记忆生成

#### Scenario: 记忆生成不阻塞聊天
- **WHEN** 记忆生成正在执行
- **THEN** 用户立即可开始新一轮对话
- **AND** `setSending(false)` 在记忆生成启动前就已执行

### Requirement: 记忆文件按域名分类存储
生成的记忆内容 SHALL 存储为 Markdown 文件，按 URL hostname 分类组织目录结构。文件路径格式为 `{hostname}/{会话标题}.md`，以会话标题作为文件名。

#### Scenario: 根据域名创建目录并以会话标题存储
- **WHEN** 用户在 `github.com` 域名的页面上完成对话，会话标题为"修复websocket断线重连问题"
- **THEN** 记忆文件存储路径为 `github.com/修复websocket断线重连问题.md`
- **AND** 如果 `github.com` 目录不存在则自动创建

#### Scenario: 相同域名追加新记忆文件
- **WHEN** `github.com` 目录已存在且产生新记忆
- **THEN** 新记忆以新会话标题命名，创建为独立文件，不覆盖已有文件
- **AND** 如果标题已存在，追加序号（如 `修复websocket问题(2).md`）

#### Scenario: 无关联页面时的域名回退
- **WHEN** 对话未关联任何页面（如 Popup 模式或全局对话）
- **THEN** 域名使用 "general" 作为默认分类

### Requirement: 记忆文件内容结构
每个记忆文件 MUST 包含结构化的 Markdown 内容。文件标题使用会话标题。

#### Scenario: 记忆文件内容模板
- **WHEN** 系统生成记忆文件
- **THEN** 文件内容包含以下章节：
  - `# {会话标题}` (标题，即文件名)
  - `**时间**: {日期时间}`
  - `**域名**: {hostname}`
  - `**用户问题**: {用户原始问题摘要}`
  - `**解决方案**: {AI 回答关键摘要}`
  - `**关键技术点**:` (列表形式的关键技术决策)

### Requirement: 记忆生成调用 AI 总结能力
系统 SHALL 使用 AI 模型对对话内容进行总结提炼，而非简单截断。总结 prompt MUST 要求 AI 提取关键技术和决策点。

#### Scenario: AI 生成记忆总结
- **WHEN** 系统调用记忆生成
- **THEN** 构建专门的记忆总结 prompt，包含对话历史
- **AND** 向 AI 发送请求，要求以简短结构化格式总结
- **AND** 将 AI 返回的总结内容写入记忆文件

#### Scenario: 记忆总结包含技术关键词
- **WHEN** AI 生成的记忆总结
- **THEN** 总结中 MUST 包含"关键技术点"列表，每项为一个技术关键词或短语
- **AND** 关键技术点用于后续记忆匹配
