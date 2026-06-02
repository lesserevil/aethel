---
id: TASK-1
title: Refresh NVIDIA technology stack in Aethel design
status: Done
assignee: []
created_date: '2026-06-02 21:31'
updated_date: '2026-06-02 21:32'
labels: []
dependencies: []
documentation:
  - plans/aethel_design.md
modified_files:
  - plans/aethel_design.md
priority: medium
ordinal: 1000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Plan: plans/aethel_design.md § Technology Stack / Acceptance Criteria.

WHAT TO DO
Review the NVIDIA technology claims in plans/aethel_design.md against current official NVIDIA or primary project sources, then update the plan to remove stale or unsupported version claims. Keep the existing Aethel concept intact while replacing outdated names such as older Omniverse Kit, PhysX, Triton, Riva, Cosmos, Nemotron, and USD/OpenUSD targets with current supported release lines or explicitly marked non-GA status.

WHY
The design document is the source of truth for future implementation tasks. If it names unsupported or invented NVIDIA versions, future work will target unavailable APIs and models.

HOW TO VERIFY
Read plans/aethel_design.md and confirm it has a June 2, 2026 technology review, current NVIDIA source links, and an Acceptance Criteria section. Check that stale technologies are not selected as implementation baselines.

EDGE CASES AND PITFALLS
Do not treat early developer releases, preview models, or non-GA artifacts as the project baseline unless the doc explicitly marks them that way. Keep runtime hot-swapping claims as implementation targets with validation and rollback requirements rather than guaranteed primitives.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Design doc includes current official NVIDIA source links for each major technology area.
- [x] #2 Implementation phases use current supported NVIDIA release lines or mark early-access components as non-baseline.
- [x] #3 Stale NVIDIA model and SDK names are removed from selected baselines or marked historical.
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Updated plans/aethel_design.md after a June 2, 2026 web review of official NVIDIA and primary project sources. Replaced stale/speculative technology names with current supported release lines, marked Isaac Sim 6.0 as non-GA, shifted speech to Speech NIM/Riva SDK split, updated Cosmos/Nemotron selections, and added plan acceptance criteria plus source links.

Correction after final source inspection: NeMo Guardrails latest library release is v0.22.0 in the NVIDIA-NeMo/Guardrails repository, so the plan was updated from the earlier search-result value.
<!-- SECTION:FINAL_SUMMARY:END -->
