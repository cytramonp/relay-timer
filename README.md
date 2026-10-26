# Relay Timer

Public app: **https://cytramonp.github.io/relay-timer/**

A meeting timer with fixed milestones. An early finish passes spare time to the next speaker; an overrun reduces later time. Based on the owner's latest Daily Relay Timer HTML, with a new light workspace and dark stage monitor.

## Use

Open the app and edit the agenda immediately. No account, subscription, trial or feature gate is required. Google sign-in optionally synchronizes private saved meetings across devices.

- Speakers and group topics, equal split, pinned durations, proportional redistribution. **Equal times** includes unfinished speakers and topics, clears their manual pins and preserves completed slots during an active session.
- Drag agenda rows or milestone boundaries; reorder during a meeting.
- Pause, undo, minimum turns, warning cues and clock correction.
- Floating Document PiP, video/canvas PiP fallback, wide/strip/square layouts and clock size.
- Automatic local recovery, named meeting library, JSON import/export and completed-run summary.
- Presets: Daily standup, retrospective, planning, workshop and focus session. Presets are editable examples, not mandatory Scrum timings.
- **Templates dropdown**: start from a preset or your saved plan directly; choose Save current agenda, Create template or Manage templates for the editor. Edit slot names, types, durations and order; choose one of four colors and six icons; duplicate or delete your templates. Applying one creates an independent meeting without previous notes or session history.
- On phones, **Timer / Agenda / Notes** navigation keeps each task in view. Agenda and notes include a live countdown shortcut back to the timer; editable fields use a larger mobile type size.
- Live audience link and locally generated QR; a separate control capability supports start/next, pause/resume, undo and one-minute extensions.
- Private parking topics, action owners and completion checkboxes, saved with each meeting.
- Original agenda captured at Start, actual-time report, plan-change history, CSV export, copy and print. Reset archives the session report; a fresh meeting copy clears reports and notes.
- Manual overtime or automatic milestone transitions. One-minute extensions add time to the current slot and the overall agenda.

## Live sharing

Choose **Share live → Create live link**. The viewer needs no account. Google sign-in is also optional for hosting; Firebase can create an anonymous host identity. Keep the host tab open. The audience page extrapolates the anchored clock and shows a stale-connection warning after 45 seconds without a host update. The existing worker clock also drives live heartbeats, with a page-timer fallback. This remains a browser-hosted session, not an always-running server timer.

Anyone with the viewer link can see the meeting title, agenda names, planned durations and current timer. The public projection excludes parking notes, action owners, reports, Google profile and private library IDs. The control link contains an independent capability in its URL fragment; only share it with a trusted co-host. Control requests are acknowledged by the host. Links expire after 24 hours; **Stop sharing** revokes them after server confirmation. Switching meetings stops broadcasting and attempts revocation; if offline, reconnect and retry Stop sharing. Signing in/out waits for revocation. Automatic expiry restricts access; it is not a promise that expired infrastructure records have been physically erased.

Firestore denies room enumeration, access to the host/control-secret record, and writes from viewers. A controller can submit only the four allowed actions with the correct capability. This is a scoped access-control design, not a substitute for a comprehensive security review or abuse protection at scale.

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

Custom templates use the same private record envelope and synchronization path, with validated `state.template` appearance metadata. They are listed separately from meetings and included in **Export all** backups. The editor refuses to overwrite a template changed remotely while its draft was open. Saving a template excludes runs, archived reports and parking notes. Starter templates remain unchanged when customized.

Export before clearing browser storage. Google sign-in and initial SDK loading need a network connection. Cached timer resources provide best-effort offline guest use after the first successful load. Mobile background alarms and actual screen-share visibility are browser/OS dependent and are not guaranteed.

Firebase was provisioned in a separate project with a free-tier Firestore database and no linked billing account. Free provider quotas still apply; they are infrastructure limits, not product paywalls. Do not enable billing without the owner's approval.

## Validation

Twenty-seven tests cover the production model, timestamp behavior, allocation, explicit equalization, imports, merges, deletion, automatic transitions, immutable report baselines, removed-slot history, CSV formula escaping, private-data projection and reusable-template isolation/backup/sync behavior. JavaScript syntax and public JSON are checked by `npm run check`. See [VALIDATION.md](VALIDATION.md) for browser, Firebase and deployment evidence. Provider setup is not proof of a real Google sign-in.

## Visual reference and licenses

The user selected robot.com as a visual reference. This application uses its own layout, icons and a self-hosted open-source font. See [THIRD-PARTY.md](THIRD-PARTY.md).

## Product research

See [USE-CASES.md](USE-CASES.md) for scenarios, source evidence, gaps and priorities. No revenue or traffic estimates are inferred from forum comments.
