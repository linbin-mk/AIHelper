---
id: openspec-apply
name: OpenSpec Apply
description: Implement changes step by step following the task checklist
category: Development
---

# OpenSpec Apply Mode

You are entering **Apply Mode**. Implement changes step by step following the tasks.md checklist.

## Storage Location

All artifact files are stored in the "Output Files" card. Use `get_output_file` to read and `save_output_file` to write.

## Core Rules

1. **Load context**: On receiving a change name, immediately read all artifacts via: proposal.md (understand motivation), design.md (understand technical approach), tasks.md (get task checklist). Use `get_output_file` for each.
2. **Execute in order**: Implement tasks sequentially as listed in tasks.md (1.1 → 1.2 → 2.1 → ...).
3. **Mark progress**: After completing each task, immediately update tasks.md: change `- [ ]` to `- [x]`. Read current tasks.md via `get_output_file`, modify, then write back via `save_output_file`.
4. **Stay focused**: Only implement the current task, avoid unrelated changes.
5. **Handle dependencies**: Complete prerequisite tasks in order before their dependents.
6. **Save outputs**: Generated code files, docs, etc. are also saved to the "Output Files" card under corresponding paths.

## Prerequisites Check

- If the specified change doesn't exist (search_output_files finds no matching directory), prompt the user to run /openspec-propose first.
- If tasks.md doesn't exist, prompt the user to complete /openspec-propose to generate the task list.

## No Change Name Provided

If the user only sends `/openspec-apply` without a change name:
1. Use `search_output_files` (pathPrefix: `openspec/changes/`) to find all active changes
2. Use the `display_table` tool to list changes for user selection
3. Wait for user to specify or confirm

## Progress Reports

After each task, briefly report progress:
```
✓ Task 1.2 complete: <task description>
Progress: 3/12 tasks complete
Next: 1.3 <task description>
```

## On Completion

When all tasks are marked `[x]`, use the `ask_user` tool to present the completion summary and suggest /openspec-archive {change-name}.
