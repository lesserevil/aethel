---
id: TASK-16.2
title: Add typed office asset manifest and environment asset fields
status: In Progress
assignee: []
created_date: '2026-06-05 01:52'
updated_date: '2026-06-05 04:35'
labels: []
dependencies:
  - TASK-16.1
documentation:
  - plans/office-asset-foundation-plan.md
modified_files:
  - web/src/assets/officeAssetManifest.ts
  - web/src/state/sessionTypes.ts
  - web/src/state/baselineSession.ts
parent_task_id: TASK-16
priority: high
ordinal: 36000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Plan: plans/office-asset-foundation-plan.md § Asset Manifest Contract and State and Controls.

WHAT TO DO
Create web/src/assets/officeAssetManifest.ts and any colocated tests needed for it. Define a typed manifest entry with stable id, label, category, local URL under /assets/office/, source name, source URL, license id, license URL, preferred transform, dimensions in meters, collider hint, and affordances. Extend the environment object types in web/src/state/sessionTypes.ts so scene objects can reference manifest assets through assetId, transform, collider, and affordances. Update web/src/state/baselineSession.ts so the standard office objects point at manifest asset IDs instead of being only procedural object labels.

WHY
The viewport, controls, chat context, future USD conversion, and future physics metadata need one shared asset catalog. Without typed manifest data, runtime assets and provenance will drift.

HOW TO VERIFY
Add tests that fail if any manifest asset is missing a local URL, source URL, license, transform, dimensions, or collider hint. Update existing state tests so the baseline office environment still serializes and reset behavior still works. Run make test for the updated TypeScript tests.

EDGE CASES AND PITFALLS
Do not store Three.js objects, loaded GLTF nodes, DOM handles, or provider clients in session state. The manifest should contain serializable metadata only. Preserve existing exported state type names unless a test update proves all callers were adjusted.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A typed office asset manifest exists and every manifest item has source, license, transform, dimensions, and collider metadata.
- [ ] #2 Environment state can reference manifest assets without storing renderer-specific objects.
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Understanding (2026-06-05): Need to (1) create web/src/assets/officeAssetManifest.ts with typed manifest entries, (2) extend SceneObjectState in sessionTypes.ts with assetId/collider/affordances fields, (3) update baselineSession.ts to reference manifest asset IDs, (4) add manifest tests. All data must be plain serializable objects.

Discovery (2026-06-05): Key files identified: web/src/state/sessionTypes.ts (SceneObjectState to extend), web/src/state/baselineSession.ts (3 objects to expand to full MVP set), web/src/state/baselineSession.test.ts and sessionReducer.test.ts (need updating). Need to create web/src/assets/ directory and officeAssetManifest.ts. The reducer test checks toHaveLength(3) which will need updating when baseline expands to 10 MVP objects.
<!-- SECTION:NOTES:END -->

## Comments
<!-- COMMENTS:BEGIN -->
<!-- COMMENT:BEGIN -->
index: 1
author: oompah
created: 2026-06-05 04:32

Agent dispatched (profile: default)
<!-- COMMENT:END -->
<!-- COMMENTS:END -->
