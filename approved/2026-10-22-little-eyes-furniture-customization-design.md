# Little Eyes — furniture rotation and customization

## Agreed direction

The user chose furniture rotation first, for customization. Keep the portrait clinic camera fixed and make arranging the practice feel deliberate, tactile and visually consistent. This is the next focused production milestone toward the finished Android game.

The proposed implementation extends the current browser engine. It coordinates four-view art, furniture placement, patient/staff interaction geometry and saved layouts. It does not rotate the room camera or change the economy.

## Current limitations

- Furniture and equipment have two stored orientations, `0` and `1`. Several geometry consumers treat rotation as a Boolean; this cannot represent four views correctly.
- Existing approach coordinates switch by exchanging x/y. Rendering and navigation need explicit profiles for each supported view.
- Some seated character directions reuse front-facing frames. Proper rear-facing furniture needs appropriate rear seated poses and chair occlusion.
- Moving an item, choosing a style and rotating it do not yet form one consistent preview transaction.
- Saved v3 layouts validate only two orientations. Older valid layouts must remain usable when four orientations are introduced.

## Approach

Use an original four-view 2D sprite kit with explicit geometry and interaction anchors for each view. This builds on the current artwork, renderer and placement tools and keeps the game offline-capable.

A second viable approach is to build 3D source models and render the four 2D views from them. That offers stronger geometric consistency across future angles but adds a modeling/rendering toolchain and an art-production conversion. The proposed first release continues with authored 2D views, inspected and registered individually; shared anchors and source-frame standards provide consistency.

The art direction stays warm isometric pixel art with the existing cream, sage, peach and wood palette. Generate or redraw the actual missing views, then clean/register them as game assets. An asymmetric front view must not stand in for a back view. A genuinely symmetric component can share artwork where its material, silhouette and interaction are identical.

## Player flow

1. Tap a furnishing to inspect it, then choose **Customize**.
2. The practice pauses for editing. Highlight the selected item and show its floor footprint and required access tiles.
3. Tap **Rotate** to cycle through four orientations. The preview shows the actual selected view and a clear `1 / 4` through `4 / 4` indicator. A reverse-rotation control is available; keyboard `R` rotates forward and `Shift+R` rotates backward.
4. Tap a tile to move the preview or choose an unlocked style. Position, rotation and style remain part of the same pending edit.
5. **Confirm** applies the complete valid edit once; **Cancel** restores the exact original object and wallet.

New furniture uses the same flow: choose the category/style, move and rotate its preview, then confirm one purchase at the existing category price. Existing furniture changes remain free. Inventory placement retains the owned style and orientation and enforces the existing XP gate.

An invalid candidate stays visibly red in its attempted position/orientation, with a specific reason and Confirm disabled. The original live item remains unchanged until a valid confirmation. Rotating or changing style does not silently revert a pending move, purchase or other style choice.

Switching selection or closing customization cancels the unconfirmed preview. It never purchases or applies it automatically. Leaving Build restores the previous manual-pause state. Reduced-motion mode keeps control feedback immediate and static.

## Furniture covered

| Category | Four-view behavior |
| --- | --- |
| Waiting chairs | Four actual chair views per existing upholstery variant; seated patient direction and chair-back occlusion follow the selected view. |
| Reception counter | Four views for wood and modern variants, with correctly placed receptionist, patient approach and work poses. |
| Exam station | All four equipment models in four views, with rear/actor/foreground layers and connected moving supports. |
| Glasses display | Four views for both existing styles; shelves/glasses stay on the physical display face. |
| Storage cabinet | Four views, including coherent sides and back. |
| Plants | Four selectable orientations per existing style; asymmetric foliage changes appropriately. |
| Rugs | Four selectable orientations with matching floor-plane texture, pattern and fringe direction. |
| Wall prints | Stay mounted to the existing wall plane. Styles and wall-slot movement remain available; freestanding rotation controls are not shown. |

Cover the existing catalog and unlocked variants first. Do not add unrelated furniture categories, prices, XP thresholds or room expansions in this milestone. Keep all existing wall/floor finishes and their unlocks available.

## Four-view geometry

Use orientation IDs `0`, `1`, `2`, `3` in the order of the four visible facing directions, with `0` and `1` retaining the current two views. Rotating four times returns the item to its original facing, footprint and access profile. The stored `(x,y)` remains the top-left of the oriented floor footprint.

Each furniture kind has four explicit orientation profiles with oriented width/height and local service tiles. Each art/variant profile supplies its actual sprite layers, registration/ground anchor, selection bounds and any seated/operator anchors. Navigation consumes the service profiles; rendering consumes the corresponding art profile. Neither invents geometry from a truthy rotation value.

For rectangular objects, orientations `0`/`2` use the original width/height and `1`/`3` use the swapped dimensions. Preserve the current local service coordinates for `0` and `1`, allowing v3 layouts to remain valid in place. Define `2` as the 180-degree counterpart of `0`, and `3` as the counterpart of `1`, within their oriented footprints. A local service point `(a,b)` maps to `(width-1-a,height-1-b)` for that opposite view, including points outside the footprint. This gives four physical access sides without shifting an existing layout during migration.

Patient, staff and front/back labels must be checked against the actual drawn view. View-specific service slots can differ along a front edge; the drawn equipment and interaction anchors must physically fit those slots. All core service tiles must remain inside the room, unblocked and reachable from the entrance.

