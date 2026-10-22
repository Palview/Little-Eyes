# Little Eyes Furniture Customization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Preserve the selected native execution method: implement in this session, then obtain one fresh review of the completed update.

**Goal:** Make existing clinic furniture customizable in four directions with accurate artwork, connected character interactions and one reliable move/rotate/style preview.

**Architecture:** Introduce explicit four-view geometry and art profiles shared by placement, navigation and rendering. Keep pending customization in a separate session that rebuilds a complete atomic draft from its original clinic, while schema v4 preserves v3/v2 layouts. Extend the current Canvas compositor for occupied chairs, counters and exam stations.

**Tech Stack:** Existing browser ES modules, Canvas 2D, localStorage, Node assertion/VM tests, image generation, PNG manifest registration and the native Canvas proof harness. No new browser runtime dependency.

**Spec:** `/workspace/docs/superpowers/specs/2026-10-22-little-eyes-furniture-customization-design.md` (approved).

## Global Constraints

- Keep the portrait clinic camera fixed. Retain current pan/zoom, safe-area spacing and the existing warm isometric pixel-art direction.
- Use orientation IDs `0`, `1`, `2`, `3`; retain the current two views and service coordinates for `0` and `1`. Four turns restore the original orientation and access profile without changing `(x,y)`.
- The stored `(x,y)` remains the top-left of the oriented floor footprint. Orientations `0`/`2` use original width/height; `1`/`3` use swapped dimensions.
- Define `2` as the 180-degree counterpart of `0`, and `3` as the counterpart of `1`: local point `(a,b)` becomes `(width-1-a,height-1-b)` within that view's dimensions, including external service points.
- Cover every existing floor-furniture category and style. Wall prints remain mounted to the existing wall plane with style and wall-slot movement, without free rotation controls.
- Retain eight patient appearances, four equipment models, both presets and both starter choices. Do not change prices, limits, XP, equipment statistics or ownership rules.
- Patient, staff and machine positions must match each view. Rear views require actual rear poses and art; symmetric components may share a documented asset only when their appearance and function are identical.
- Trial frames remain worn spectacles. Phoropter heads stay mechanically connected through sit/exam/stand. Occupied edits preserve reserved equipment, remaining timers, payout and exactly-once payment/XP.
- Move, rotate and style belong to one pending edit. Confirm commits once; Cancel, selection switch and panel close leave the original object and wallet unchanged. Invalid candidates remain visible and red, with Confirm disabled.
- Keep rotate, reverse, Confirm and Cancel touch targets at least 44 CSS pixels. `R` rotates forward; `Shift+R` rotates backward. Preserve keyboard/object-list access and reduced-motion behavior.
- Introduce schema `4`, key `little-eyes-tycoon-v4`; automatic migration preserves original v3/v2 records. Confirmed reset clears v4/v3/v2, retaining the separate original-prototype save.
- Verify 4 equipment models × 4 orientations × 8 patient appearances = 128 examination combinations, plus chair, reception, customization and transition proofs.
- Preserve the prior local deliverable. Retain Site ID `appgprj_6ad682ebf8c08191a90cd796f2c1ab23` and its audience; report hosting/browser/device blockers accurately. Android packaging remains separate.

## Review Focus

1. Repeated invalid rotations or locked-style clicks after a pending move must retain all candidate fields and never double-charge a new purchase (Tasks 4–5).
2. Rotating occupied chairs, counters or exam stations toward room edges must either preserve service/reward state safely or reject the edit without stranding actors (Tasks 1, 3–4).
3. An old valid layout using orientation `1` must migrate in place with identical approaches; corrupt newest saves and blocked writes must preserve recoverable data (Task 2).
4. Source frames with inconsistent padding or rear-facing aliases must not move eyes/hands, change body scale or draw a patient over a chair back (Task 3).
5. Transparent foregrounds, thin equipment supports and preview overlays must select the visible intended object without capturing taps through an invisible layer (Tasks 3, 5).

---

## File and interface map

