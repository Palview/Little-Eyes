# Little Eyes — furniture customization

Portrait browser build, 22 October 2026. This milestone adds furniture customization to the existing cozy optometrist tycoon. Android/Play Store packaging remains a separate milestone.

## Play and controls

Open `Little-Eyes-Portrait.html` in a JavaScript-capable browser such as Chrome. All code and artwork are embedded, with no external asset download required. Attachment preview screens may block JavaScript: download the file and open it in the browser. Use fullscreen where supported.

Choose either furnished clinic and either starter kit. Tap a furnishing, then **Customize**, or choose an item from Build. Move it by tapping a floor tile, choose an unlocked style and turn it through four views. Forward/reverse buttons and **R / Shift+R** share the same rotation controls. On a keyboard, arrow keys move the pending item, Enter confirms and Escape cancels. Mounted wall art stays fixed to its wall.

Moves, rotation and style changes share one preview. Confirm applies everything once; Cancel, closing the panel, switching selections/tabs or leaving Build discards it. Existing items and unlocked styles are free; new furniture costs its shown category price once. Inventory reuses owned items. Essential stations and the final two waiting seats cannot be stored. Blue markers show patient access; amber markers show staff access. Invalid placement explains the problem and disables Confirm.

Build pauses patient care. A manual pause remains in effect when leaving Build. Current patients retain their reserved equipment, fee and remaining exam time after equipment selection or a valid furniture move. Reception service resumes its captured remaining time after a move. Style-only edits leave patients and timers alone.

## Artwork and save compatibility

Four oriented profiles cover all existing floor furniture and styles: waiting chairs, reception, display, cabinet, plants, rugs and all four examination kits. Original new PNG atlases include rear-facing seated patients for all eight appearances, raised-arm rear trial/manual doctor work poses and rear digital work poses, reception work poses and rear exam stations. Optical heads are separate moving parts with support links. Chair backs and counter fronts hide the appropriate parts of interacting characters. Source-component masks/outlines isolate sprites for rendering and picking. The original PNG bytes are retained; registration scripts read bounds and alpha metadata.

Centered rugs explicitly reuse their opposite view because their weave/fringe is symmetric. Rear reception check-in/payment reuse a complete rear clipboard handling pose; the generated sheet's truncated final row is not used. Rear station foregrounds reuse the exact station pixels to keep chair occlusion aligned. Fixed camera; furniture rotation does not rotate the room.

The current save key is `little-eyes-tycoon-v4`. Existing v3 and v2 records migrate without moving legacy furniture, changing ownership or granting a fresh wallet/XP. Original older records remain untouched. An unreadable newest record offers **Recover previous save** rather than silently loading an older one. Browser storage may be unavailable for downloaded files; the game shows a session-only notice. Unfinished visits restart on reload; no offline income is granted.

Equipment prices, duration/earnings multipliers, starter balances, XP and milestone thresholds remain unchanged from `progression-release-notes.md`.

## Verification and limits

Automated regression checks cover geometry, save migration/recovery, atomic customization, standalone UI, occupied rotation/payment invariants and the legacy game. Final full runner: 94 checks passed, zero failures; standalone bundle syntax passed. The implementation ledger records review findings and package integrity checks. Run `node scripts/check-tycoon.mjs`; this rebuilds the self-contained HTML and checks module syntax.

Production-rendered proofs cover 128 examination appearance/view/model combinations, 128 waiting-chair combinations, 128 sit/work/stand samples, 16 reception combinations, remaining furnishing variants and both presets at 390×844. Run `node scripts/render-station-proof.mjs` with `@napi-rs/canvas` installed; `scripts/register-furniture-art.py` requires Pillow. These are native Canvas proofs, not mobile browser screenshots.

Physical Android and real browser CSS, touch, storage and performance checks remain outstanding. Chromium startup is blocked in the build sandbox (`setsockopt: Operation not permitted`). The standalone is a large art-heavy file; phone performance is unmeasured. The existing Site has no deployed version because the source repository proxy connection failed. No live URL or Play Store release is claimed.

The pre-update release remains in `snapshots/before-furniture-customization` in the workspace. There is no writable Git checkout here; source snapshots and the implementation ledger preserve rollback/review evidence.

The final independent review ended before a verdict due to a reviewer usage limit. Its two received visual findings were reproduced and fixed; `furniture-final-review.md` records the scope and limits.
