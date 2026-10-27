# Mobile beta validation

Checked 26 October 2026 (America/Los_Angeles). These statuses describe the development beta, not a store release.

## Passed locally

- TypeScript strict typecheck and Expo ESLint.
- 20 mobile core tests: shared meeting deadlines, pause/resume, manual/automatic transitions, long gaps, workout sequence boundaries, chess increment/delay/flag, time zones, recovery, bounded alert plans, imports and CSV formula escaping.
- Expo Doctor: 20/20 checks, including a final run with expo-asset, expo-system-ui and expo-navigation-bar installed.
- Production web export of the native UI code.
- Production Hermes bundle export for iOS and Android on the Windows host. The isolated compiler invocation failed; the host invocation succeeded. This validates JS bundling, not Xcode/Gradle compilation or device behavior.
- Existing website: 42/42 tests and JavaScript/JSON checks. Website application sources and deployment configuration are unchanged.
- In the browser preview: reject 0 boxing rounds, correct the configuration, save a two-round 2s-work/1s-rest program, start it, observe automatic completion, persist the named program and restore it after reload. The completed run appears in History.

## Dependency audit

The current Expo SDK 58 dependency tree reports five high-severity transitive findings, involving Expo CLI, its signing-certificate tooling, node-forge and zod. The reported automatic fix downgrades Expo to SDK 44 and is not appropriate. The registry did not provide the attempted node-forge 1.4.1 version, so no unverified override is retained. The app does not enable OTA code signing, a backend or public development tooling. These findings remain an explicit assessment/update gate before production release; no clean dependency-audit claim is made.

## Still requiring native and account verification

- iOS native archive, signing, installation and TestFlight access.
- Physical iPhone/Android testing and complete iOS phone/tablet interaction captures; browser captures are only UI-preview evidence.
- OS notification permissions including Android exact-alarm access, real lock-screen delivery, Focus/Doze, process termination and interrupted audio.
- Dark appearance, large system text, safe areas, keyboard and gestures on actual supported devices.
- Native document picker/share sheet and SQLite recovery on hardware.
- No App Store or Google Play submission has been made by this source-code change.

## Native evidence and review update

- Android run [40450811756](https://github.com/cytramonp/relay-timer/actions/runs/40450811756), source `5c4cd90`, compiled a standalone arm64/x86_64 release-mode test APK and passed emulator launch/captures for phone and tablet. Catalog, timer, editor, history, dark appearance and font scale 1.3 captures are available. This establishes basic launch and ready-state UI, not lock-screen alarm delivery or physical-device behavior.
- Its APK SHA-256 is `2A262F3DC493DB5EDDD01185694CB22CDE862C497AA0149F36F9A56BF4D7690E`. It is an internal test build signed with the generated development identity.
- Android visual review returned **fix**. First correction scoring resolved the selected rail surface. The second correction verdict on source `5c4cd90` resolved the tablet rail width and Programs label truncation, but phone dark status icons and the gesture indicator still have low contrast. This known defect remains open; the reviewer did not grant whole-surface or release approval. The owner has been asked to choose between testing the beta with this defect and funding another correction round.
- iOS native compilation succeeded on macOS, and the initial simulator catalog rendered on iPhone and iPad. The first deep-link captures were blocked by the OS confirmation and are not accepted as timer/editor/history evidence. In [40448998225](https://github.com/cytramonp/relay-timer/actions/runs/40448998225), Xcode compilation and Maestro assertions for catalog, Boxing timer and editor passed, then the flow exceeded its 240-second process budget before completing History. This is a partial check, not an iOS UI pass. The workflow now preserves the compiled simulator artifact before UI checks, uploads partial captures on failure and allows 600 seconds per device flow. Complete iOS visual and interaction approval remains pending.
- The owner confirmed that Apple Developer and Google Play developer accounts have not been created. No store enrollment, signing-account setup or store publication was performed.