Project paths below are relative to `/workspace/sites/little-eyes`.

- New `dist/tycoon/orientations.mjs`: four geometry/service profiles; no Canvas or DOM dependencies.
- New `dist/tycoon/furniture-profiles.mjs`: per-view sprite layers, registration, pose/contact anchors and explicit symmetry aliases. Consumes catalog and orientation data; catalog does not import it.
- `dist/tycoon/grid.mjs`: footprints, approach reachability and layout validation consume orientation profiles.
- `dist/tycoon/persistence.mjs`: strict v4 validation, pure v3/v2 conversion, explicit older-record recovery and reset behavior.
- `dist/tycoon/interactions.mjs`, `scene.mjs`: attachment ownership, furniture/actor layer composition, mounts, preview access markers and visible-pixel picking.
- `dist/assets/rotation/`: original PNG atlases and `registration.json` describing inspected source rectangles, anchors, masks and any justified symmetry aliases. Preserve original generated PNGs.
- New `scripts/register-furniture-art.py`: reads the original atlases/registration metadata and updates `dist/assets/manifest.json`; never edits generated image pixels. `assets.mjs` validates registered layers.
- `dist/tycoon/build.mjs`: atomic candidate operation and existing route/transaction protections.
- New `dist/tycoon/customization.mjs`: pure pending-edit session controller, separate from durable clinic and DOM state.
- `dist/app.mjs`, `dist/tycoon/ui.mjs`, `progression-ui.mjs`, `dist/styles.css`, `dist/index.html`: selected-object Customize flow, unified preview, controls and migration messaging.
- Existing `tests/tycoon-*.test.mjs`, new `tests/tycoon-customization.test.mjs`, new `tests/tycoon-customization-ui.test.mjs`, and `tests/helpers/dom-harness.mjs`: domain and standalone integration verification.
- `scripts/package-standalone.mjs`, `check-tycoon.mjs`, `render-station-proof.mjs`: dependency order, regression runner and production visual proofs.
- New `docs/furniture-customization-log.md`, `docs/furniture-customization-release-notes.md`: implementation evidence, review rulings and handoff limits.

Dependency direction: catalog → orientations → furniture profiles; catalog → progression; grid → orientations; interactions → profiles/grid; simulation → interactions/grid/progression; build → simulation/grid; customization → build. Persistence consumes geometry/profile definitions without requiring image loading. UI consumes pure profile/session results, and app composes everything. Add new modules to the standalone bundler in this dependency order.

Tasks 1–4 verify their domain boundaries while dependent consumers are migrated. Task 5 is the complete standalone acceptance gate; keep the released HTML/source backup intact until that gate passes. Run the full suite when assessing task completion, recording any known downstream failures rather than describing an incomplete suite as green.

## Task 1: Four-view geometry and safe placement

**Files:** Create `dist/tycoon/orientations.mjs`; modify `catalog.mjs`, `grid.mjs`, `scene.mjs` dimension consumers and `scripts/package-standalone.mjs`; extend `tests/tycoon-grid.test.mjs` and `tycoon-build.test.mjs`.

**Interfaces:**
- `isRotatable(kind) -> boolean`: true for current floor categories; false for wall art.
- `rotateFacing(rotation, step = 1) -> 0|1|2|3`: accepts current orientation and step `1` or `-1`, wrapping modulo four; invalid input is rejected.
- `orientationFor(kind, rotation) -> {rotation, width, height, approaches}`: local approach points keyed `patient`/`staff` where applicable. Unknown kind/orientation throws; wall art accepts only `0` in new data.
- Existing `footprint(item)`, `serviceTiles(item)` and `validateLayout(clinic)` retain return shapes; invalid external input returns layout failure rather than uncaught exceptions.

