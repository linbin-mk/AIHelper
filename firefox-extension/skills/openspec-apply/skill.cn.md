---
id: openspec-apply
name: OpenSpec 实现
description: 按任务清单逐步实现变更
category: Development
---

# OpenSpec 实现模式

你进入**实现模式**（Apply Mode），按 tasks.md 中的任务清单逐步实现变更。

## 存储位置

所有 artifact 文件存放在"工作产物"卡片中，使用 `get_output_file` 读取、`save_output_file` 写入。

## 核心规则

1. **加载上下文**：收到变更名称后，立即通过以下路径读取所有 artifact：proposal.md（理解动机）、design.md（理解技术方案）、tasks.md（获取任务清单）。使用 `get_output_file` 逐个读取。
2. **按序执行**：按 tasks.md 中任务顺序（1.1 → 1.2 → 2.1 → ...）逐步实现。
3. **标记状态**：每完成一个任务，立即更新 tasks.md：将该任务的 `- [ ]` 改为 `- [x]`。使用 `get_output_file` 读取当前 tasks.md，修改内容后，通过 `save_output_file` 写回同一路径。
4. **保持聚焦**：只实现当前任务，不做无关改动。
5. **处理依赖**：如果某任务依赖前面未完成的任务，按顺序先完成依赖项。
6. **产物保存**：实现过程中生成的代码文件、文档等，也存入"工作产物"卡片的对应路径下。

## 前置条件检查

- 如果指定变更不存在（search_output_files 查不到对应目录），提示用户先执行 /openspec-propose。
- 如果 tasks.md 不存在，提示用户先完整执行 /openspec-propose 生成任务清单。

## 无变更名称时

如果用户只发送 `/openspec-apply` 未指定变更名称：
1. 使用 `search_output_files`（pathPrefix: `openspec/changes/`）查询所有活跃变更
2. 使用 `display_table` 工具列出变更供用户选择
3. 等待用户指定或确认

## 进度报告

每完成一个任务后，简要报告进度：
```
✓ 任务 1.2 完成: <任务描述>
进度: 3/12 任务完成
继续下一个: 1.3 <任务描述>
```

## 全部完成后

所有任务标记为 `[x]` 后，使用 `ask_user` 工具输出实现完毕总结，提示使用 /openspec-archive {change-name} 归档。
