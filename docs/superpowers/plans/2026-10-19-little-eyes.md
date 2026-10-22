# Little Eyes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a cozy playable optometry clinic with two minigames, frame fitting, upgrades, and local saves.

**Architecture:** Buildless browser app with pure game rules, a separate storage adapter, and DOM rendering/event handling. Inline SVG and CSS provide original clinic illustrations. Publish a private Site through the native Sites workflow.

**Tech Stack:** HTML, CSS, JavaScript ES modules, Node's built-in test runner.

**Spec:** `/workspace/docs/superpowers/specs/2026-10-19-little-eyes-design.md`

## Global Constraints

- One clinic, two exam minigames, three frame options, three upgrades, and local progression.
- Start with 100 coins; completed visits earn 40 coins, with 10 extra for matching frames.
- Plant costs 60, waiting chair costs 100, equipment costs 150; equipment adds 10 coins per future visit.
- No harsh timers, patient penalties, backend, external accounts, or runtime dependencies.
- Save only coins, completed visits, and upgrades using a validated, versioned localStorage format.
- Keyboard/touch controls, readable contrast, reduced motion, and responsive layout.

## Review Focus

- Rapid repeat clicks must not duplicate rewards or purchases: cover with game-state transition tests.
- Reload during a visit must retain progression and restart the patient: cover in storage tests.
- Malformed or unavailable storage must allow continued play: cover in storage tests.
- Opening a modal must not send arrow keys into a hidden minigame: verify UI keyboard handling.
- Small screens and reduced motion must preserve reachable controls: verify layout and media rules.

---

## File structure

Project root: `/workspace/sites/little-eyes`.

- `dist/index.html`: accessible clinic shell, dialogs, game regions, branding.
- `dist/styles.css`: clinic scenery, responsive layout, typography, motion preferences.
- `dist/game.mjs`: pure progression and visit rules.
- `dist/storage.mjs`: validated local persistence.
- `dist/app.mjs`: patient generation, SVG presentation, event handlers, rendering.
- `tests/game.test.mjs`, `tests/storage.test.mjs`: meaningful rule and persistence checks.
- `.openai/hosting.json`: Site identity and static hosting manifest.

### Task 1: Game rules and progression

**Interfaces:** `createGame(progression?) -> Game`, `startVisit(game, patient, directions, focusTarget) -> Game`, `answerChart(game, direction) -> Game`, `setFocus(game, value) -> Game`, `confirmFocus(game) -> Game`, `finishVisit(game, frame) -> Game`, `buyUpgrade(game, id) -> Game`. Patient has `name` and `preference`; Game holds progression, visit, and feedback. Export `UPGRADES` and `FRAMES` for UI labels and prices. Direction values are `up/right/down/left`; frame IDs are `round/square/cat-eye`. Stages are `idle/chart/focus/frames/complete`.

- [ ] Write `tests/game.test.mjs` covering initial 100 coins, three correct chart answers, retry without advancement, focus tolerance of 8 on a 0–100 slider, and required stage order. Assert a matching visit yields 50 coins, a nonmatching visit yields 40, and equipment adds 10.
- [ ] Run `node --test tests/game.test.mjs`; confirm missing-module failure before implementation.
- [ ] Implement the exported rules in `dist/game.mjs`; prevent invalid stages, repeated completion rewards, unknown upgrade IDs, duplicate purchases, and spending below zero. Focus targets stay between 20 and 80.
- [ ] Extend tests for repeated reward clicks, all four chart directions, insufficient funds, duplicate purchases, and equipment effects. Run `node --test tests/game.test.mjs`; require all passing.
- [ ] Commit rule implementation and tests once the Site source repository is initialized by the supported workflow.

### Task 2: Durable local progression

**Interfaces:** `loadProgress(storage) -> {progress, sessionOnly}`, `saveProgress(storage, game) -> boolean`, `clearProgress(storage) -> boolean`. Use key `little-eyes-save-v1`, JSON version 1, and progression fields `coins`, `completedVisits`, `upgrades`. Consume Task 1's progression shape.

- [ ] Write `tests/storage.test.mjs` with a fake storage object. Assert missing/invalid JSON, incorrect version, negative or nonfinite coins, invalid visit counts, and unknown upgrades fall back safely. Assert valid saves round-trip without active visit data; throwing storage reports session-only behavior.
- [ ] Run `node --test tests/storage.test.mjs`; confirm missing-module failure.
- [ ] Implement `dist/storage.mjs` with validation, bounded known upgrade IDs, caught storage exceptions, and durable fields only.
- [ ] Run `node --test tests/*.test.mjs`; require all passing, including reload during an unfinished visit.
- [ ] Commit persistence implementation and tests.

### Task 3: Complete playable clinic

**Interfaces:** `dist/app.mjs` imports Task 1 and Task 2 exports, owns the current Game, renders it into `index.html`, and persists after progression changes. No other module owns DOM state.

- [ ] Create `dist/index.html` and `dist/styles.css`: warm pastel clinic, waiting area, exam chair, frame display, coin/visit counters, next-action panel, upgrades dialog, and reset confirmation. Add inline SVG characters and visible purchased decor.
- [ ] Implement `dist/app.mjs`: generate friendly patients with visible preferences; start visits; render the three-round E chart; wire direction buttons and arrows; render focus illustration and labeled slider with proximity text; render frame options; show exact visit rewards and invite the next patient.
- [ ] Connect upgrades, immediate persistence, owned/unaffordable purchase explanations, session-only storage notice, and confirmed reset. Make dialogs keyboard accessible with focus restoration. Ignore gameplay shortcuts while dialogs are open or text/range controls handle keys.
- [ ] Verify desktop/mobile CSS, readable labels, focus states, SVG accessible names, and `prefers-reduced-motion`. If supported, browser-check a full visit, incorrect answers, focus retry, upgrades, refresh, and reset; otherwise record the browser QA limitation and inspect handlers/layout rules directly.
- [ ] Run `node --check dist/app.mjs`, `node --check dist/game.mjs`, `node --check dist/storage.mjs`, and `node --test tests/*.test.mjs`; require success.
- [ ] Commit complete clinic UI and interactions.

### Task 4: Publish and hand off

**Interfaces:** Native Sites registration returns project ID/source credential. Sites helper returns verified project ID, commit SHA, and archive for deployment.

- [ ] Discover native Sites tools and installed helper root; prepare static project and register exactly one private Site. Persist returned identity with `set-project-id.mjs` before manifest updates or source sync.
- [ ] Set `.openai/hosting.json` static directory to `dist`; preserve registered project ID. Package through `site-workflow.mjs`, passing credential only over stdin and remaining successful check commands as needed.
- [ ] Deploy the verified archive using owner-private native deployment tooling. Poll only nonterminal deployments until success or a concrete blocker.
- [ ] Hand off the deployed URL, controls, local-save behavior, and any verification limit. Open the Site in the supported user-facing tab if available.

## Execution notes

Registration can happen at the start of execution once the project directory is prepared, before gameplay work. Do not initialize Git at `/workspace`; use the supported Site source workflow in the project root. Track the approved spec and this plan with the Site source when its repository is available.
