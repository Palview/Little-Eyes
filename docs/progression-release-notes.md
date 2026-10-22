# Little Eyes — progression and polish

Portrait browser game; standalone HTML works offline once downloaded. Open the HTML in Chrome or another JavaScript-capable browser. Attachment preview screens may not run JavaScript. Play Store packaging and testing remain a separate milestone.

## What's new

Choose either clinic preset, then a starter:
- Trial-frame kit: 300 starting coins; 50-second exams; 40 coins per paid visit.
- Manual phoropter: 100 starting coins; 30-second exams; 50 coins per paid visit.

The counter, doctor, two waiting seats, examination chair and glasses display are included. Every paid visit gives 10 XP.

| Level | Total XP | Equipment purchase unlock | Purchase cost | Exam | Payout |
| --- | ---: | --- | ---: | ---: | ---: |
| 1 | 0 | Trial-frame kit | 100 | 50s | 40 |
| 2 | 50 | Manual phoropter | 300 | 30s | 50 |
| 3 | 150 | Digital phoropter | 750 | 18s | 60 |
| 4 | 350 | Digital refraction suite | 1600 | 12s | 70 |

Time and earnings multipliers are displayed on every equipment card. Smaller time multipliers mean faster examinations. Purchased kits remain owned; select them for free. Current patients finish with their originally reserved kit, duration and fee.

Tap the Level/XP indicator to see milestones. Notifications explain new unlocks and do not pause patient care. Tap a furnishing to inspect it, then choose an unlocked style for free. Build mode pauses care for placement. New furnishings charge the existing category price; wall and floor finish changes stay free. The update includes eight patient appearances, original equipment and staff-work art, new upholstery, plants, rugs, prints, reception/display variants and wall/floor finishes.

## Saves

v3 saves keep wallet, XP, owned/selected equipment, milestone acknowledgments, layout, inventory and cosmetic variants on this device. Old v2 saves migrate without a fresh wallet grant; completed visits become 10 XP each. Previously owned tier equipment remains usable regardless of new purchase gates. Migration leaves the original v2 record intact. An unreadable current save offers explicit recovery rather than silently replacing it. Reload starts a fresh queue; no offline income.

## Validation

65 automated checks currently pass, including legacy prototype checks, starter/XP/ownership/payment invariants, layout and station movement, save migration/recovery, standalone startup and portrait control wiring. The native production Canvas renderer produces all 64 equipment/orientation/appearance combinations, sit/work/stand samples and both 390×844 preset scenes under `/workspace/shared/little-eyes-progression-proof/`.

Real browser/physical Android testing is outstanding: Chromium cannot start in this sandbox (`setsockopt: Operation not permitted`). VM control tests and native Canvas rendering do not verify mobile CSS, browser storage behavior or device performance.

Git source access currently fails to connect to the inherited proxy (`proxy:8080`), and the supported Sites source helper is unavailable. No publication was made. Hosting retains Site `appgprj_6ad682ebf8c08191a90cd796f2c1ab23`; publication depends on reaching the existing source repository and supported source packaging workflow. A registered Site with no deployed version is not a live game link.

## Final review and implementation choices

A fresh reviewer inspected code and production proofs. The mounting gap was fixed with articulated equipment support, inventory placement now enforces style milestones, and payment preserves safe counters even at JavaScript's representational limit. Full suite: 65/65 passing.

- No Git repository/source workflow helper is available here, so snapshots and a durable implementation log preserve the previous build. Tradeoff: rollback uses files rather than commits.
- The existing `saveClinic(storage, clinic)` argument order was preserved despite reversed shorthand in the plan. Tradeoff if a caller expects the shorthand: update that caller.
- Coins, XP and visits saturate at 9,007,199,254,740,991 to keep accepted saves valid. XP continues past Level 4 normally below that representational ceiling. Tradeoff: no further numerical growth at the ceiling.

Deferred minor: a fully invisible trial-frame foreground layer still records a hit region over its own exam station. The reviewer could not reproduce selection of an incorrect visible object; this was deferred as minor hardening.
