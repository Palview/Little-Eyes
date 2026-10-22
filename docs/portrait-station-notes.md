# Portrait clinic and exam-station update — 2026-10-21

The user approved continuing the existing JavaScript/Canvas game, with portrait full-screen play, tappable objects, and equipment-specific patient/doctor interactions. This was implemented directly as a bounded update to existing flows. No engine migration or Android app build is included.

## Changes

- Full viewport portrait canvas, safe-area-aware HUD, persistent thumb-reachable bottom dock and collapsible control sheets. Existing Practice, Build, Equipment and patient tools are accessible in the new shell.
- Visible furnishings, people and staff can be tapped. Sprite alpha masks let taps pass through transparent margins. The Practice object list remains a keyboard alternative. Inspections show service state, exam progress, upgrade information and move controls.
- Six equipment profiles (three tiers, two rotations) define patient orientation, seated position, doctor operating position and front-instrument alignment. New generated station art separates rear chair structure from foreground armrests and optical equipment.
- Patient sequence now includes a half-second sitting transition, the full exam, and a half-second standing transition. The chair stays reserved through standing. Character sizing uses pose height rather than a fixed sprite width, correcting the mismatch between standing and wider seated drawings.
- Equipment tier is captured for each reserved exam. An upgrade queues the visual kit for the next patient; the current patient keeps their appearance, duration and payout. Moving/rotating occupied stations preserves the current phase and timing while actors walk to the new approach positions.
- Routine layout changes and saves retain the existing tycoon save key. Storage warnings remain visible in the full-screen shell. Start a new practice is available inside the Practice panel, with confirmation.

## Evidence

`node scripts/check-tycoon.mjs` passes 44 automated checks, including preserved prototype checks, simulation/build rules, pose and equipment consistency, transparent hit testing, standalone bootstrap, panels and reachable reset/preset switching. The independent reviewer exercised 48 combinations of presets, tiers, rotations and exam phases with moved/rotated occupied stations; payouts remained exactly once at the captured rate.

`node scripts/render-station-proof.mjs` renders the production canvas through the preinstalled native Canvas implementation. All six tier/rotation compositions were inspected; the resulting contact sheet is in `/workspace/shared/Little-Eyes-Station-Check.png`. This checks real production drawing geometry and asset composition, but does not replace browser DOM/layout or physical phone testing. Native render script needs `@napi-rs/canvas` in its development environment.

The only Important review finding was the hidden reset control after removing the old footer from the portrait shell. A failing regression reproduced it; the control was added to Practice, and reset/preset switching now passes. No Important/Critical findings remain from that review.

## Delivery limits

The standalone `Little-Eyes-Portrait.html` embeds all code and art; open it in a JavaScript-enabled browser. Attachment previews may block execution. Browser startup remains blocked in this environment, and Sites helper scripts are absent, so live browser/mobile input QA and private hosting remain unavailable. The existing Site identity is preserved; this is not an APK or Play Store release.

The previous proof-of-concept HTML and source were preserved in `snapshots/tycoon-proof-v2/`. No credentials, external account setup or new hosting project were introduced.
