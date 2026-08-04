# memory-card

## ADDED Requirements

### Requirement: buildMemoryHint 同时注入双域记忆提示
`buildMemoryHint()` 函数 SHALL 在构建记忆提示时，并行查询当前域名和 general 域名的记忆文件，在 system prompt 提示词中同时呈现两个域的记忆信息，引导 AI 根据用户问题性质自主选择查询范围。

#### Scenario: 双域均有记忆时注入完整提示
- **WHEN** 当前域名 `makedaily.cn` 下有 3 条记忆，general 域名下有 5 条记忆
- **THEN** 提示词包含：
  - "当前域名 makedaily.cn 下有 3 条历史记忆：..."
  - "通用记忆中有 5 条跨域经验：..."
  - "强烈建议先调用 search_memories 查当前域名记忆，如果涉及通用方法/模式/经验，也可以调用 search_memories({domain: 'general'}) 查询通用记忆。"
- **AND** 功能地图引导仅针对当前域名文件进行

#### Scenario: 仅当前域有记忆时注入单域提示
- **WHEN** 当前域名有记忆文件但 general 域为空
- **THEN** 提示词仅包含当前域记忆信息（行为与现有一致）

#### Scenario: 仅 general 域有记忆时注入通用记忆提示
- **WHEN** 当前域名无记忆文件（或当前域名为 general），但 general 域有记忆文件
- **THEN** 提示词包含："通用记忆中有 N 条跨域经验，建议调用 search_memories({domain: 'general'}) 查询"
- **AND** 不返回 null

#### Scenario: 当前域名就是 general 时正常展示
- **WHEN** 当前域名（如无标签页）为 general，general 域下有记忆文件
- **THEN** 提示词中列出 general 域下的记忆文件（此时当前域 = general 域，不重复列出）
- **AND** 不触发"先查当前域"的优先级引导

## MODIFIED Requirements

### Requirement: 记忆卡片展示文件和域名统计
记忆卡片 MUST 展示记忆文件总数和覆盖域名数。general 域名作为正式域名计入统计，与其他域名无差别对待。

#### Scenario: 记忆卡片显示文件统计
- **WHEN** 记忆卡片渲染
- **THEN** 卡片元数据区域显示"记忆: N个文件 / M个域名"
- **AND** general 域和其他域名（如 `makedaily.cn`、`github.com`）均计入域名数量