- [ ] Snapshot current `dist/`, scripts/tests and standalone HTML into `snapshots/before-furniture-customization/`; run `node scripts/check-tycoon.mjs`, record its exit status/count in the new log and retain baseline output.
- [ ] Write failing `four_views_preserve_legacy_approaches_and_form_opposite_pairs` assertions. Counter local profiles must be: `0` dimensions 2×1, patient `(0,1)`, staff `(0,-1)`; `1` dimensions 1×2, patient `(1,0)`, staff `(-1,0)`; `2` patient `(1,-1)`, staff `(1,1)`; `3` patient `(-1,1)`, staff `(1,1)`. Exam profiles must be patient/staff pairs `[(0,2),(1,2)]`, `[(2,0),(2,1)]`, `[(1,-1),(0,-1)]`, `[(-1,1),(-1,0)]`.
- [ ] Add failing tests that four forward/reverse turns preserve position and geometry, `2` uses the un-swapped rectangular footprint, wall prints reject free rotation, all new approach sides can be blocked independently, and invalid orientations cannot escape validation. Retain both existing preset route checks.
- [ ] Run `node tests/tycoon-grid.test.mjs`; confirm missing four-view behavior fails before implementation.
- [ ] Implement the named interfaces and replace truthy rotation dimension checks in grid/scene with profile dimensions. Preserve original `0`/`1` coordinates exactly. Render/access labels use orientation numbers rather than imposing inconsistent compass names on old views.
- [ ] Run grid/build tests and the full runner, recording exact passing results and any dependent art/save/UI cases still awaiting their tasks. Record the task snapshot; commit if a writable Git checkout exists, otherwise keep the snapshot/log without inventing a commit.

## Task 2: v4 saves without layout drift

**Files:** Modify `dist/tycoon/persistence.mjs`; extend `tests/tycoon-persistence.test.mjs` and persistence fixtures in `tests/tycoon-progression-ui.test.mjs` when their assertions explicitly name the current schema.

**Interfaces:** Preserve `loadClinic(storage) -> {clinic, notice, needsRecovery?, canRecoverOlder?}`, `saveClinic(storage, clinic) -> boolean`, `resetClinic(storage) -> boolean`. Replace the UI-specific legacy recovery entry point with `recoverOlderClinic(storage) -> {clinic, notice}`; it chooses the newest valid record below the failed current version after the user requests recovery. Keep v3/v2 conversion pure and separate from writes.

- [ ] Write failing tests: v4 round-trip of `0`–`3`; all original durable fields preserved; both presets with every floor object at old orientation `1` migrate without moving items or changing `serviceTiles`; old mounted-art `1` normalizes to `0` with identical appearance/layout.
- [ ] Add failing tests for v3-first migration, v2 direct migration with existing gear/XP mappings, no fresh wallet/XP/acknowledgment grants, unchanged old key bytes, newest-corrupt explicit recovery, malformed/unknown orientation rejection, blocked reads/writes, and reset clearing v4/v3/v2 while retaining prototype v1. When an existing v3 is corrupt, do not automatically fall through to v2.
- [ ] Run `node tests/tycoon-persistence.test.mjs`; confirm intended failures.
- [ ] Implement v4 validation and migration against Task 1 geometry and existing catalog styles. Task 3 adds the final art-profile completeness check once that registry exists; do not introduce a dependency on a future module here. A corrupt v4 offers explicit recovery to validated v3, or v2 if no valid v3 is available; a corrupt v3 with absent v4 similarly requires explicit recovery. Asset download failure remains a separately reported retryable artwork problem.
- [ ] Run persistence, grid, progression and full-runner checks. Confirm preserved old-key bytes and session-only warning results; log/snapshot the task with any remaining dependent failures named.

## Task 3: Four-view art and attached character composition

**Files:** Create `dist/tycoon/furniture-profiles.mjs`, `dist/assets/rotation/registration.json`, original PNG atlases under that directory and `scripts/register-furniture-art.py`; modify manifest, `assets.mjs`, `interactions.mjs`, `scene.mjs`, `persistence.mjs`, `catalog.mjs` sprite lookup, `scripts/render-station-proof.mjs`; extend asset/interaction/scene/persistence tests.

