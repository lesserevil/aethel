# Office Asset Sources

This document records the provenance of every 3D asset selected for the first
standard office scene in Aethel. A later developer must be able to trace the
origin and license of each object from this table alone, without consulting any
out-of-band resource.

**Plan reference:** `plans/office-asset-foundation-plan.md` § Recommended Free
Sources and MVP Asset Set.

**Ground rule:** every asset listed here is CC0 or public domain. No
attribution-required asset may be added until Aethel has a shipped attribution
surface (a credits screen or equivalent). Do not commit raw source archives to
this repository; commit only optimized runtime GLB files that are below the
Git LFS threshold.

---

## Source Packs

| Pack name | Publisher | Pack URL | License | License URL |
|---|---|---|---|---|
| Kenney Furniture Kit | Kenney.nl | <https://poly.pizza/bundle/Furniture-Kit-NoG1sEUD1z> | CC0 1.0 Universal | <https://creativecommons.org/publicdomain/zero/1.0/> |
| Kenney Furniture Kit (canonical) | Kenney.nl | <https://kenney.nl/assets/furniture-kit> | CC0 1.0 Universal | <https://creativecommons.org/publicdomain/zero/1.0/> |
| Eclair Everyday Home & Desk Props GLB Pack | Eclair | <https://eclair-assets.itch.io/everyday-home-desk-props-glb-pack-30-free-cc0-3d-models> | CC0 1.0 Universal | <https://creativecommons.org/publicdomain/zero/1.0/> |

The Kenney Furniture Kit is listed twice: the Poly Pizza bundle is the primary
download entry point; the kenney.nl page is the canonical publisher record that
confirms the CC0 dedication independently of the marketplace listing.

---

## Selected Assets

Runtime files go under `web/public/assets/office/`. Every path listed in the
**Intended runtime filename** column is relative to that directory.

| Asset ID | Object label | Source pack | Source URL | License | License URL | Original format | Intended runtime filename | Notes |
|---|---|---|---|---|---|---|---|---|
| `desk` | Desk | Kenney Furniture Kit | <https://poly.pizza/bundle/Furniture-Kit-NoG1sEUD1z> | CC0 1.0 Universal | <https://creativecommons.org/publicdomain/zero/1.0/> | GLB | `office-desk.glb` | Shipped as GLB; no conversion needed. Verify exact filename in pack ZIP before copying (Kenney ships several desk variants; choose the simplest flat-top desk). |
| `deskChair` | Office Chair | Kenney Furniture Kit | <https://poly.pizza/bundle/Furniture-Kit-NoG1sEUD1z> | CC0 1.0 Universal | <https://creativecommons.org/publicdomain/zero/1.0/> | GLB | `office-chair.glb` | Shipped as GLB; no conversion needed. Kenney includes both high-back and low-back variants; prefer the high-back office chair for the default scene. |
| `laptop` | Laptop | Kenney Furniture Kit | <https://poly.pizza/bundle/Furniture-Kit-NoG1sEUD1z> | CC0 1.0 Universal | <https://creativecommons.org/publicdomain/zero/1.0/> | GLB | `office-laptop.glb` | Shipped as GLB; no conversion needed. Select the open-lid variant if both are present. |
| `keyboard` | Keyboard | Kenney Furniture Kit | <https://poly.pizza/bundle/Furniture-Kit-NoG1sEUD1z> | CC0 1.0 Universal | <https://creativecommons.org/publicdomain/zero/1.0/> | GLB | `office-keyboard.glb` | Shipped as GLB; no conversion needed. |
| `monitorWide` | Monitor / Screen | Kenney Furniture Kit | <https://poly.pizza/bundle/Furniture-Kit-NoG1sEUD1z> | CC0 1.0 Universal | <https://creativecommons.org/publicdomain/zero/1.0/> | GLB | `office-monitor.glb` | Shipped as GLB; no conversion needed. Prefer the widescreen variant (`monitorWide`) over a narrower variant if both are present. |
| `trashCan` | Trash Can | Kenney Furniture Kit | <https://poly.pizza/bundle/Furniture-Kit-NoG1sEUD1z> | CC0 1.0 Universal | <https://creativecommons.org/publicdomain/zero/1.0/> | GLB | `office-trashcan.glb` | Shipped as GLB; no conversion needed. |
| `lampDesk` | Desk Lamp | Kenney Furniture Kit | <https://poly.pizza/bundle/Furniture-Kit-NoG1sEUD1z> | CC0 1.0 Universal | <https://creativecommons.org/publicdomain/zero/1.0/> | GLB | `office-lamp.glb` | Shipped as GLB; no conversion needed. Select a desktop/arm lamp over a floor lamp. Satisfies the "small lamp or desk accessory" slot in the MVP asset set. |
| `mug` | Coffee Mug | Eclair Everyday Home & Desk Props GLB Pack | <https://eclair-assets.itch.io/everyday-home-desk-props-glb-pack-30-free-cc0-3d-models> | CC0 1.0 Universal | <https://creativecommons.org/publicdomain/zero/1.0/> | GLB | `office-mug.glb` | Shipped as individual GLB in the itch.io pack download; no conversion needed. Clutter prop #1. |
| `book` | Book | Eclair Everyday Home & Desk Props GLB Pack | <https://eclair-assets.itch.io/everyday-home-desk-props-glb-pack-30-free-cc0-3d-models> | CC0 1.0 Universal | <https://creativecommons.org/publicdomain/zero/1.0/> | GLB | `office-book.glb` | Shipped as individual GLB; no conversion needed. If the pack ships multiple book variants, choose the closed-cover variant for the default scene. Clutter prop #2. |
| `notebook` | Spiral Notebook | Eclair Everyday Home & Desk Props GLB Pack | <https://eclair-assets.itch.io/everyday-home-desk-props-glb-pack-30-free-cc0-3d-models> | CC0 1.0 Universal | <https://creativecommons.org/publicdomain/zero/1.0/> | GLB | `office-notebook.glb` | Shipped as individual GLB; no conversion needed. Select a spiral-bound or ruled notepad variant. Clutter prop #3. |

