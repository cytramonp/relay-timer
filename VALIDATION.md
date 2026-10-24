# Release verification — 23 October 2026

Public application: https://cytramonp.github.io/relay-timer/

## Verified

- GitHub Pages serves the public `main` branch from `/docs`; build `cd4cc3c` completed successfully.
- The public workspace opens without authentication or a pricing gate.
- Eleven Node tests pass; application JavaScript syntax and public JSON checks pass.
- Browser controls exercised: start, clock adjustment, next, pause, undo and reset.
- A milestone pointer drag changed the first slot from 8 to 10 minutes and redistributed the rest while retaining the 56-minute total. Equal times restored the initial plan.
- Keyboard Up/Down reorders agenda rows.
- Eight speakers and a 90-minute Workshop work without the earlier beta limits.
- A named local meeting survives a public-page reload. Test meetings were removed from the visible library.
- Document Picture-in-Picture opens and closes from the public application.
- Desktop and 390px mobile layouts were captured and reviewed. Mobile controls and expanded settings fit the available width. The mobile help entry opens the existing dialog using Enter.
- The independent finish review's one finding (mobile help access) was resolved; final design disposition: ship.
- Firebase Google provider and GitHub Pages authorized domain are configured. An unauthenticated Firestore request is rejected with HTTP 403. This single check is not a comprehensive security audit.

## Still requiring real-account or device verification

- Google opens its account chooser. Account selection is left to the owner; authenticated cloud write/read, another device and account switching have not been verified end to end.
- Actual audience visibility during screen sharing, video-PiP fallback and mobile background behavior require checks in the intended browser/OS and meeting software.
- Desktop Chrome and a responsive viewport were used; real iOS/Android browser testing was not performed. This is a web release, not a native mobile application.

Cloud-library sync merges saved meetings; it does not provide a shared live timer room. No paid feature restrictions are enabled. Relay Timer remains a working product name.
