# Release verification — 23 October 2026

Public application: https://cytramonp.github.io/relay-timer/

## Robot-reference design and live-session update

- Nineteen tests pass, including automatic catch-up at exact deadlines, manual/pause behavior, immutable original plans, added/removed slot history, parking import, CSV formula escaping and exclusion of private data from live projections.
- Firebase anonymous hosting enabled; isolated room rules deployed. Two disposable anonymous identities verified: room creation and anonymous single-room read succeed; enumeration, control-secret access, unrelated timer/library access and wrong-token commands fail; a valid command is accepted, readable by the host, and removed; revoking the room denies subsequent read. These QA identities and records were removed.
- Browser host → viewer → controller verified with Start, Pause, Extend, Next and Undo, including host acknowledgements. A private QA note did not appear on the viewer. Host reload recovered the live room and the paused state. Two browser QA rooms were revoked after captures.
- Browser auto-next advanced on a milestone crossing; manual policy stayed on the same topic in overtime.
- Browser report retained a 56-minute original plan after extending the agenda to 57 minutes and showed the plan edit. CSV export button exercised; an earlier browser download-observation call timed out. CSV serialization is tested, but the downloaded file was not independently inspected.
- Final operating views captured at host widths 1440, 1270 and 390; audience widths 1440 and 390; remote control 1440; sharing and report dialogs. Captures reopened before review. Mobile agenda names use a full-width row with minutes and available/used time underneath.
- Fresh full finish review disposition: **ship**, at the written robot.com inspiration/direction-contract scope. No approved comp or image-based exact reference-fidelity claim. DESIGN.md and sidecar are refreshed after this review.
- Anonymous live sharing is independently verified. Real Google account-library write/read and another physical device remain unverified; do not conflate the two.

## Verified

- GitHub Pages serves the public `main` branch from `/docs`; build `cd4cc3c` completed successfully.
- The public workspace opens without authentication or a pricing gate.
- Original release: eleven Node tests passed; the update has nineteen. Application JavaScript syntax and public JSON checks pass.
- Browser controls exercised: start, clock adjustment, next, pause, undo and reset.
- A milestone pointer drag changed the first slot from 8 to 10 minutes and redistributed the rest while retaining the 56-minute total. Equal times restored the initial plan.
- Keyboard Up/Down reorders agenda rows.
- Eight speakers and a 90-minute Workshop work without the earlier beta limits.
- A named local meeting survives a public-page reload. Test meetings were removed from the visible library.
- Document Picture-in-Picture opens and closes from the public application.
- Desktop and 390px mobile layouts were captured and reviewed. Mobile controls and expanded settings fit the available width. The mobile help entry opens the existing dialog using Enter.
- The independent finish review's one finding (mobile help access) was resolved; final design disposition: ship.
- Firebase Google provider and GitHub Pages authorized domain are configured. An unauthenticated private-library request is rejected with HTTP 403. Live projections intentionally permit single-room reads by link. These checks are not a comprehensive security audit.

## Still requiring real-account or device verification

- Google opens its account chooser. Account selection is left to the owner; authenticated cloud write/read, another device and account switching have not been verified end to end.
- Actual audience visibility during screen sharing, video-PiP fallback and mobile background behavior require checks in the intended browser/OS and meeting software.
- Desktop Chrome and a responsive viewport were used; real iOS/Android browser testing was not performed. This is a web release, not a native mobile application.

Cloud-library sync merges saved meetings; it does not provide a shared live timer room. No paid feature restrictions are enabled. Relay Timer remains a working product name.