---

## Coverage Checklist

The following categories are required by the MVP asset set defined in the plan.
Every row must be filled before any downstream task (TASK-16.2 onward) begins
committing runtime assets.

| Category | Object label | Runtime filename | Covered? |
|---|---|---|---|
| Desk / work surface | Desk | `office-desk.glb` | ✅ |
| Seating | Office Chair | `office-chair.glb` | ✅ |
| Computing device | Laptop | `office-laptop.glb` | ✅ |
| Input device | Keyboard | `office-keyboard.glb` | ✅ |
| Display | Monitor / Screen | `office-monitor.glb` | ✅ |
| Waste container | Trash Can | `office-trashcan.glb` | ✅ |
| Desk accessory | Desk Lamp | `office-lamp.glb` | ✅ |
| Clutter prop #1 | Coffee Mug | `office-mug.glb` | ✅ |
| Clutter prop #2 | Book | `office-book.glb` | ✅ |
| Clutter prop #3 | Spiral Notebook | `office-notebook.glb` | ✅ |

---

## License Verification Notes

**Kenney Furniture Kit**

- The CC0 dedication is stated on the Kenney publisher page
  (<https://kenney.nl/assets/furniture-kit>), which reads: *"You can use this
  kit in both personal and commercial projects. No credit required."*
- The Poly Pizza bundle page (<https://poly.pizza/bundle/Furniture-Kit-NoG1sEUD1z>)
  also displays a CC0 badge. The Poly Pizza platform makes its own licensing
  claim per pack; the Kenney publisher page is considered the primary record
  since Kenney controls the copyright.
- CC0 means no copyright restrictions, no attribution required, no
  share-alike requirement. The asset is safe to ship in the default scene
  without any further license tracking.

**Eclair Everyday Home & Desk Props GLB Pack**

- The itch.io page explicitly states CC0 (Creative Commons Zero) and includes
  the phrase *"30 free CC0 3D models"* in the pack title.
- CC0 is confirmed at the itch.io listing URL above. No secondary license URL
  is provided by the publisher beyond the itch.io page itself; the CC0 license
  text is canonical at <https://creativecommons.org/publicdomain/zero/1.0/>.

---

## Rejected or Deferred Sources

The following sources were considered and explicitly deferred:

| Source | Reason deferred |
|---|---|
| Sketchfab CC-BY models | Attribution-required; Aethel does not yet have a shipped credits surface. Re-evaluate after TASK-16.5. |
| Poly Haven props | Primarily an HDRI/material library; few office-scale props. Useful later for environment textures. |
| The Base Mesh (thebasemesh.com) | Gap-fill source only; not needed for the MVP set since Kenney and Eclair cover all required categories. |
| CG3D (cg3d.org) | Gap-fill source only; same rationale as The Base Mesh. |
| Any paid marketplace asset | Out of scope per plan. |

---

## How to Add a New Asset

1. Confirm the license is CC0 or public domain. Check the publisher page, not
   just a marketplace tag. Copy the license URL.
2. Add a row to the **Selected Assets** table above with every column filled.
3. Add a row to the **Coverage Checklist** if the asset fills a new category.
4. Document any format conversion needed in the **Notes** column.
5. Do **not** commit the raw downloaded archive. Commit only the optimized
   runtime GLB to `web/public/assets/office/`.
6. If the optimized file exceeds the Git LFS threshold for this project, file
   a follow-up task before committing.
