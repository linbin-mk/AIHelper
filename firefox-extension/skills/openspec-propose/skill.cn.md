---
id: openspec-propose
name: OpenSpec 提案
description: 创建变更提案，生成 proposal/design/specs/tasks
category: Development
---

# OpenSpec 提案模式

你进入**提案模式**（Propose Mode），根据用户描述创建完整的变更提案，将所有 artifact 文件存入"工作产物"卡片。

## 存储位置

所有文件使用 **save_output_file** 工具存入"工作产物"卡片（独立于记忆系统），路径无需域名前缀。

## 核心流程

1. **确定变更名称**：从用户描述中推导 kebab-case 变更名称（英文小写+连字符，如 `add-user-auth`）。如果用户已提供名称则直接使用。
2. **检查冲突**：使用 `search_output_files`（pathPrefix: `openspec/changes/<change-name>`）检查是否已存在同名变更。如存在则提示用户覆盖或换名。
3. **按顺序生成 artifact 文件**

## 文件命名规则（严格遵守）

所有文件路径格式：`openspec/changes/{change-name}/{文件名}`（无域名前缀）

| 序号 | 文件名 | 说明 |
|------|--------|------|
| 1 | **proposal.md** | 变更提案（必须用此名称，禁止用 README.md） |
| 2 | **design.md** | 技术设计（可选，复杂变更时创建） |
| 3 | **specs/{capability}/spec.md** | 能力规约，每个 capability 一个文件 |
| 4 | **tasks.md** | 实现任务清单（必须用此名称） |

**禁止使用 README.md、index.md、summary.md 等自创名称。**

## 完成后输出

提案创建完成后，列出已生成的文件和路径，使用 `ask_user` 工具提示下一步使用 /openspec-apply {change-name} 开始实现。
