# Niche timer library

19 specialty presets extend the existing nine activity timers. The web directory groups them under Sports, Professional, Learning & events and Everyday. Six fixed-duration shortcuts remain separate.

Each specialty URL is a static document with its own title, description, canonical, WebApplication metadata, instructions, limitations, related links and PNG stage diagram. Sitemap and llms.txt enumerate every public timer. Search indexing and rankings depend on crawlers after deployment.

Three timing modes share an engine across web and native: independent elapsed clocks with lap splits; independent stage sequences; multiplayer time banks with one active clock. Automatic transitions catch up using timestamps. Timings and labels are editable; example timings are not official sport rules or validated professional protocols. Saved sessions reopen paused.

Web favorites, the start timer, custom timers, templates and paused configurations save locally and optionally synchronize to the signed-in Google account. Native favorites currently remain device-local. Setting a start timer selects the opening screen without starting time. Previous/next links cycle favorites. The explicit Meeting link bypasses the web start preference.

The specialty web board supports CSV export, fullscreen for a board or an individual clock, touch-adjustable timelines and per-stage cues. Sports cues are on by default; study and professional workflows default to quiet. The editor supports preparation, rest, repeats, manual/automatic handoff, count direction, start/end cues, warning thresholds and recurring reminders. The native board currently provides visual transitions only and does not schedule background notifications or export results. Multi-device display synchronization, GPS sailing starts, score integration, automatic participant rotations, validated lab protocols and in-flight skydiving instruments are outside this release. Skydiving is ground preparation only.

Web validation: timestamp/independence/turn-handoff/extension tests, static metadata and local-link checks, desktop and 390px browser inspection, favorites persistence and default-screen navigation. Native validation includes typecheck, lint, unit tests and Expo export; store distribution and device acceptance are separate release steps.

Regenerate editorial data with `npm run build:timers`. The mobile checkout copies the engine and catalogue automatically. With mobile dependencies installed, `npm run build:timer-art` regenerates public and native PNG diagrams.


## Web customization revision — 29 October 2026

The directory and Other Timers show every group expanded initially, with Collapse to Groups. Existing illustrated thumbnails are preserved, with a matching twenty-cell sprite for specialty activities and Meeting. The SVG timing diagrams remain in guides.

`/custom-timer/` provides a reusable sequence, independent stopwatch or multiplayer time-bank builder. Saved custom timers can be duplicated, favorited and selected as the opening timer. Meeting has one Templates button for Daily standup, Sprint planning, Retrospective, Workshop and Eight participants. Live sharing is labeled Live Link.

Settings sync uses owner-only `users/{uid}/timerSettings` records, kept separate from meeting records and live projections. Guest setup import is allowed on first sign-in; switching accounts restores separate local buckets. Changes received while a timer is open offer Load synced settings rather than interrupting a live clock. Initial timer restoration does not overwrite cloud settings. Google OAuth remains the existing provider; real cross-device Google interaction is distinct from deployed database rule tests.

Validation includes independent/manual clock mechanics, seeking, account isolation, local custom-timer save/reload, expanded/collapsed catalog, meeting templates, fullscreen, mobile layouts, and actual Web Audio source starts on a 3-second/2-second boxing cycle. Four gong sources played over the complete two-round sequence; muting the gong produced no further sources. This verifies browser playback scheduling and a non-silent sound asset, not the user's physical speaker volume.

## Illustration asset

Built-in imagegen produced `docs/assets/specialty-illustrations.png` using `timer-illustrations.jpg` as a style reference. Prompt: one 4-column by 5-row sprite sheet, clean heavy black ink outlines, cream ground, red and teal fills, centered subjects, no text or borders. Row-major subjects: six stopwatches; running shoe; swim goggles/lane rope; kettlebell; carabiner/chalk bag; sailboat/start flag; archery target; scoreboard/whistle; dice/hourglass; paired microphones; exam clipboard; networking badges; film/developing tray; coffee dripper/kettle; bread/oven mitt; laboratory vessels; wrench/job clock; escape key/padlock; ground-preparation parachute/checklist; meeting table/chairs. Original artwork remains unchanged.


## Stage cues and timeline alarms
Stage transition ticks default on independently of alarm/gong settings and can be muted in sound settings/Customize. A separate Set alarm range selects an elapsed-time checkpoint without seeking. Alarms save locally and through account preference synchronization; Test alarm unlocks and verifies browser audio. Main meeting uses its elapsed meeting time; independent clocks have separate alarm controls. New Year retains its dedicated midnight alarm. Closing or suspending a tab still does not guarantee delivery. Favorite and start controls now sit beside the title; the secondary row contains favorites only.