**Interfaces:**
- `furnitureProfile(item, equipmentId = 'manual_phoropter') -> {drawWidth, registration, previewLayers, rearLayers, frontLayers, seat?, operator?, instrument?, mount?}`. Every layer has a stable asset key and its own offset/registration/size; geometry comes from Task 1. Profile definitions exist for every current style and supported orientation. Use explicit, documented aliases only for symmetric components.
- Keep `examProfile(equipmentId, rotation)` as an exam-profile wrapper for existing callers. Preserve equipment layer keys `station:<equipmentId>:<rotation>:rear|front`; add stable floor-furniture keys `furnishing:<kind>:<variantId>:<rotation>:rear|front` as required. `previewLayers` composes the real empty furnishing, including all visible components.
- `furnitureComposition(world, item, {includeOccupants = true} = {}) -> Part[]` returns ordered item/staff/patient layers plus mount geometry. Retain `stationComposition(world,item)` as the exam wrapper.
- `actorPose(world, actor, role)` marks a composited actor with `attachmentId`; the scene's independent actor pass skips that actor exactly once. Support exam patients/doctors, seated waiting patients, and at-counter patients/receptionist.
- Pose metadata defines foot/seat/eye/hand anchors and source scale per actual frame. New rear-direction frames cannot alias front frames for an asymmetric body/furnishing.
- `hasCompleteFurnitureProfile(item, equipmentId = 'manual_phoropter') -> boolean` checks required known keys/pose metadata for the represented category/view. Persistence adds this check to Task 2's validation; it never loads images to validate a save.

- [ ] Add failing tests for complete profiles/assets across all current categories, styles and directions; actual distinct rear pose rectangles; attachment ownership without duplicate actors; chair/counter occlusion order; exam capture retention; mount endpoints; zero-opacity hit exclusion and thin-support alpha/segment picking.
- [ ] Run asset/interaction/scene tests; confirm missing rear views/profile/composition behavior is detected before implementation.
- [ ] Generate/rework original art in coherent category batches: waiting upholstery and chair rear/front components; counter/display/cabinet views; plants/rugs; four exam models with real back views; eight patients' four-direction seated poses; four-direction doctor work and receptionist check-in/payment poses. Inspect each original sheet and regenerate inconsistencies. Register inspected source bounds/anchors/masks without modifying image pixels through Python.
- [ ] Implement the named profiles/compositor, final persistence completeness check and relevant character frame scale/registration. Preserve connected equipment supports and exact reserved-model selection. Waiting chair backs and counter foregrounds occlude actors according to the actual view. Preview composition uses the same layers/anchors as normal rendering, without detached duplicate actors or placeholder machinery.
- [ ] Update selection registration so fully transparent layers create no hits, visible thin links remain hittable, and foreground masks track their drawn positions. Retain wall-plane print rendering and picking. Use profile geometry for depth/center calculations everywhere.
- [ ] Extend `render-station-proof.mjs` output to `/workspace/shared/little-eyes-furniture-proof/`: 128 equipment/view/appearance combinations; start/mid/end sit/stand and both work frames for every model/view; 4 upholstery variants × 4 chair directions × 8 patient appearances; reception check-in/payment in 4 views; all remaining variant directions; both presets at 390×844.
- [ ] Render and inspect the full proof matrix plus readable close-ups. Correct bad scaling, contact, back-view occlusion or mounting before accepting art. Run asset/interaction/scene tests and the full runner; record automated evidence separately from visual inspection, then snapshot the task.

## Task 4: One atomic customization candidate

**Files:** Create `dist/tycoon/customization.mjs` and `tests/tycoon-customization.test.mjs`; modify `build.mjs`, `simulation.mjs`; extend `tycoon-build.test.mjs` and `tycoon-simulation.test.mjs`.

