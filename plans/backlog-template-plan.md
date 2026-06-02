# Backlog.md Template Plan

Status: Complete

## Context

Bootstrap is a project template. Its task-tracking contract should
initialize and document Backlog.md so downstream repositories start
with a local Backlog.md project and agent instructions that match the
current Backlog.md workflow.

The template uses the Backlog.md source at:

```text
https://github.com/lesserevil/Backlog.md
```

## Scope

- Update `make init` to run Backlog.md from the requested GitHub
  source and initialize a local project with non-interactive
  defaults.
- Update template documentation and agent instructions to use
  Backlog.md terminology, commands, relationships, and
  session-completion flow.
- Keep Backlog.md project files trackable by git so task state can be
  shared with the repository.

## Acceptance Criteria

- [x] CRIT-1: `make init` checks for `bun`, prints install guidance
      when it is missing, and runs Backlog.md from
      `github:lesserevil/Backlog.md` when `backlog/` and
      `backlog.config.yml` are absent.
- [x] CRIT-2: `AGENTS.md` documents the Backlog.md task workflow with
      MCP-first guidance, CLI fallbacks, task creation/editing,
      dependencies, plan links, and git-only session completion.
- [x] CRIT-3: Template docs and scaffolding contain no legacy tracker
      command, directory, or terminology tokens after the migration.
- [x] CRIT-4: Validation includes `make help`, a non-destructive
      `make init` exercise in a temporary directory, and a
      case-insensitive search for removed tracker terms.
