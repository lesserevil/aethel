# Documentation

User-facing documentation for this project. Setup guides,
troubleshooting, operator how-tos, public API references.

If you're trying to learn how to **use** this project, you're in
the right place. If you're trying to learn how it **works inside**
or how it **might work in the future**, see [`../plans/`](../plans/).

## Contents

- [language-and-tooling.md](language-and-tooling.md) - implementation
  language and tooling decision for the MVP and future NVIDIA
  integration work.
- [office-assets.md](office-assets.md) - where GLB runtime assets live,
  how provenance is tracked, how to add a new office prop, and why the
  MVP uses GLB directly.
- [office-asset-sources.md](office-asset-sources.md) - provenance table
  for every selected asset: source pack, publisher, license, and runtime
  filename.
- [e2e-testing.md](e2e-testing.md) - Playwright e2e test setup and test
  file descriptions.

## Keeping docs in sync with code

Per [`../AGENTS.md`](../AGENTS.md), every commit that changes
user-visible behavior must update the relevant doc in the same
commit. The pre-commit hook warns when staged code touches a
feature area whose doc isn't also staged.
