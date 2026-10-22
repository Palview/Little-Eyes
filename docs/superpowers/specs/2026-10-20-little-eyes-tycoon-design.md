# Little Eyes — customizable practice tycoon

## Agreed direction

Little Eyes is a cozy isometric optometry tycoon. The player starts with one of two ready-made clinics, watches patients move through reception, waiting, examination, and payment, and reinvests earnings in equipment and customization. Patients wait patiently; there are no abandonment penalties. Examinations run automatically. Minigames are deferred.

The user approved two presets, changeable wall and floor finishes, patient/staff sprites, timed basic examinations, equipment that improves throughput and potentially earnings, and a relaxed waiting model. This spec replaces the first prototype's manually controlled patient visits. Its numerical balance and asset counts below are proposed starting values for playtesting, rather than user-specified values.

## First playable outcome

Success means selecting a clinic, watching a complete patient visit without manual intervention, receiving payment exactly once, buying faster equipment, and changing the clinic's appearance and furnishings. Patients must visibly walk along valid routes instead of teleporting between stations. The clinic occupies most of the screen; counters, equipment status, and build tools support that view.

## Clinic presets

Both presets have the same starting resources, equipment, and service capacity.

- **Corner Practice:** a compact 12 × 10 tile rectangular room, with reception near the entrance, a waiting nook, an exam station toward the back, and a glasses display along a side wall.
- **Sunny Storefront:** a longer 15 × 8 tile room, with front reception, a window-side waiting area, and an exam station at the far end.

Both use a fixed isometric camera angle with cutaway front walls. The player chooses a preset before starting. Afterward, changing preset is part of confirmed new-game reset; it never silently destroys an existing practice. Structural walls and entrance positions stay fixed in this version.

## Patient simulation

One receptionist and one doctor are included and do not require hiring or wages in this version. Characters have readable roles and distinct appearances. The player can inspect patients or a station for status without needing to direct every visit.

Patient state sequence:

1. Arrive at the entrance and walk to the reception queue.
2. Check in at the counter for 3 seconds; only one patient checks in at a time.
3. Walk to an assigned free waiting seat, or wait at a designated standing queue tile when seats are occupied.
4. When the doctor is available, walk to the exam chair in check-in order and begin the timed examination.
5. When the exam ends, return to the counter for a 2-second payment interaction, then walk to the exit and leave.

Counter service gives payment priority over new check-ins to prevent completed visits from becoming stuck. Reserve seats and stations before routing a patient to them. Use grid navigation with item footprints as obstacles and designated approach tiles for reception, seating, the exam chair, and the entrance. Service routes must remain valid after every accepted furniture edit. Characters may pass through one another on walking tiles; physical crowd collision is outside this version's scope.

The first patient arrives immediately, then one arrives every 18 seconds while the clinic is open. Limit the scene to 8 active patients; defer new arrivals at that limit without removing waiting patients or imposing a penalty. There is one active examination at a time. Play remains gentle: no illness severity, time limits, failed exams, or unhappy departures.

## Economy and equipment

Start with 100 coins, reception, two waiting seats, a basic exam station, and a glasses display already installed. Decorations do not change payouts. Waiting seats improve the visible waiting area, while exam equipment is the principal throughput upgrade.

| Exam equipment | Purchase price | Exam duration | Coins paid per completed visit |
| --- | ---: | ---: | ---: |
| Basic kit | Included | 30 seconds | 40 |
| Improved kit | 200 coins | 18 seconds | 50 |
| Advanced kit | 500 coins after Improved | 10 seconds | 65 |

Equipment replaces the current kit rather than adding another doctor or examination lane. An upgrade changes future exams; an exam already underway keeps its original duration and payment amount. Reception payment grants coins and increments patients helped exactly once. Show each upgrade's full price, new exam time, and new payout before purchase. Disable unaffordable and already owned upgrades. Coins cannot go negative.

Show coins, patients helped, current exam progress, and an equipment/build action. Offer pause/resume. Pause freezes simulation time, including arrivals, walking, and service. Opening the build tools also pauses the simulation until the player returns to play. No offline earnings in this version; backgrounding the page pauses it, and returning does not fast-forward patients.

## Customization and build mode

Provide clear **Play** and **Customize** modes. On mobile, use tap-to-select and tap-to-place; dragging may supplement but must not be the only placement control. Provide rotate, move, confirm, and cancel actions with text labels. A translucent footprint and green/red validity indicator preview placement. Invalid placements explain why they fail.

The initial catalog contains:

- Existing reception counter, exam station, and glasses display: repositionable but cannot be deleted.
- Waiting seat: 40 coins each, up to 6 total including the 2 supplied.
- Potted plant: 30 coins each.
- Rug: 40 coins each; does not block walking.
- Small storage cabinet: 60 coins each; blocks walking.
- Wall art: 25 coins each; snaps to fixed wall positions and does not block walking.

Limit purchased plants, rugs, cabinets, and wall art to 4 of each for this first version. Purchased decorations can be moved, rotated where meaningful, or returned to inventory at no cost; returning an item never grants coins. Inventory items can be placed again without repurchasing them. Waiting seats can be returned only down to the 2 supplied seats. Returning furniture happens in paused build mode; on resume, patients release invalidated seat reservations and recompute routes from their current tiles. Reject any placement over a current patient tile. Moving equipment does not cancel an active exam; its reserved patient and doctor remain associated with it. On returning to Play, they walk to the new service tiles, then the exam countdown resumes with its remaining duration and original payment amount.

