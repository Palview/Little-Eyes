# Little Eyes Tycoon Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a customizable isometric practice with two presets, animated patients, automatic timed examinations, and equipment progression.

**Architecture:** Buildless ES modules separate pure simulation and grid rules from canvas rendering, HTML controls, and storage. A generated sprite atlas/character-sheet set supplies original art through a validated asset manifest. Retain the existing Site and archive the previous playable prototype before changing its entry point.

**Tech Stack:** HTML, CSS, JavaScript ES modules, Canvas 2D, localStorage, Node built-in tests, image-generation tool; browser QA through supported environment tooling.

**Spec:** `/workspace/docs/superpowers/specs/2026-10-20-little-eyes-tycoon-design.md`

## Global Constraints

- Project root: `/workspace/sites/little-eyes`; Site ID `appgprj_6ad682ebf8c08191a90cd796f2c1ab23` must be preserved.
- Corner Practice: 12 × 10; Sunny Storefront: 15 × 8. Fixed walls, movable furnishings, four wall finishes and four floor finishes.
- Start with 100 coins, counter, two seats, basic examination equipment, and glasses display.
- First arrival immediately, then every 18 seconds; maximum 8 active patients. Check-in 3 seconds, payment 2 seconds; payment priority at counter.
- Basic exam 30 seconds/40 coins; Improved costs 200, exam 18 seconds/50 coins; Advanced costs 500 after Improved, exam 10 seconds/65 coins.
- No abandonment, minigames, wages, extra doctors, or offline earnings.
- Waiting chairs 40 (6 total); plants 30, rugs 40, cabinets 60, wall art 25 (4 owned each).
- Four patient appearances plus doctor and receptionist; consistent pixel art, transparent sprites, valid anchors and depth order.
- Touch targets at least 44 CSS pixels; labeled pan/zoom/build controls and keyboard equivalents.

## Review Focus

- Returning from a hidden tab must not create catch-up income or a burst of arrivals: clock/browser checks in Tasks 2 and 4.
- Editing an occupied station must preserve its patient, remaining exam, and agreed payout: integration test in Task 2.
- Double taps on confirm/payment/upgrade must not duplicate income, spending, or inventory: transaction tests in Task 2.
- Corrupt layouts and old prototype saves must not strand patients or overwrite the old save: validation tests in Task 3.
- Sprite failure and narrow screens must leave statuses and controls usable: loader/browser checks in Task 4.

---

## File Map

All paths below are relative to the project root.

- `legacy-v1/`: preserved old `dist/` plus standalone HTML; existing tests remain available.
- `dist/tycoon/catalog.mjs`: footprints, anchors, prices, equipment tiers, finishes, and presets.
- `dist/tycoon/grid.mjs`: rotation, occupancy, breadth-first routes, and service reachability.
- `dist/tycoon/simulation.mjs`: deterministic patient/counter/doctor state machine and rewards.
- `dist/tycoon/build.mjs`: placement drafts, purchases, inventory, layout commits, route reconciliation.
- `dist/tycoon/persistence.mjs`: durable snapshot validation and new save key.
- `dist/tycoon/clock.mjs`: visibility/manual/build pause policy and fixed simulation steps.
- `dist/tycoon/assets.mjs`, `dist/assets/manifest.json`, `dist/assets/*.png`: validated sprite lookup/loading and generated art.
- `dist/tycoon/scene.mjs`: isometric projection, camera, canvas hit testing and rendering.
- `dist/tycoon/ui.mjs`: accessible HTML controls, customization, status list, help, and reset.
- `dist/index.html`, `dist/styles.css`, `dist/app.mjs`: new shell, responsive styles, application composition.
- `tests/tycoon-*.test.mjs`: deterministic domain/asset tests; browser test script if supported.
- `scripts/check-tycoon.mjs`: runs each test file and syntax checks with clear exit status.
- `scripts/package-standalone.mjs`: runnable offline bundle if hosted publication remains blocked.

