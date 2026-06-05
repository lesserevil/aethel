---
id: TASK-16.1
title: Select and license-audit the first free office asset set
status: Done
assignee: []
created_date: '2026-06-05 01:52'
updated_date: '2026-06-05 02:47'
labels: []
dependencies: []
documentation:
  - plans/office-asset-foundation-plan.md
modified_files:
  - docs/office-asset-sources.md
parent_task_id: TASK-16
priority: high
ordinal: 35000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Plan: plans/office-asset-foundation-plan.md § Recommended Free Sources and MVP Asset Set.

WHAT TO DO
Choose the exact free assets for the first standard office preset. Start with the Kenney Furniture Kit on Poly Pizza for desk, chair, laptop, keyboard, monitor/screen, and trash can. Use Eclair Everyday Home & Desk Props GLB Pack for at least three clutter/accessory props if Kenney does not cover the right small objects. Create docs/office-asset-sources.md with a table listing each selected asset id, object label, source pack, source URL, license name, license URL, original format, intended runtime filename, and notes about any conversion needed.

WHY
The project needs asset provenance before any art files enter the runtime. A later developer should be able to tell exactly where each office object came from and whether it is safe to ship in the default scene.

HOW TO VERIFY
Read docs/office-asset-sources.md and confirm it lists desk, chair, laptop, keyboard, monitor/screen, trash can, and at least three clutter/accessory props. Confirm every row is CC0 or public domain and includes a source URL and license URL. Run make fmt-check if the formatter covers Markdown.

EDGE CASES AND PITFALLS
Do not select paid assets, attribution-required assets, or assets whose license is only implied by a marketplace tag without a license page or archived note. Do not commit raw downloaded archives in this task. If a source file is large enough to require Git LFS, file a follow-up instead of committing it directly.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 docs/office-asset-sources.md lists the selected standard office asset set with source and license URLs.
- [x] #2 Every selected asset is CC0/public domain or explicitly rejected before runtime integration begins.
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Understanding: No duplicate found - TASK-16.1 is the only license-audit task for office assets. Previous duplicate investigator agents dispatched but did not complete the work. Task is documentation-only: create docs/office-asset-sources.md. Sources: Kenney Furniture Kit (CC0, Poly Pizza) for primary furniture, Eclair Everyday Home & Desk Props GLB Pack (CC0) for clutter props.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Created docs/office-asset-sources.md documenting 10 CC0 assets for the first standard office scene. Primary source: Kenney Furniture Kit (Poly Pizza, CC0) covers desk, office chair, laptop, keyboard, monitor/screen, trash can, and desk lamp. Supplemental source: Eclair Everyday Home & Desk Props GLB Pack (itch.io, CC0) covers 3 clutter props (coffee mug, book, spiral notebook). Document includes asset IDs, source URLs, license URLs (all CC0 1.0), original formats (GLB), intended runtime filenames under web/public/assets/office/, conversion notes, and a rejected-sources table. Confirmed not a duplicate. make fmt-check passes.
<!-- SECTION:FINAL_SUMMARY:END -->

## Comments
<!-- COMMENTS:BEGIN -->
<!-- COMMENT:BEGIN -->
index: 1
author: oompah
created: 2026-06-05 02:39

Agent dispatched (profile: default)
<!-- COMMENT:END -->
<!-- COMMENT:BEGIN -->
index: 2
author: oompah
created: 2026-06-05 02:39

Focus: Duplicate Investigator
<!-- COMMENT:END -->
<!-- COMMENT:BEGIN -->
index: 3
author: oompah
created: 2026-06-05 02:42

Agent dispatched (profile: default)
<!-- COMMENT:END -->
<!-- COMMENTS:END -->
