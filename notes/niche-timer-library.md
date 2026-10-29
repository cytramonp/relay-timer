# Niche timer library

19 specialty presets extend the existing nine activity timers. The web directory groups them under Sports, Professional, Learning & events and Everyday. Six fixed-duration shortcuts remain separate.

Each specialty URL is a static document with its own title, description, canonical, WebApplication metadata, instructions, limitations, related links and PNG stage diagram. Sitemap and llms.txt enumerate every public timer. Search indexing and rankings depend on crawlers after deployment.

Three timing modes share an engine across web and native: independent elapsed clocks with lap splits; independent stage sequences; multiplayer time banks with one active clock. Automatic transitions catch up using timestamps. Timings and labels are editable; example timings are not official sport rules or validated professional protocols. Saved sessions reopen paused.

Favorites and the start timer are device-local preferences. Setting a start timer selects the opening screen without starting time. Previous/next links cycle favorites. The explicit Meeting link bypasses the web start preference.

The specialty web board supports CSV export, fullscreen and opt-in audible stage cues. The native board currently provides visual transitions only and does not schedule background notifications or export results. Multi-device display synchronization, GPS sailing starts, score integration, automatic participant rotations, validated lab protocols and in-flight skydiving instruments are outside this release. Skydiving is ground preparation only.

Web validation: timestamp/independence/turn-handoff/extension tests, static metadata and local-link checks, desktop and 390px browser inspection, favorites persistence and default-screen navigation. Native validation includes typecheck, lint, unit tests and Expo export; store distribution and device acceptance are separate release steps.

Regenerate editorial data with `npm run build:timers`. The mobile checkout copies the engine and catalogue automatically. With mobile dependencies installed, `npm run build:timer-art` regenerates public and native PNG diagrams.
