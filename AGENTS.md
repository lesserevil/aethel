# Agent Instructions

This file covers the day-to-day operating rules for agents working
in this repo: issue tracking, doc sync, the test/quality gates, and
session-close protocol. Read it before starting non-trivial work.

> If a `CONTRIBUTING.md` exists, that's the methodology source of
> truth (requirements -> design <-> tests <-> code -> verification)
> and takes precedence on workflow questions. This file enforces
> consistency once code is being written.

## Issue Tracking with Backlog.md

This project uses **Backlog.md** for ALL task tracking. Backlog.md
stores project work as Markdown files in the repo and should be
managed through its MCP tools or CLI, not by hand-editing task files.

Use the Backlog.md version from:

```text
https://github.com/lesserevil/Backlog.md
```

### Quick reference

Prefer MCP tools when the client provides them:

```text
get_backlog_instructions overview
task_search / task_list
task_view <id>
task_create
task_edit
```

Use the CLI when MCP tools are not available:

```bash
backlog task list --plain --status "To Do"       # Find available work
backlog search "query" --plain                   # Search existing work
backlog task <id> --plain                        # View task details
backlog task create "Title" --status "To Do"     # Create tracked work
backlog task edit <id> --status "In Progress"    # Claim work
backlog task edit <id> --status "Done"           # Mark work done
```

When using this bootstrap template itself, `make init` runs Backlog.md
through Bun from `github:lesserevil/Backlog.md` so the requested fork
is used even before a global `backlog` command exists.

### Rules

- Use Backlog.md for ALL task tracking.
- At the beginning of non-trivial work, load the Backlog.md workflow
  guidance. With MCP, call `get_backlog_instructions` for the
  overview. With CLI-only access, run `backlog --help` and inspect
  the current task commands before filing or changing work.
- Search for existing work before creating a new task.
- Use `task_create` / `task_edit` MCP tools when available. If using
  CLI, prefer `backlog task create`, `backlog task edit`,
  `backlog task list --plain`, `backlog search --plain`, and
  `backlog task <id> --plain` for machine-readable output.
- Link dependent work with parent tasks or dependencies where
  appropriate.
- Do NOT use TodoWrite, TaskCreate, or standalone markdown TODO
  lists outside Backlog.md.
- Do NOT use `MEMORY.md` files -- they fragment across accounts.
- Do NOT use commands that open `$EDITOR`; prefer non-interactive
  Backlog.md commands and flags.
- Do NOT edit task files directly. Use Backlog.md MCP tools or CLI so
  metadata, relationships, and history stay consistent.

### Priorities

Use the priority names configured by Backlog.md and shown by
`backlog task create --help`, `backlog task edit --help`, or the MCP
task schema. Do not assume project-specific priority names beyond
what the tool reports.

## Documentation must match code

**User docs are part of the contract: they MUST always accurately
describe current behavior. Drift is a bug.**

**Every commit that changes user-visible behavior must update the
user docs in the same commit.** Do not land code changes that make
the docs inaccurate.

User-visible surfaces that trigger doc updates:

- CLI flags (added, removed, renamed, default changed)
- Build commands and packaging scripts
- System dependencies / runtime requirements
- Configuration file schema or env var names
- Platform support (new OS/arch added or dropped)

### Documentation layout

Project docs are split across two top-level directories. Pick the
right one when adding new docs.

- **`docs/`** -- *user-facing documentation*. Setup guides,
  troubleshooting, operator how-tos, **administration guides**,
  **runbooks**, **on-call procedures**, public API references.
  Anything someone reading the project to learn how to **use**,
  **operate**, or **administer** it would want. "User" here means
  *any* consumer of the project -- end users, operators,
  administrators, and on-call responders alike. Administration docs
  and runbooks are user docs and **MUST** live in `docs/`, never in
  `plans/`.

- **`plans/`** -- *design / implementation documentation*.
  Architecture notes, proposed-but-not-yet-shipped features, internal
  mechanism inventories, experimental design records. Anything
  someone reading the project to learn how it **works inside**, or
  how it **might work in the future**, would want. Runbooks are
  *not* design docs even when they explain internals -- if the doc
  tells someone what to *do*, it belongs in `docs/`.