**Interfaces:**
- `beginCustomization(world, selection) -> EditSession`, where selection is `{mode:'existing'|'purchase'|'inventory', id?, kind?, variantId?}`. Session contains an immutable `base` from `beginEdit(world)`, `mode`, complete `candidate:{id?,kind,x,y,rotation,variantId,stored}`, and derived `draft`, `result`, `cost`. New purchases/inventory begin with unset coordinates and invalid placement until a tile is chosen.
- `updateCustomization(session, patch) -> EditSession` merges only supplied candidate fields and rebuilds the full preview from the original base. It keeps invalid candidates visible and returns `draft:null` when not committable; no partial live-world mutation.
- `commitCustomization(world, session, transactionId) -> {world, result}` requires valid complete candidate/base and delegates the existing stale-world/idempotent commit protection.
- `previewEdit` adds atomic `{type:'customize', id, x, y, rotation, variantId, stored?}` for owned furniture. Purchase/place-inventory operations accept the complete candidate style and orientation, with gates checked for the final selection. Existing move/rotate/store APIs remain compatible for existing tests/callers.

- [ ] Write failing tests for combined move/rotate/style preservation; four rotations and reverse round-trip; new purchase charged once after many preview updates; invalid rotation followed by style or move retains every other field; locked/unknown styles stay invalid with no charge; Cancel/selection replacement leaves the world unchanged.
- [ ] Add failing tests for storing a pending owned style/orientation while preserving core/two-seat rules; inventory reuse/gates; stale commits and repeated confirmation; no candidate mutation across branches. No `draft:null` or invalid candidate may commit.
- [ ] Add occupied-edit regressions for both presets/starters, all four original views and sit/exam/stand phases. Rotate to each next view, assert either a specific valid rejection with original world intact or preserved capture/timers/one original payment and 10 XP after rerouting. Assert waiting-seat reservations remain unique and counter check-in/payment resumes its captured remaining service time after arrival, without restarting a full service or changing payment priority.
- [ ] Run `node tests/tycoon-customization.test.mjs` and affected build tests; observe the intended failures.
- [ ] Implement the session interfaces and atomic operation. Rebuilding from an immutable base avoids accumulating charges while candidate patches preserve all pending fields. Style-only edits do not reroute service actors; actual geometry changes retain the established safe reroute/reseat behavior. Returning to inventory stores the candidate style/orientation after one valid confirmation.
- [ ] Run customization/build/grid/simulation/progression checks and the full runner, preserving transaction and reward invariants. Log/snapshot results and any remaining UI migration failures by name.

## Task 5: Portrait customization controls and preview rendering

**Files:** Modify `dist/app.mjs`, `ui.mjs`, `progression-ui.mjs`, `scene.mjs`, `dist/styles.css`, `dist/index.html`, bundler, DOM harness and existing portrait/bootstrap/progression UI fixtures; create `tests/tycoon-customization-ui.test.mjs`.

**Interfaces:**
- `view.editSession: EditSession|null` is the single authoritative furniture candidate. `view.finishDraft` remains a separate wall/floor draft; at most one is pending. Remove duplicated mutable furniture fields in `tool/cursor/draft` or derive display adapters from the session, never maintain two independent candidates.
- Actions: retain existing inspection/catalog/inventory/confirmation actions; show **Customize** for `move-object`; keep `rotate` and add `rotate-back`; `variant` updates/starts a furniture session rather than immediately saving a live style change. Both controls and `R`/`Shift+R` dispatch the same update path.
- Scene preview input: `{candidate, valid, reason, accessTiles}` derived from the session. Valid previews render the atomic draft with appropriate attachments. Invalid previews retain the live original and draw one actor-free red candidate. Preview-only regions never enter live picking.
- `renderVariantOptions` previews the candidate orientation/style through real profile layers and keeps locked explanations visible. Recovery controls call `recoverOlderClinic` and use copy **Recover previous save** without hard-coding v2.

