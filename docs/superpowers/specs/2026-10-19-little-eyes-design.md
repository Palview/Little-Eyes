# Little Eyes — first playable design

## Intent and agreed direction
Build a cozy optometrist tycoon browser game. The player cares for patients, plays short eye-exam minigames, fits glasses, and uses earnings to improve a welcoming clinic. The user selected cozy play with minigames and approved this feature direction. Success means completing this entire loop in a polished, usable first version.

## Experience and presentation
A warm pastel clinic is the main screen, with a waiting area, exam chair, and glasses display. Friendly illustrated patients, rounded typography, plants, and small animations give the game personality. Clearly visible coins, patients helped, and the next action keep play understandable. Support desktop and mobile layouts, keyboard-operable controls, readable contrast, reduced motion, and text labels alongside visual cues.

## Patient loop
Start with 100 coins and an available patient. Invite one patient into the exam chair. Show their name and a brief friendly request. Proceed through the eye chart, focus test, and frame selection in order. Finish with a cheerful patient summary and a coin reward, then invite the next patient. Only one patient is active at a time; the queue is decorative and replenishes without a timer.

## Eye-chart minigame
Show a large rotated E and four labeled direction buttons: up, right, down, left. Three rounds use different orientations and progressively smaller letters. A wrong answer gives gentle feedback and lets the player retry; there is no countdown or failure state. Correct answers advance the test. Include keyboard arrow support while this minigame is active.

## Focus minigame
Show a blurred illustration with a labeled focus slider. Its distance from a randomized target determines blur. A nearby indicator gives feedback without requiring perfect vision to play. Confirming within a forgiving range completes the test; otherwise provide an encouraging hint and allow another attempt. Slider controls work with keyboard and touch.

## Glasses and rewards
Offer three clearly labeled frame styles. Each patient has a visible style preference. Any selection can complete the visit; matching the preference adds a small bonus. A completed visit earns 40 coins, plus 10 for matching frames. Record patients helped. Display the exact earnings in the completion summary.

## Clinic upgrades
Offer three one-time purchases: a plant for 60 coins, a cozy waiting chair for 100 coins, and improved exam equipment for 150 coins. Purchases visibly change the clinic. Equipment adds 10 coins to future completed visits. Disable unaffordable and owned purchases with clear explanations. Currency never becomes negative. No recurring costs, staff management, or patient penalties in this version.

## State and architecture
Use a buildless HTML/CSS/JavaScript app with no backend or external accounts. Keep game rules/state separate from UI rendering and minigame event handling. State includes coins, completed visits, purchased upgrades, active visit stage, chart progress, focus target/value, and selected patient. Only durable progression (coins, completed visits, upgrades) is saved to localStorage; reloading starts a fresh patient visit. Use a versioned save format and validate loaded values. Missing or invalid saves fall back to a new game; unavailable storage allows play with an unobtrusive session-only notice. Reset progress requires confirmation.

## Delivery
Build and publish a private Site using the Sites workflow. Use original lightweight inline SVG/CSS illustrations for the clinic and characters. Avoid external runtime dependencies. Page title and branding are Little Eyes. No medical diagnosis or real patient data is collected.

## Verification
Check the complete visit sequence, all chart directions and retry behavior, focus success and retry behavior, frame bonuses, upgrade affordability and reward effects, save/reload, invalid storage recovery, and reset. Check JavaScript syntax and game rules with deterministic automated checks. Perform browser QA where supported by the environment; report any browser verification limit at handoff.

## Scope boundary
This version includes one clinic, two exam minigames, three frame options, three upgrades, and local progression. Additional rooms, staff, deeper finances, audio, multiplayer, and cloud saves are future work.
