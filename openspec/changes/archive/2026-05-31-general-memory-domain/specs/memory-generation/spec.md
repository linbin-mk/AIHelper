# memory-generation

## MODIFIED Requirements

### Requirement: 记忆文件按域名分类存储
生成的记忆内容 SHALL 存储为 Markdown 文件，按域名分类组织目录结构。存储域名由 AI 在记忆生成阶段基于对话内容自主决定，可从当前标签页 hostname 和 `general` 两个域名中选择。文件路径格式为 `{hostname}/{会话标题}.md` 或 `general/{会话标题}.md`，以会话标题作为文件名。

#### Scenario: 根据域名创建目录并以会话标题存储
- **WHEN** AI 判定对话内容归属于当前域名（如 `github.com`），会话标题为"修复websocket断线重连问题"
- **THEN** 记忆文件存储路径为 `github.com/修复websocket断线重连问题.md`
- **AND** 如果 `github.com` 目录不存在则自动创建

#### Scenario: 根据域名创建目录并以会话标题存储（general 域）
- **WHEN** AI 判定对话内容为跨域通用经验，会话标题为"功能地图设计方法"
- **THEN** 记忆文件存储路径为 `general/功能地图设计方法.md`
- **AND** 如果 `general` 目录不存在则自动创建

#### Scenario: 相同域名追加新记忆文件
- **WHEN** `github.com` 目录已存在且产生新记忆
- **THEN** 新记忆以新会话标题命名，创建为独立文件，不覆盖已有文件
- **AND** 如果标题已存在，追加序号（如 `修复websocket问题(2).md`）

#### Scenario: 无关联页面时的域名处理
- **WHEN** 对话未关联任何页面（如 Popup 模式或全局对话）
- **THEN** 统一使用 `general` 作为默认分类，AI 仍可通过能力覆盖此默认值

## ADDED Requirements

### Requirement: AI 自主决定记忆存储域名
系统 SHALL 在 `evaluateMemoryMerge()` 阶段向 AI 提供双域已有记忆（当前域 + general 域），让 AI 基于内容综合判断新总结应存入哪个域名。AI 通过 UPDATE 或 CREATE 指令中的完整路径（含域名前缀）表达决策。

#### Scenario: AI 判定存入当前域名
- **WHEN** AI 判断新总结与当前域已有记忆相关或为域特定经验
- **THEN** AI 返回 `UPDATE: {hostname}/{filename}.md` 或 `CREATE`（默认存入当前域）
- **AND** 文件最终写入当前域名目录

#### Scenario: AI 判定存入 general 域名
- **WHEN** AI 判断新总结为跨域通用经验，与 general 域已有记忆相关
- **THEN** AI 返回 `UPDATE: general/{filename}.md` 或指示存入 general 域
- **AND** 文件最终写入 general 域名目录

#### Scenario: AI 合并决策时考虑双域已有记忆
- **WHEN** `evaluateMemoryMerge()` 被调用，传入 `mergeExisting` 包含当前域和 general 域的文件
- **THEN** AI prompt 中包含两个域的已有记忆内容供综合判断
- **AND** AI 基于内容重叠程度决定 SKIP / UPDATE(当前域) / UPDATE(general) / CREATE