- [ ] Add failing standalone tests for the complete select → Customize → move → style → four rotations → Confirm flow; reverse controls/Shift+R; style/rotation before tile selection; one purchase charge and zero charge for existing furniture; invalid candidate reason/disabled Confirm without losing other fields.
- [ ] Add failing tests for Cancel, panel close, selection/tab switch and Escape restoring original item/wallet; previous manual pause retained; Build pause removed on exit; wall/floor edits cancel a furniture preview; keyboard/object-list access and wall-print rotation exclusion.
- [ ] Add failing tests for free style selection starting preview rather than mutating the save, migration/recovery UI behavior, no partial-save write before Confirm, repeated clicks, and visible orientation/price/style/access-marker status. Extend the harness only to model needed inputs such as `shiftKey`, not to recreate a browser layout engine.
- [ ] Run the new UI file against a freshly bundled standalone; confirm intended failures.
- [ ] Implement the session wiring, full furniture preview and profile-based previews. Show `1 / 4`–`4 / 4`, **Owned · Free** or the existing category price, patient/staff access markers and a specific reason for invalid access. Keep rotation usable for plants/rugs and disabled for mounted prints. Preserve fixed camera/pan/zoom and established touch-drag behavior.
- [ ] Keep Confirm/Cancel and rotate/reverse reachable while styles scroll, with 44px minimum targets and safe-area spacing. Provide accessible status updates and reduced-motion feedback. Cancel pending edits when leaving/switching selection; never implicitly confirm them.
- [ ] Add all new modules in dependency order to `package-standalone.mjs`. Run `node scripts/check-tycoon.mjs` and `node --check /tmp/little-eyes-tycoon-bundle-check.js`; require zero failures. Update superseded v3/two-view/immediate-style assertions while retaining their behavioral purpose.
- [ ] Perform real browser/portrait-device checks only through supported available infrastructure. If unavailable, record the concrete limitation and distinguish VM/native renderer evidence. Snapshot the working integrated update.

## Task 6: Final review, proofs and delivery

**Files:** Complete `docs/furniture-customization-log.md`, create `docs/furniture-customization-release-notes.md`, update README and produce standalone/source/art/proof artifacts.

**Interfaces:** Preserve the existing standalone filenames and deliver `/workspace/shared/Little-Eyes-Portrait.html` plus `/workspace/shared/Little-Eyes-Furniture.zip`, with the source, approved spec/plan, original assets and proof references.

- [ ] Run the full regression runner and standalone bundle syntax check on final product files; compare exit status and failures with the baseline. Refresh the complete production proof matrix after any rendering/profile changes, and inspect the final outputs.
- [ ] Request one fresh final reviewer through the requesting-code-review skill, supplying spec/plan, baseline snapshot, final files, proof artifacts, exact test results, Review Focus and recorded rulings. Implement material findings in one RED→GREEN fix pass and rerun the affected checks/full suite; record deferred minors and verification limits.
- [ ] Document the four-view controls, combined preview/cancellation rules, v4 migration/recovery, actual art coverage and remaining device/hosting limits. Keep the pre-update release snapshot and durable log, especially if no Git history exists.
- [ ] Package the updated self-contained HTML, source, original PNG/manifest assets and reviewable proofs. Verify ZIP CRC, standalone byte identity, required asset coverage and no external asset requests needed by the standalone.
- [ ] Use existing Sites identity/audience if source synchronization and supported publication become available. Do not create another Site, invent a commit SHA, claim an undeployed URL is live or repeat previously blocked network permission requests without changed conditions.
- [ ] Hand off artifact links, material changes and verification evidence. Keep Android packaging and camera rotation outside this deliverable.

## Plan self-review

Coverage: four-view geometry/legacy layout meaning (1–2), art/contacts/occlusion/transparent picking (3), combined atomic customization and occupied-state safety (4), portrait controls/accessibility/cancellation (5), regression/proof/review/delivery (6). Each Review Focus condition has owning tests. Public interfaces consistently use orientation IDs, immutable session candidate fields and the existing `saveClinic(storage, clinic)` order. Art validation is separate from asset-loading availability; draft composition is separate from live simulation state. No balance, camera-rotation, room-construction or Android-publication scope is introduced.
