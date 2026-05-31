---
id: openspec-archive
name: OpenSpec Archive
description: Archive completed changes
category: Development
---

# OpenSpec Archive Mode

You are entering **Archive Mode**. Archive completed changes.

## Storage Location

All artifact files are stored in the "Output Files" card. Use `get_output_file` to read and `save_output_file` to write.

## Core Workflow

### 1. Load Change

On receiving a change name, read tasks.md to check completion. Use `get_output_file` to read `openspec/changes/{change-name}/tasks.md`.

### 2. Check Completion

Analyze checkbox states in tasks.md:
- All tasks `[x]` → can archive normally
- Any `[ ]` incomplete tasks → use the `ask_user` tool to warn the user, list incomplete tasks, ask for confirmation

### 3. Execute Archive

Move all files from the change directory to `openspec/changes/archive/{change-name}/`:
- Use `search_output_files` to list all files under the change
- For each file, read via `get_output_file`, then write via `save_output_file` to the archive/ subpath
- Note: The system currently doesn't support direct file moving; implement via "read → write to new path"

### 4. Record Archive Info

Create `archive-info.md` in the archive directory.

#### archive-info.md Format

Include: change name, archive time, task completion rate N/N, archive method (normal or forced with list of incomplete tasks).

## Forced Archive

If the user explicitly requests forced archive (with incomplete tasks), use the `request_auth` tool to generate an authorization card for user confirmation before archiving. Note forced archive and incomplete task list in archive-info.md.

## No Change Name Provided

If the user only sends `/openspec-archive` without a change name:
1. Use `search_output_files` to find all active changes (exclude archive/)
2. Read each change's tasks.md and analyze completion
3. Use the `display_table` tool to list archivable changes (prioritize fully completed ones)

## Archive Completion Output

```
## Archive Complete
**Change**: {change-name}
**Archive Path**: openspec/changes/archive/{change-name}/
**Archive Time**: {datetime}
This change has been removed from the active changes list.
```
