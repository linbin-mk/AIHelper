---
id: requirement-to-prd
name: Requirement to PRD
description: Input pain points or iteration requirements, AI automatically reads project knowledge base, generates structured PRD documents with work estimates, and exports as .md file download
category: Product
---

# Requirement to PRD

## Core Rules

1. **No user interviews**: Generate PRD directly based on user input and knowledge base information. Do not ask the user for additional details.

2. **Must export file**: After generating the PRD, you MUST call the `provide_file` tool to export it as a .md file.

3. **Fallback strategy**: If no knowledge base is available, infer project context from user input and note in the PRD: "Based on requirement description inference, recommend confirming work estimates with the development team."

## Workflow

### Step 1: Gather Project Information

- If a knowledge base exists (project files synced), call `list_project_files` to understand the project structure
- Based on keywords from the user's requirement description, call `search_project_code` to search related modules (search 1-3 keywords)
- If specific implementation details are needed, call `get_project_file` to read key files

### Step 2: Generate PRD Document

Synthesize all information and directly generate a complete PRD document.

**The PRD MUST include the following sections (in order)**:

```
# [Requirement Title]

> Document Version: v1.0 | Date: [today's date] | Status: Under Review

## Background
Current pain points, problem scenarios, impact scope

## Goals & Scope
What this iteration aims to solve, explicitly state what is NOT included (In Scope / Out of Scope)

## User Stories
As a [user role], I want [feature] so that [value] (list 2-4 items)

## Functional Requirements
List specific feature points with interaction logic and edge cases

## Acceptance Criteria
Verifiable criteria for each feature point (Given/When/Then format)

## Non-functional Requirements
Performance, security, compatibility requirements

## Work Estimates

### Development Task Breakdown

Break down development work into specific tasks with role-based estimates:

| Module | Task | Role | Est. (person-days) | Notes |
|--------|------|------|-------------------|-------|
| [Module] | [Task] | Frontend/Backend/QA/Product | X | [Notes] |

### Summary

| Role | Total (person-days) |
|------|-------------------|
| Frontend | X |
| Backend | X |
| QA | X |
| Product/Design | X |
| **Total** | **X** |

> Note: Above estimates are optimistic. Recommended buffer coefficient: 1.3x, making the project timeline approximately X person-days.
```

### Step 3: Export PRD File

Use the `provide_file` tool to export the PRD as a .md file with:
- `fileName`: PRD title + `.md`, e.g. "UserLoginModuleOptimization-PRD.md"
- `content`: complete PRD document in Markdown
- `mimeType`: `text/plain`

## Estimation Guidelines

- Frontend: page/component development, integration
- Backend: API development, database changes, business logic
- QA: test case writing, functional testing, regression testing
- Product/Design: prototypes, visual designs (if applicable)
- Task granularity: 0.5 ~ 3 person-days per task; split larger tasks further
- Estimate based on project complexity and existing code volume in the knowledge base