Four wall finishes: warm cream, sage paint, peach paint, and subtle wallpaper. Four floor finishes: pale wood, honey wood, cream tile, and checker tile. Finishes are free so experimentation is encouraged. Show the whole selected room with the chosen finish; changing it preserves patients, furniture, equipment, and money. Visual furniture rotations must match supported sprite orientations and collision footprints. Wall art and round plants do not need meaningless orientation variants.

Build validation protects entrances, counter approaches, exam approaches, seat approaches, and required paths. Disallow out-of-bounds placements, overlapping blocking furniture, blocked entrances, and inaccessible service stations. Cancel returns to the pre-edit arrangement without spending coins. Confirm deducts any purchase once and applies the arrangement atomically.

## Art direction and asset pipeline

Use original soft retro pixel art inspired by the reference images: diamond floor tiles, crisp silhouettes, warm cream/sage/peach colors, readable optometry equipment, and expressive neighbors. Keep consistent isometric projection, pixel scale, lighting, ground contact points, and shadow direction across the asset set.

Generate a small coherent art set for the first version rather than an entire decorative library. Each furnishing is an individual transparent sprite, or a precisely addressable sprite-sheet region, with a recorded ground anchor, grid footprint, and supported orientations. Required furnishings are reception, waiting chair, exam station with three equipment tiers, glasses display, plant, rug, cabinet, and wall art. Floor textures must tile cleanly. Wall finishes must share the room geometry.

Include doctor and receptionist sprites plus at least 4 patient appearances. Character sheets include idle and walking in four diagonal map directions, and seated/exam poses where used. Walking frames must preserve identity and scale. Sprite sheets require review for consistent frame alignment and clean transparency before integration; if generation cannot produce consistent animations, use a smaller coherent sprite set with simple frame animation rather than mismatched character frames.

Draw scene elements in depth order so patients pass correctly behind foreground furniture. Art generation supplies the visuals; grid footprints, interaction points, navigation, and animation timing remain explicit game data. The room must remain functional while an asset is loading; missing assets get a visible placeholder and retry without breaking simulation.

## Architecture, state, and persistence

Keep this browser game in the existing Little Eyes project and retain the existing private Site identity `appgprj_6ad682ebf8c08191a90cd796f2c1ab23`. Preserve the previous prototype as a separate version before replacing its entry point.

Separate catalog/preset data, simulation transitions, grid navigation and placement validation, scene rendering and sprites, UI/build controls, and storage. Use a canvas scene with accessible HTML controls and a textual patient/station status panel. Scale the canvas for device pixel ratio while preserving crisp sprites; viewport panning and zoom must not interfere with menu controls or page navigation. Offer labeled zoom buttons in addition to gestures.

Save versioned durable progression locally after completed payment or a confirmed purchase/layout/finish change: selected preset, coins, patients helped, equipment tier, wall and floor selections, owned inventory, and placed-item positions/orientations. Validate all saved data including footprints and reachability before use. The old prototype's save key remains separate; first launch of this new version starts a new clinic rather than silently converting unrelated progression.

Reload restores the clinic and begins a fresh arrival queue; unfinished visits do not grant earnings and are not resumed. State this plainly in the help text. Blocked storage allows session play with a visible notice. Invalid saves fall back safely to preset selection with an explanation. A confirmed reset clears only this version's save.

## Mobile and accessibility

Support narrow portrait screens with the clinic viewport above a compact bottom control tray. Keep touch targets at least 44 CSS pixels, preserve readable text contrast, and provide labels beyond color for placement validity and patient status. Zoom and pan let players inspect a larger clinic without shrinking controls. Keyboard users can select catalog items, move a placement cursor with arrows, rotate, confirm, cancel, and control zoom. Dialogs manage focus and restore it when closed. Respect reduced motion for optional flourishes; essential patient movement remains understandable through the textual status panel.

## Verification and delivery

Verify the entire arrival → check-in → waiting → exam → payment → exit sequence, queue order, seat reservation, counter prioritization, active-patient cap, pause/background behavior, and exactly-once payment. Use deterministic simulation tests to check upgrade prices, durations, payouts, in-progress exam preservation, affordability, and repeat-click safety.

Test both preset layouts and placement restrictions, route recomputation, inventory returns/reuse, canceled edits, furniture movement during paused visits, wall/floor changes preserving progression, valid saves, invalid saves, and blocked storage. Inspect generated assets for clean individual sprites and valid animation frames. Browser QA must exercise real touch-sized controls, pan/zoom, depth sorting, at least one full patient cycle, a purchase, customization, and reload on a mobile viewport.

Use the existing private Sites publication workflow when available. The previous environment blocked publishing and browser preview; recheck readiness before relying on either. Provide source and a runnable build if infrastructure remains unavailable, and report deployment/browser-verification limits accurately. Do not represent a registered but unpublished Site as playable.

## Deferred

Minigames, editable structural walls, additional doctors and staffing costs, multiple exam rooms, unhappy departures, illnesses, frame-sales inventory, cloud saves, and offline earnings are future features. This version proves the automatic clinic loop, equipment progression, and meaningful visual customization first.
