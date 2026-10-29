# Web-to-native worklist

The user's 28 October feedback rejects the first beta's catalog-first navigation and missing meeting controls. The live site and `docs/timer.js`, `model.js`, `session.js`, `presets.js`, `features.js`, `templates.js` are the behavior references. Preserve the public website; change the native app in this branch.

## Native screens

| Surface | Native behavior | Verification status |
|---|---|---|
| Meeting (default tab) | Welcome 2 min, seven named participants, current/next budget, progress and segmented cells, manual/automatic handoff, pause/undo/reset/extend | Core tests pass; native UI capture pending |
| Run of show | Rename, minutes, person/topic, add/remove, pins, live drag reorder with auto-scroll and accessible move actions | Stable-ID reorder tests pass; gesture/device test pending |
| Meeting timeline | Proportional plan, actual early/over segments, draggable boundaries, equal times, total/proportional allocation and clock correction | Allocation/core tests pass; native gesture test pending |
| Templates/library | Same seven website starters plus Welcome & participants; independent saved plans; edit, duplicate, remove, four colors/six icons, JSON transfer | Source implemented; end-to-end persistence checks pending |
| For later | Private text, owner, completion, edit/remove | Source implemented; private projection test passes |
| Report | Immutable original plan by slot ID, actual/pending/skipped slots, plan changes, follow-ups, CSV/copy/print | Core and export tests pass; native share/print pending |
| Focus | Large current/next clock and transport, wake lock | Source implemented; native portrait/landscape pending |
| Live sharing | Existing Firebase rules and web audience/control protocol; anonymous host, QR, separate capabilities, heartbeat, revoke/expiry, reconnect | Source implemented; network/native tests pending |
| Other timers | Preserve all nine modes; separate Timers tab; shared brand tokens | Prior beta engine tests pass; new native regression pending |
| Appearance | Light website palette by default; Light/Dark/Use device preference | Browser source running; native chrome/large type pending |

## Platform and account work

- Android overlay: local Expo module in progress. Explicit special-permission opt-in, visible foreground service and native drag/close controls; it must be verified on the release APK before being called working.
- iOS cannot host an arbitrary application overlay. Focus mode is an in-app view. Native PiP/Live Activities are separate work, not claimed as implemented.
- Native Google login/private library sync needs registered mobile OAuth clients/signing configuration. The available Firebase CLI session returned `Failed to authenticate`; no project/account settings have been changed. Live anonymous sharing uses the existing public app configuration and existing rules, without widening access.
- Store enrollment/signing accounts were absent in the owner's last answer. No store publication is authorized by a successful compile, and none has occurred.

## Verification contract

Test the real Android phone/tablet APK and iPhone/iPad simulator build, including actual reorder/boundary gestures and an early handoff. Browser checks establish portable behavior only. Preserve synthetic-test labels; revoke any test live links. Record the final source SHA, binary hash, screenshots and exact native UI verdict. A new user's criticism resets the review scope; use a fresh reviewer, not the earlier beta's partial verdict.