## Shared Types

`Tile={x:int,y:int}`; `Item={id:string,kind:string,x:int,y:int,rotation:0|1}`. Unplaced owned items use `x:null,y:null`; core items are always placed. `Clinic={presetId,coins,completedVisits,equipmentTier,wallId,floorId,items:Item[]}`.

`Patient={id,appearance,stage,tile,path:Tile[],progress,checkedInOrder,seatId,examDuration,examRemaining,payout,paid}`. Optional station/exam fields are null until assigned. Stages: `toReception,checkIn,waiting,toExam,exam,toPayment,payment,exiting`. `World={clinic,patients,doctor,receptionist,counter,exam,elapsed,arrivalRemaining,nextPatientId,nextQueueOrder}`. `Result={ok:boolean,reason?:string}`. Pass seeded random functions to constructors for reproducible appearances.

### Task 1: Presets, navigation, and placement geometry

**Files:** Create catalog/grid modules and `tests/tycoon-grid.test.mjs`; preserve `legacy-v1/` first.

**Interfaces:** Export `PRESETS`, `CATALOG`, `EQUIPMENT`, `WALLS`, `FLOORS`; `createClinic(presetId) -> Clinic`; `footprint(item) -> Tile[]`; `serviceTiles(item) -> {patient:Tile,staff?:Tile}`; `findPath(clinic,from,to) -> Tile[]|null`; `validateLayout(clinic) -> Result`. Paths exclude start and include destination; same tile returns `[]`. Rotation transforms both footprint and approach tiles. All routing derives from catalog data, not special cases in the renderer.

- [ ] Copy the old playable files into `legacy-v1/` without altering existing save keys. Verify copied bytes match before replacing any entry point. Read current Site identity and check installed workflow/browser tools without starting a blocked permission request repeatedly.
- [ ] Write failing geometry tests: both presets are valid and have 100 coins and two seats; every station approach is entrance-reachable; rotation updates dimensions and approaches; overlaps, out-of-bounds, blocked entrances and isolated service tiles fail; rugs remain walkable. Run `node tests/tycoon-grid.test.mjs`; expect missing-module failure.
- [ ] Implement catalog and BFS navigation. Initial Corner layout: entrance `(5,9)`, counter `(2,7)`, seats `(1,4)/(3,4)`, exam `(7,2)`, display `(10,4)`. Storefront: entrance `(1,7)`, counter `(2,5)`, seats `(6,5)/(8,5)`, exam `(11,1)`, display `(13,4)`. Counter footprint 2×1, chair 1×1, exam 2×2, display 1×2; provide explicit adjacent patient/staff approaches. Establish six reachable standing queue targets per preset, excluding furniture and station approaches. Plant/cabinet footprints 1×1; rug 2×2 nonblocking; art occupies a named wall slot rather than a floor obstacle.
- [ ] Run the grid tests; require all passing. Commit when an isolated source repository is available; otherwise record the environmental limitation in this plan's ledger without initializing Git at `/workspace`.

### Task 2: Automatic clinic loop and atomic customization

**Files:** Create simulation/build/clock modules and `tests/tycoon-simulation.test.mjs`, `tests/tycoon-build.test.mjs`, `tests/tycoon-clock.test.mjs`.

**Interfaces:** Consume Task 1. Export `createWorld(clinic,rng) -> World`; `advance(world,seconds,rng) -> {world,events}` (events include `payment` with patient ID and amount); `upgradeEquipment(world,tier) -> World`; `beginEdit(world) -> Draft`; `previewEdit(draft,operation) -> {draft,result}`; `commitEdit(world,draft,transactionId) -> {world,result}`; `cancelEdit(world,draft) -> World`. Draft contains original clinic, proposed clinic, cost, and changed item IDs. Operations: purchase, move, rotate, store, placeInventory, wall, floor. Export `createClock()`, `setPauseReason(clock,reason,active)`, `consumeFrame(clock,timestampMs) -> seconds[]`; use fixed 0.05-second steps, cap visible-frame advancement at 0.25 seconds, discard hidden-tab time.