The placement checker rejects bounds violations, overlapping blocking furniture, blocked entrances, unreachable approaches, current/next actor-cell overlaps and stranded actors. Rugs remain walkable. Wall prints retain the current wall-slot rules.

## Characters and equipment contact

Retain eight patient appearances and standardize the relevant source frames so head/body proportions, foot baselines and seat positions remain consistent. Supply genuine seated poses for all four directions, including rear views. Walking and idle direction continue to follow movement; sitting direction follows the chair/equipment.

Waiting-chair composition must place the patient between the appropriate rear and front chair layers. Chair backs, armrests and the seated body must occlude each other correctly from every view. Do not draw a front-facing patient over a rear-facing chair back.

All four examination models need view-specific patient eye/seat anchors, operator/hand anchors, resting and active instrument positions and physical support attachments. Preserve the trial-frame lens-exchange, manual-dial and digital-controller interactions. Trial frames remain worn spectacles with no suspended head; phoropter heads remain connected through sitting, examination and standing.

Reception needs correctly directed check-in/payment poses and counter/staff layering for all four views. Keep the patient and receptionist on their respective access sides.

When occupied furniture is moved or rotated in paused customization, resume the existing safe reroute/reseat behavior. Preserve the current patient's reserved equipment, remaining examination/pose time, payout and payment flag. Equipment selection still applies to future patients. Editing grants no XP, payment, refund or duplicate purchase.

## Controls and visual feedback

- Retain portrait fullscreen layout, current pan/zoom and safe-area handling.
- Keep rotate, reverse, Confirm and Cancel controls reachable with at least 44 CSS-pixel touch targets. Confirm/Cancel stay accessible while the style list scrolls.
- Show a selected-object outline, contact shadow, oriented footprint and separate patient/staff access markers during preview.
- Show the style name, orientation and either the one-time purchase cost or **Owned · Free**.
- Locked styles explain the required level. A failed rotation explains the blocked access side rather than a silent refusal.
- Support the object list and keyboard selection as well as tapping visible pixels. Thin support arms and transparent sprite regions remain accurately selectable.
- Fully transparent layers must not intercept input. This resolves the deferred invisible-trial-frame hit-region issue as part of the selection update.
- Rotating furniture does not move the camera or shift unrelated objects. Cosmetic changes do not affect examination speed, payout or XP.

## Save compatibility

Introduce schema v4 and key `little-eyes-tycoon-v4`. Keep prior v3/v2 records untouched during automatic migration. Old `0`/`1` views, coordinates, styles, inventory, finishes, wallet, visits, starter, XP, equipment ownership/selection and milestone acknowledgments retain their meaning. Never grant a fresh wallet or replay acknowledged celebrations.

Validate v4 orientation IDs per category and require a complete valid profile for each represented furnishing/style. Normalize legacy wall-print orientation to its visually identical mounted state. Preserve actual floor furniture orientation IDs unchanged.

Read valid v4 first. When v4 is absent, migrate valid v3; when both are absent, migrate valid v2 using the existing equipment/XP mappings directly into v4. If the newest existing record is corrupt, preserve it and offer explicit recovery from a validated older record. Do not silently substitute a stale save. A blocked migration write keeps the recovered clinic playable with the existing visible session-only notice.

Confirmed new-practice reset clears v4/v3/v2 progression records so an older game cannot reappear on reload. The original prototype's separate save remains untouched. Runtime patients remain unsaved and reload starts a fresh queue; no offline earnings are introduced.

## Verification and acceptance

The pass is ready when all of these hold:

- Every supported floor furnishing and existing variant can be previewed in all four orientations; four turns restore its original state without a charge or positional drift.
- A combined move/rotate/style edit commits once. Cancel, panel close and selection changes leave the original item and wallet intact.
- All four directions enforce the same affordability, ownership, milestone, overlap and route rules.
- Patients sit on the intended seat, approach the correct equipment face and maintain eye/hand contact without clipping through foreground furniture.
- Mid-visit moves/rotations preserve reservations, timers and exactly-once rewards in both presets and with either starter.
- v3/v2 migration preserves valid layouts and progression, v4 round-trips all four orientations, corrupt-newest recovery remains explicit and blocked storage remains visible.
- Production-rendered proofs cover four equipment models × four orientations × eight patient appearances (128 examination combinations), plus sit/work/stand transitions, all chair upholsteries/directions, reception directions and customization variants.
- Inspect those proofs and correct visual defects before treating generated artwork as integrated. Run the full regression suite and standalone bootstrap checks.
- Perform real browser/portrait Android checks when the environment supports them. Native renderer/VM checks must be labeled separately from device verification.

Preserve the current released local HTML/source before changes. Deliver updated standalone HTML, original sprite assets, source ZIP and reviewed visual proofs. Retain the existing Site identity and audience if publishing becomes available; report infrastructure blockers accurately. Android packaging remains a later milestone.

## Scope boundaries

This milestone improves furniture customization and the character interactions it depends on. Room-camera rotation, new room construction, extra patient systems, mini-games, audio, monetization and Play Store publication are separate milestones.

## Design review

Checked the proposal against the user's furniture-first choice and the current binary rotation, placement, interaction and save implementations. The explicit `0`/`1` profiles preserve old layout access geometry; new views add opposite access sides. Shared preview state prevents style/rotation from discarding another pending edit. The v4 key protects older saves and makes recovery deliberate. No balance change or unrelated content subsystem is required.
