# Mobile beta validation

Checked 26 October 2026 (America/Los_Angeles). These statuses describe the development beta, not a store release.

## Passed locally

- TypeScript strict typecheck and Expo ESLint.
- 20 mobile core tests: shared meeting deadlines, pause/resume, manual/automatic transitions, long gaps, workout sequence boundaries, chess increment/delay/flag, time zones, recovery, bounded alert plans, imports and CSV formula escaping.
- Expo Doctor: 20/20 checks after adding the required expo-asset peer dependency.
- Production web export of the native UI code.
- Production Hermes bundle export for iOS and Android on the Windows host. The isolated compiler invocation failed; the host invocation succeeded. This validates JS bundling, not Xcode/Gradle compilation or device behavior.
- Existing website: 42/42 tests and JavaScript/JSON checks. Website application sources and deployment configuration are unchanged.
- In the browser preview: reject 0 boxing rounds, correct the configuration, save a two-round 2s-work/1s-rest program, start it, observe automatic completion, persist the named program and restore it after reload. The completed run appears in History.

## Dependency audit

The current Expo SDK 58 dependency tree reports five high-severity transitive findings, involving Expo CLI, its signing-certificate tooling, node-forge and zod. The reported automatic fix downgrades Expo to SDK 44 and is not appropriate. The registry did not provide the attempted node-forge 1.4.1 version, so no unverified override is retained. The app does not enable OTA code signing, a backend or public development tooling. These findings remain an explicit assessment/update gate before production release; no clean dependency-audit claim is made.

## Still requiring native and account verification

- GitHub Android APK workflow compilation and installation status is recorded separately from source publication.
- iOS native archive, signing, installation and TestFlight access.
- Physical iPhone/Android and native phone/tablet screenshots; browser captures are only UI-preview evidence.
- OS notification permissions including Android exact-alarm access, real lock-screen delivery, Focus/Doze, process termination and interrupted audio.
- Dark appearance, large system text, safe areas, keyboard and gestures on actual supported devices.
- Native document picker/share sheet and SQLite recovery on hardware.
- No App Store or Google Play submission has been made by this source-code change.