- [ ] Write RED simulation tests: a seeded patient traverses all stages and pays 40 once; FIFO exams, exclusive seat reservations, counter payment priority, active cap 8, patient waiting without penalties, and exact equipment values. An upgrade during an exam preserves that exam's duration/payout. Run tests to confirm expected missing-module failures.
- [ ] Implement path-based walking at 2 tiles/second with interpolation for rendering; services count down only on arrival. Reserve counter/seat/exam resources atomically. Release seats on departure for exam; one doctor serves one patient. Route completed patients to payment and then exit; emit payment only once. Deferred arrivals resume at normal cadence after capacity frees.
- [ ] Write RED build/clock tests for no-cost finish changes, affordability, catalog limits, core-item protection, returning/reusing owned furniture without payment, six-seat maximum/two-seat minimum, blocked patients/routes, cancellation, repeated transaction IDs, manual/build/visibility pause combinations, and no hidden-tab catch-up.
- [ ] Implement edit transactions with a temporary clinic snapshot. Validate all affected routes and current occupied tiles before committing; charge once. Reassign invalidated seats and routes on resume; moved occupied equipment retains reservation, remaining exam time, and original payout while patient/doctor relocate. Reject repeated transaction IDs against a consumed-ID set in runtime state.
- [ ] Add the occupied-exam move regression test: pause midway, move validly, resume and walk to the new service tile, then finish only the remaining duration and pay the original amount once. Run all Task 1/2 tests through a runner that executes each file directly; require all passing. Record evidence and commit.

### Task 3: Validated progression and original sprite assets

**Files:** Create persistence/assets modules, generated assets and manifest, `tests/tycoon-persistence.test.mjs`, `tests/tycoon-assets.test.mjs`.

**Interfaces:** `loadClinic(storage) -> {clinic:Clinic|null,notice:string|null}`; `saveClinic(storage,clinic) -> boolean`; `resetClinic(storage) -> boolean`. Save key `little-eyes-tycoon-v2`, schema version 2. `loadAssets(manifest,onStatus) -> Promise<AssetSet>`; `spriteFor(assetSet,key,orientation,frame) -> {image,sourceRect,anchor}|null`. Asset entries define file, pixel dimensions, source rectangle, ground anchor, footprint and orientation. Null sprites trigger visible render placeholders; failed files offer retry.

- [ ] Write RED persistence tests for round-trip clinic/inventory/finishes/equipment; excluding patients and earnings-in-progress; separate old key; invalid JSON/schema/nonfinite or negative coins/duplicate IDs/unknown kinds/illegal rotations/catalog overflow/unreachable layouts; blocked storage; reset only the new key. Run and confirm failures.
- [ ] Implement persistence using layout validation and catalog limits. An invalid save returns preset selection plus explanation; unavailable storage returns a session-only notice. Run persistence tests to GREEN.
- [ ] Generate transparent pixel-art furniture atlas and character sheets with image generation. Furniture includes supported rotations for core items, chair, cabinet and rug, all three equipment tiers, plant and wall art. Generate doctor/receptionist/four patient appearances with four directional idle/walk sequences plus seated poses. Use consistent reference assets for subsequent sheets. Inspect outputs before integration; retain only usable frames and record exact crop regions/anchors in the manifest. Generate or derive seamlessly repeating finish tiles through the image tool; do not substitute an ungenerated illustration for the approved art direction.
- [ ] Write RED asset tests for existing files, crop bounds, anchors, required catalog/tier/orientation keys, six character appearances, four directional motion/idle sequences, and seated poses. Implement manifest validation/loading with retry and missing-asset reporting; test rejected loads produce usable missing-sprite states rather than aborting the app. Run persistence/asset tests and the prior suite; require GREEN. Commit assets and source.

### Task 4: Isometric scene, mobile controls, and complete integration

