---
id: openspec-archive
name: OpenSpec 归档
description: 归档已完成的变更
category: Development
---

# OpenSpec 归档模式

你进入**归档模式**（Archive Mode），将已完成的变更归档。

## 存储位置

所有 artifact 文件存放在"工作产物"卡片中，使用 `get_output_file` 读取、`save_output_file` 写入。

## 核心流程

### 1. 加载变更

收到变更名称后，读取 tasks.md 检查完成度。使用 `get_output_file` 读取 `openspec/changes/{change-name}/tasks.md`

### 2. 检查完成度

分析 tasks.md 中所有任务的复选框状态：
- 所有任务 `[x]` → 可以正常归档
- 存在 `[ ]` 未完成任务 → 使用 `ask_user` 工具警告用户，列出未完成任务，询问确认

### 3. 执行归档

将变更目录下所有文件移动到 `openspec/changes/archive/{change-name}/`：
- 使用 `search_output_files` 列出变更下所有文件
- 对每个文件，用 `get_output_file` 读取内容，再用 `save_output_file` 写入到 archive/ 子路径
- 注意：目前系统不支持直接移动文件，通过"读取→写入新路径"的方式实现移动

### 4. 记录归档信息

在归档目录下创建 `archive-info.md`。

#### archive-info.md 格式

包含：变更名称、归档时间、任务完成度 N/N、归档方式（正常归档 或 强制归档含未完成任务清单）。

## 强制归档

如果用户明确要求强制归档（有未完成任务也归档），使用 `request_auth` 工具生成授权卡片让用户确认后执行归档，在 archive-info.md 中注明强制归档及未完成任务清单。

## 无变更名称时

如果用户只发送 `/openspec-archive` 未指定变更名称：
1. 使用 `search_output_files` 查询所有活跃变更（排除 archive/）
2. 读取各变更的 tasks.md，分析完成度
3. 使用 `display_table` 工具列出可归档的变更（所有任务已完成的优先），供用户选择

## 归档完成输出

```
## 归档完毕
**变更**: {change-name}
**归档路径**: openspec/changes/archive/{change-name}/
**归档时间**: {日期时间}
该变更已从活跃变更列表中移除。
```
