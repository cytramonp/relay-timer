# CorpTimer

<!-- impeccable:product-schema 1 -->
## Platform
web
## Stack
Buildless HTML/CSS/JavaScript, Firebase Hosting (`relay-timer-web-7c39`) at https://corptimer.com/, a legacy GitHub Pages copy, optional Firebase Authentication and private Firestore library. Standalone timer documents are generated from local source and committed for static hosting.
## Users
Meeting facilitators, small teams, workshop hosts and presenters; standalone tools also serve workouts, study, classroom activities and two-player games.
## Product Purpose
An immediately usable public agenda timer with fixed milestones and time carryover. Google login is optional and synchronizes private saved meetings across devices. Meeting Timer remains at `/`; `/timers/` lists it alongside 14 standalone pages: boxing, fitness, Pomodoro, classroom, chess, stopwatch, simple countdown, New Year and six preset durations from 5 to 30 minutes.
## Operating Context
Facilitator at a laptop; the floating display stays near the video call. The newest supplied HTML is the functional baseline, including draggable boundaries, proportional allocation, reordering during a run, multiple PiP shapes and canvas/video fallback.
## Capabilities and Constraints
No monetization, paywalls or tier limits in this release. Preserve core features, named meeting library, templates, import/export and Google sync. Live sharing publishes a separate audience projection; private library, notes and reports remain separate. Host tab stays authoritative and must remain open. Viewer links are read-only; separate control capabilities permit next, pause, undo and extend. No analytics. Never promise PiP visibility to an audience without checking the actual sharing mode.

Standalone timers work without an account and keep distinct settings, presets and sessions in browser-local storage; they do not use Google/Firebase meeting sync. Export/import transfers a setup. Reloaded running sessions return paused, while New Year retains its target date. Keep the tab open for live alerts; suspended/background tabs and mobile devices cannot guarantee sound at the deadline or after the page closes.
## Brand Commitments
CorpTimer is the user-selected brand; https://corptimer.com/ is the primary origin after the 25 October 2026 cutover. Keep https://cytramonp.github.io/relay-timer/ available as the legacy copy. User approved a cream editorial workspace, charcoal type, compact dark teal clock block, cream Start / Next, salmon Reset and bright teal Float. Floating content stays dark; the audience page has a light ground and dark timer. Standalone tools extend this world with minimal half-comic illustrations in cream, charcoal, red and teal. Start directly in the app, not a marketing or pricing page.
## Product Principles
Immediate use without sign-in; preserve the host's control; show plan and actual time; state local/cloud save status truthfully; isolate each signed-in user's records.