Quick test: if the doc tells the reader "what to do with this
project" (use it, operate it, administer it, respond to an
incident), it goes in `docs/`. If it tells them "what this project
does inside, or what it should do," it goes in `plans/`.

### Diagrams: Mermaid only

When creating diagrams in documentation, **always use Mermaid**
(```mermaid code blocks). Never use ASCII art diagrams.

## Plans -> Backlog.md tasks -> code -> plan-complete

All non-trivial work follows this loop:

1. **Update the plan doc.** Edit (or create) the relevant
   `plans/*.md` to capture the design change. The plan **MUST
   include an explicit "Acceptance Criteria" section** -- a testable,
   enumerated definition of what "this plan is complete" means. If
   you cannot write that section, the plan isn't ready and you
   should not create tasks against it yet.

2. **Generate Backlog.md tasks from the plan.** Break the plan into
   `backlog task create` work items, or use the Backlog.md MCP
   `task_create` tool. Every task **MUST reference its plan doc** in
   its description or documentation field (path + section, e.g.
   `Plan: plans/feature-x-plan.md §5 Data Channel Protocol`). Mirror
   the relevant acceptance criterion in the task's acceptance
   criteria.

3. **Agents claim and execute.** Standard flow is:
   search/list ready work -> view task details -> set the task to
   `In Progress` -> implement -> verify -> set the task to `Done`.
   Code commits update the plan doc in the same commit when behavior
   shifts.

4. **Close the plan when criteria are met.** A plan is **not**
   complete just because its tasks are done -- the acceptance
   criteria are the gate. Once every task is done AND every
   acceptance item is demonstrably satisfied, mark the plan complete
   (status header or `Status: Complete` line at the top).

### Acceptance criteria -- required shape

```markdown
## Acceptance Criteria

- [ ] CRIT-1: <testable claim, e.g. "Native client round-trips
      text/plain clipboard updates with echo suppression -- covered
      by `loop_guard_swallows_just_applied` and the loopback
      integration test in `tests/e2e`.">
- [ ] CRIT-2: ...
```

Each item must be testable (a passing test, a CLI invocation with
expected output, a manual procedure with a clear pass/fail). Vague
criteria ("works well", "is robust") do not count.

### Backlog.md task -> plan linkage -- required shape

```bash
backlog task create "Implement CBOR clipboard envelope on native client" \
  --status "To Do" \
  --priority high \
  --doc plans/clipboard-sync-plan.md \
  --description "$(cat <<'EOF'
Plan: plans/clipboard-sync-plan.md §5. Replaces the simplified ClipboardMessage with the ClipboardUpdate/Request/Clear/Chunk envelope.

WHAT TO DO
Implement the native client clipboard envelope while preserving the existing public command surface.

WHY
This keeps clipboard sync behavior consistent across native and web clients.

HOW TO VERIFY
Run the native unit tests and the loopback integration test in tests/e2e.

EDGE CASES AND PITFALLS
Preserve echo suppression and sequence-number handling.
EOF
)" \
  --ac "Native client emits and accepts ClipboardUpdate with seq numbers." \
  --ac "Loopback e2e test passes."
```

The `Plan:` line or documentation field is mandatory. Tasks carrying
one of the exemption labels skip the requirement: `infra`,
`tooling`, `meta`, `no-plan-required`.

If this project ships `scripts/backlog-plan-ref-lint.sh`, wire it
into preflight or CI:

```bash
scripts/backlog-plan-ref-lint.sh --quiet || exit 1
```

### Backlog.md tasks must stand alone -- required completeness

**Every task MUST be written for a naive but competent junior
developer.** Assume that developer can write the language, run the
standard toolchain, and read anything checked into the repo --
`AGENTS.md`, `README.md`, the `Makefile`, the source tree. Do **not**
assume they have read the plan doc, prior tasks, or any conversation
that led to this task being filed. The task must remove all ambiguity
about scope and required work: if a competent reader could plausibly
interpret the body two different ways, the task is not ready.

The task body must contain enough context that such a developer could
execute the task end-to-end **without consulting a senior developer,
the plan doc, other tasks, or any out-of-band knowledge**. The
mandatory `Plan: plans/<doc>.md §N` reference is for *traceability*
(where did this work originate), not *delegation* (go read the plan
to figure out what to do).

A junior developer reading the task in isolation must already know:

- **What to do** -- concrete files, packages, functions, or commands
  to create or modify. Name them.
- **Why** -- the user-visible behavior, constraint, or design rule
  this serves. One or two sentences.
- **How to verify** -- the test, command, or observable result that
  proves the work is done. This should appear in the body in
  everyday terms.
- **Edge cases and pitfalls** -- non-obvious constraints a careful
  reader could still miss. Examples: "preserve the exact exported
  function signature so existing callers compile unchanged"; "the
  stub is allowed to return a `not implemented` error at runtime but
  must still compile under all supported targets."
- **Project-specific terminology** -- if the task uses a term that
  only makes sense in context (a milestone name, a pattern coined in
  the plan, an internal package nickname), explain it inline or
  paraphrase the relevant plan passage. Do not assume the reader
  will follow the `Plan:` link.

If you cannot write a body at that level of completeness, the task
is not ready to file. Either the underlying plan section is too thin
(fix the plan first), or the work needs to be split into smaller
tasks that are individually self-explanatory.

This rule applies equally to follow-up tasks created through the
current Backlog.md relationship flags -- a task filed
mid-implementation must still stand alone, because whoever picks it
up next won't have the discovering session's context.

### Scope a Backlog.md task to one logical unit of work

A task covers **one** subsection of the system, not a mixed bag.
Examples of correctly-scoped units:

- one page's UI update
- one API endpoint (or one cohesive set of changes to one endpoint)
- one DB migration
- one module's interface refactor
- one parallel-package implementation

If a task touches two unrelated subsystems, requires two independent
acceptance criteria, or has a body that reads "...and then also...",
it should be split. Scope is bounded by the work, not by a line count
-- a single change that genuinely needs five pitfalls documented is
still one task.

## Use Makefile targets

**ALWAYS use Makefile targets** when one exists for the task you're
performing. Before running a raw command, check if there's a `make`
target that does the same thing. Makefile targets encode
project-specific flags, sequences, and conventions that raw commands
may miss.

If unsure whether a target exists, run `make help` or grep the
Makefile.

## Test coverage required

**ALL code changes MUST be covered by tests.**

- New functions/methods require unit tests
- Bug fixes require a test that reproduces the bug
- Run the project test target before committing
- Tests go in `tests/` (or the project's idiomatic location)
  following existing patterns

## Commit attribution

Default: **no agent/model attribution trailer**. Do NOT add
`Co-Authored-By: Claude <noreply@anthropic.com>`,
`Co-Authored-By: GPT-...`, or any other model/vendor trailer. The
codebase author is the human owner; the underlying model is an
implementation detail.

If this project has a bot persona (a real GitHub account with a
`@users.noreply.github.com` email), document the required trailer
here and install a `prepare-commit-msg` hook to enforce it. Example:

```text
Co-authored-by: <bot-name> <bot-name@users.noreply.github.com>
```

## Non-interactive shell commands

**ALWAYS use non-interactive flags** with file operations. Shell
commands like `cp`, `mv`, and `rm` may be aliased to include `-i`
(interactive) mode on some systems, causing the agent to hang
indefinitely waiting for y/n input.

```bash
cp -f source dest           # NOT: cp source dest
mv -f source dest           # NOT: mv source dest
rm -f file                  # NOT: rm file
rm -rf directory            # NOT: rm -r directory
cp -rf source dest          # NOT: cp -r source dest
```

Other commands that may prompt:

- `scp` -- use `-o BatchMode=yes`
- `ssh` -- use `-o BatchMode=yes` to fail instead of prompting
- `apt-get` -- use `-y` flag
- `brew` -- use `HOMEBREW_NO_AUTO_UPDATE=1` env var

## Sanity check before committing

Run the project's quality gates from the repo root before every
commit. Prefer Makefile targets; fall back to raw tool invocations
only if no target exists.

<!-- PROJECT: replace with this project's actual gates -->

```bash
make fmt-check    # formatter drift
make build        # default build
make test         # unit + integration tests
make lint         # static analysis (if configured)
```

If any of those fail, the commit isn't ready. If you changed a CLI
flag, grep the docs for the old flag name before opening the PR.

### Pre-commit hooks

Install once per clone:

```bash
git config core.hooksPath scripts/githooks
```

<!-- PROJECT: list what the hook actually checks (fmt drift,
     plan-doc sync warning, plan-ref lint, ...). The drift check is a
     heuristic, not a proof -- treat its warning as a question worth
     answering, not an obstacle to dismiss. -->

## Session completion ("Landing the Plane")

**When ending a work session**, you MUST complete ALL steps below.
Work is NOT complete until `git push` succeeds.

**MANDATORY WORKFLOW:**

1. **File issues for remaining work** -- Create Backlog.md tasks for
   anything that needs follow-up.
2. **Run quality gates** (if code changed) -- tests, linters, builds.
3. **Update issue status** -- Close finished work, update in-progress
   items.
4. **PUSH TO REMOTE** -- This is MANDATORY:
   ```bash
   git pull --rebase
   git push
   git status       # MUST show "up to date with origin"
   ```
5. **Clean up** -- Clear stashes, prune remote branches.
6. **Verify** -- All changes committed AND pushed.
7. **Hand off** -- Provide context for next session.

**CRITICAL RULES:**

- Work is NOT complete until `git push` succeeds
- NEVER stop before pushing -- that leaves work stranded locally
- NEVER say "ready to push when you are" -- YOU must push
- If push fails, resolve and retry until it succeeds

---

## Customize per project

When forking this template, do the following. Items not listed here
have defaults baked in above; you only need to revisit them if you
want to diverge.

1. **Pick a license.** Add a `LICENSE` file at the repo root and
   note the license in `README.md`. Until this exists the project is
   "all rights reserved" by default, which blocks any external
   contribution or reuse. Common choices: MIT or Apache-2.0
   (permissive), or a proprietary notice for internal-only repos.
2. **Toolchain & build commands** -- Replace the gates in "Sanity
   check before committing" with this project's real `fmt / build /
   test / lint` invocations (Cargo, uv/pytest, npm, Go, ...).
3. **Pre-commit hook checks** -- Fill in the `<!-- PROJECT: -->`
   placeholder under "Pre-commit hooks" with what the hook actually
   runs.
4. **Canonical user-doc filenames** -- Below `docs/`, list the files
   that must stay in sync with code (e.g. `installation.md`,
   `getting-started.md`, `troubleshooting.md`, per-CLI-binary
   pages). The "Documentation must match code" section enumerates
   *categories* of changes; this list enumerates the *files*.
5. **Configuration surface** -- If the project has a runtime config
   mechanism (`.env`, `config.toml`, env-var conventions), document
   where tunables live vs. what stays in code/workflow.
6. **Commit attribution trailer** -- Only if this project has a real
   bot GitHub account. Fill in the trailer under "Commit
   attribution" and install a `prepare-commit-msg` hook. Otherwise
   leave the default (no trailer).
7. **Backlog.md agent integrations** -- Ensure editor or agent hooks
   use the `backlog` MCP server or the Backlog.md CLI workflow, and
   keep those hooks aligned with the current project setup.
8. **Plan-reference lint script** -- If you want enforcement of the
   `Plan:` line on every task, ship
   `scripts/backlog-plan-ref-lint.sh` and wire it into preflight/CI.
   The *rule* is on by default; the *enforcement script* is opt-in.
9. **Opt-in: CONTRIBUTING.md** -- Write one if this project warrants
   a separate methodology doc (design-first pipeline, when each
   workflow step applies). Otherwise the pointer at the top of this
   file is a no-op.