**Files:** Create scene/UI modules, replace root shell/styles/app entry, add relevant scene/clock integration tests, and create `scripts/check-tycoon.mjs`.

**Interfaces:** `createScene(canvas,assetSet) -> {render(world,view),hitTest(clientX,clientY),setCamera(camera),resize(),destroy()}`; `createUI(root,handlers) -> {render(world,uiState),destroy()}`. `uiState` contains mode, selected patient/item, draft, placement validity, pause status and notices. `dist/app.mjs` alone owns current World/Draft/clock and composes transitions; rendering never grants money.

- [ ] Write RED scene-math tests for projection/unprojection at multiple zoom/pan scales and device pixel ratios; draw ordering with rugs below objects and foreground patients/items sorted by ground position. Implement pure exported math helpers and verify GREEN before canvas integration.
- [ ] Implement clinic rendering with pixel-preserving canvas scaling, tiled finishes, cutaway walls, anchored furniture, character walking/seated animations and status indicators. Render both presets from their shared data. Include visible missing-art placeholders and an asset retry action that preserves world state.
- [ ] Implement preset selection; Play/Customize; tap placement and keyboard cursor; move/rotate/confirm/cancel/inventory; four wall/floor choices; equipment upgrades with exact comparison values; selectable patient/station status; zoom buttons/pan; pause/resume; help and confirmed new-game reset. Put patient/station statuses in accessible HTML alongside canvas. Preserve focus through dialogs; keep controls at least 44 CSS pixels and respect reduced motion for flourishes.
- [ ] Wire clock visibility/build/manual pause, queued edits, equipment upgrades, payments and saves. Reload starts a fresh arrival queue. Detect storage failures on later writes as well as initial load. Run `node scripts/check-tycoon.mjs`; expected all new tests and all module syntax checks pass. Keep legacy tests separate from new entry-point assertions.
- [ ] Using supported browser tooling if available, exercise both presets at a mobile viewport: full visit, zoom/pan/hit testing, patient statuses, equipment purchase, valid/invalid placements, cancel, return/reuse inventory, occupied-equipment move, finish changes, reload and confirmed reset. Check pause on backgrounding, no menu gesture leakage, sprite depth ordering, contrast and focus. If infrastructure prevents QA, record precisely what remains unverified without repeated blocked approval requests. Commit the completed game.

### Task 5: Review, runnable packaging, and private publication

**Files:** Update README and ledger; create standalone packager and distribution archive; preserve `.openai/hosting.json`.

**Interfaces:** Standalone output embeds source, styles and generated assets for browser execution without module/file fetches. Hosting helper output provides verified project ID, pushed commit and archive for the native save/deploy call.

- [ ] Run one fresh whole-project review against this plan, approved spec, changed source and recorded decisions. Address Important/Critical findings with reproducing RED tests, fixes, and a green complete suite; record minor findings and limitations.
- [ ] Build a self-contained edition with embedded sprite data and tested inline script syntax. Verify manifest assets are embedded and that external source-module requests are absent. Include source, help, and old prototype in a project ZIP. State local-file save limitations plainly.
- [ ] Recheck managed environment and Sites helper availability once. Refresh existing Site ownership/audience and source credentials; preserve owner-private access. Use supported source helper to push/package/deploy if available; credentials remain in memory and go through hidden stdin only. Do not invent a source commit or retry Site creation. When blockers remain, deliver the runnable local build and describe the blocker.
- [ ] Run final checks on unchanged packaged inputs. For publication, poll only a nonterminal deployment to success/failure; report a URL as live only after native success. Give the user playable artifact/link, basic mobile controls, and material verification limits. Keep unrelated workspace files and previous saves intact.

## Execution method

Preserve the previously approved native method: implement in this session with one fresh final reviewer. No per-task implementer/reviewer agents. Native Sites publication remains authorized by the requested delivery and approved spec; do not introduce another conversational publishing gate.
