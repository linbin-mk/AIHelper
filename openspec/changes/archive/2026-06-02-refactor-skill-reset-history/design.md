## Context

当前技能编辑流程：用户编辑技能 → 保存 → `SkillRegistry.update()` 同时更新内存中的 skill 对象和 `ai_helper_skill_overrides` 持久化。点击「重置」按钮调用 `resetSkill()`，从扩展内置 `.md` 文件重新 fetch 原始内容覆盖当前值。

每次保存后，旧内容完全丢失，用户无法回溯。本次改造目标：在保存时自动保留旧版本，通过历史版本悬浮框让用户选择恢复任意版本。

### 约束
- 必须在 `chrome.storage.local` 中持久化（与现有 overrides 一致）
- 历史数据与语言绑定（cn/en 各自独立的历史）
- 不能影响现有「编辑→保存」流程的交互体验
- 通过 `sync.sh` 保持 Chrome / Firefox 双平台一致

## Goals / Non-Goals

**Goals:**
- 每次用户保存技能编辑时，自动将保存前的状态记录为一个历史版本
- 点击「重置」按钮弹出历史版本悬浮框，展示所有历史版本（含时间戳）
- 用户可选择任意历史版本恢复（首次保存时自动捕获的版本即为内置状态）
- 历史版本持久化到 `chrome.storage.local`，跨会话保留
- 历史版本数量上限为 20 条/技能/语言，超出时自动删除最旧记录

**Non-Goals:**
- 不提供版本对比（diff）功能
- 不提供手动删除单条历史记录的功能
- 不支持跨语言历史合并查看
- 不改变现有 `ai_helper_skill_overrides` 的数据结构（历史记录独立存储）

## Decisions

### 1. 独立存储键 `ai_helper_skill_history`

**选择**: 使用独立的 `chrome.storage.local` 键 `ai_helper_skill_history`，与现有 `ai_helper_skill_overrides` 解耦。

**原因**: 
- 历史数据是追加型数据，与覆盖数据（快照型）的生命周期和管理方式不同
- 避免 overrides 键膨胀导致加载/保存性能下降
- 便于未来独立清理或导出历史数据

**备选方案**: 扩展 `ai_helper_skill_overrides` 结构加入 `history` 字段。不选择的原因是会导致 overrides 键变得过大，且重置技能需要联动清理历史时逻辑更复杂。

### 2. 历史数据结构

**选择**: 扁平化结构 `{ [skillId:langSuffix]: [version, ...] }`，每个版本为 `{ ts, name, description, _prompt, category }`。

```json
{
  "code-master:cn": [
    { "ts": 1700000000000, "name": "...", "description": "...", "_prompt": "...", "category": "..." },
    { "ts": 1700000001000, "name": "...", "description": "...", "_prompt": "...", "category": "..." }
  ]
}
```

**原因**:
- 按 `skillId:langSuffix` 为 key 便于单个技能/语言的读写，无需扫描全部数据
- 时间戳 `ts` 作为自然排序依据，也用于 UI 展示
- 每个版本是完整快照，恢复时无需依赖其他版本

### 3. 历史版本上限与清理策略

**选择**: 每技能/每语言最多保留 20 个版本，超出时在写入新版本前删除数组头部（最旧）的记录。

**原因**: 20 个版本对 `chrome.storage.local` 的存储压力可忽略（每个版本约 2-5KB，总计 < 100KB）。FIFO 策略实现简单，无需额外优先级判断。

### 4. UI 交互流程

**选择**: 点击「重置」按钮 → 打开历史版本悬浮框 → 点击某个版本 → 将该版本内容加载到编辑表单中 → 用户可修改后再保存 → 保存时自动创建新历史条目。

这样保持了与现有编辑流程的一致性：所有状态变更都通过 `update()` → 自动捕获历史，不需要额外的直接恢复路径。

悬浮框结构：
- 标题行："版本历史 - {技能名称}"
- 版本列表，每行显示：`#N - YYYY/MM/DD HH:mm:ss - 名称预览`
- 点击某个版本 → 加载内容到编辑表单 → 关闭悬浮框 → 用户确认/修改后保存

**备选方案**: 使用 `<select>` 下拉框。不选择是因为版本列表可能较长，悬浮框提供更好的浏览体验和空间。

## Risks / Trade-offs

- [存储增长风险] 如果用户频繁编辑大量技能，历史数据累积 → 20 条上限已做防护，且按期清理
- [数据一致性] 用户编辑后立即关闭扩展，历史可能未写入存储 → `update()` 中 `saveOverrides` 和 `saveHistory` 顺序写入，失败静默处理（不阻塞用户）
- [跨设备同步] `chrome.storage.local` 不支持跨设备同步 → 这是现有架构的限制，非本次引入

## Migration Plan

1. 部署后首次打开扩展，历史记录为空（fresh start），不影响现有已编辑的技能
2. 现有已编辑技能首次保存时，保存前的当前内容（即现有编辑值）作为第一个历史版本写入
3. 已有 `ai_helper_skill_overrides` 键不变，无迁移成本
4. 如需回滚：移除 `ai_helper_skill_history` 键；将 `resetSkillEdit()` 回调为直接调用 `resetSkill()`；移除悬浮框 HTML
