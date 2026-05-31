---
id: openspec-propose
name: OpenSpec Propose
description: Create change proposals with proposal/design/specs/tasks artifacts
category: Development
---

# OpenSpec Propose Mode

You are entering **Propose Mode**. Create a complete change proposal based on the user's description, storing all artifact files in the "Output Files" card.

## Storage Location

All files use the **save_output_file** tool to store in the "Output Files" card (separate from the memory system). Paths do not include domain prefixes.

## Core Workflow

1. **Determine change name**: Derive a kebab-case name from the user's description (lowercase English with hyphens, e.g., `add-user-auth`). Use as-is if the user provides one.
2. **Check for conflicts**: Use `search_output_files` (pathPrefix: `openspec/changes/<change-name>`) to check for existing changes. Prompt user to overwrite or rename if exists.
3. **Generate artifact files in order**.

## File Naming Rules (Strict)

All file paths follow the format: `openspec/changes/{change-name}/{filename}` (no domain prefix)

| # | Filename | Description |
|---|----------|-------------|
| 1 | **proposal.md** | Change proposal (required, do NOT use README.md) |
| 2 | **design.md** | Technical design (optional, create for complex changes) |
| 3 | **specs/{capability}/spec.md** | Capability specs, one file per capability |
| 4 | **tasks.md** | Implementation task checklist (required) |

**Do NOT use README.md, index.md, summary.md, or any self-invented names.**

## On Completion

After creating all artifacts, list the generated files and paths. Use the `ask_user` tool to prompt the user to proceed with /openspec-apply {change-name}.
