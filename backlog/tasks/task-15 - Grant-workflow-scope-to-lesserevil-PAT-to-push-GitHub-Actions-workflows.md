---
id: TASK-15
title: Grant workflow scope to lesserevil PAT to push GitHub Actions workflows
status: Needs Human
assignee: []
created_date: '2026-06-04 18:14'
labels: []
dependencies: []
priority: high
ordinal: 32000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The lesserevil GitHub PAT used for git push does not have the 'workflow' scope (only has: read:org, repo, write:packages). GitHub refuses to push files under .github/workflows/ without workflow scope.

The CI workflow YAML is stored at `docs/pending/github-actions-ci.yml` (in this repo, on the dev branch after TASK-8.5 merges). To activate GitHub Actions CI:

1. Update the lesserevil PAT at https://github.com/settings/tokens to include the 'workflow' scope.
2. From the repo root (with the updated PAT in git credentials):
   ```bash
   mkdir -p .github/workflows
   cp docs/pending/github-actions-ci.yml .github/workflows/ci.yml
   git add .github/workflows/ci.yml
   git commit -m "TASK-15: Activate GitHub Actions CI workflow"
   git push origin dev
   ```
3. Delete `docs/pending/github-actions-ci.yml` once the workflow is confirmed active in GitHub Actions.
<!-- SECTION:DESCRIPTION:END -->
