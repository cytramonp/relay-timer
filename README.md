# Relay Timer

Public app: **https://cytramonp.github.io/relay-timer/**

A meeting timer with fixed milestones. An early finish passes spare time to the next speaker; an overrun reduces later time. Based on the owner's latest Daily Relay Timer HTML, with a new light workspace and dark stage monitor.

## Use

Open the app and edit the agenda immediately. No account, subscription, trial or feature gate is required. Google sign-in optionally synchronizes private saved meetings across devices.

- Speakers and group topics, equal split, pinned durations, proportional redistribution.
- Drag agenda rows or milestone boundaries; reorder during a meeting.
- Pause, undo, minimum turns, warning cues and clock correction.
- Floating Document PiP, video/canvas PiP fallback, wide/strip/square layouts and clock size.
- Automatic local recovery, named meeting library, JSON import/export and completed-run summary.
- Presets: Daily standup, retrospective, planning, workshop and focus session. Presets are editable examples, not mandatory Scrum timings.

## Development

Node.js is used only for the local server and tests; no runtime build or package installation is needed.

```sh
npm run dev
npm test
npm run check
```

GitHub Pages publishes `docs/` from `main`. All asset paths are relative to support the repository subpath. Keep the `.nojekyll` marker.

## Data and Google sign-in

Firebase Authentication uses the Google provider with basic profile scopes. Cloud Firestore stores records under `users/{uid}/meetings/{meetingId}`. `firestore.rules` restricts each path to the matching authenticated user and validates the record envelope. The Firebase web configuration in `docs/firebase-config.json` is public client configuration, not an administrator credential. No service-account key is distributed.

Libraries merge by record ID and modification timestamp. The newest edit to the same meeting wins; this is saved-library sync, not collaborative live control. Deleted records retain a content-free tombstone to prevent resurrection from another device. Guest libraries and signed-in account caches use separate local-storage keys. Signing out returns to the guest library.

Export before clearing browser storage. Google sign-in and initial SDK loading need a network connection. Cached timer resources provide best-effort offline guest use after the first successful load. Mobile background alarms and actual screen-share visibility are browser/OS dependent and are not guaranteed.

Firebase was provisioned in a separate project with a free-tier Firestore database and no linked billing account. Free provider quotas still apply; they are infrastructure limits, not product paywalls. Do not enable billing without the owner's approval.

## Validation

Eleven tests cover the production model, timestamp behavior, quarter-minute allocation, import validation, preset totals, record merging and deletion tombstones. JavaScript syntax and public JSON are checked by `npm run check`. Browser and deployment validation are reported in the delivery, without treating provider setup as proof of user sign-in.

## Product research

See [USE-CASES.md](USE-CASES.md) for scenarios, source evidence, gaps and priorities. No revenue or traffic estimates are inferred from forum comments.
