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

## Native evidence and review update

- Android run [40446595327](https://github.com/cytramonp/relay-timer/actions/runs/40446595327), source `ddfcc48`, compiled a standalone arm64/x86_64 release-mode test APK and passed emulator launch/captures for phone and tablet. Light/dark and font scale 1.3 captures are available. This establishes basic launch and ready-state UI, not lock-screen alarm delivery or physical-device behavior.
- Its APK SHA-256 is `0D9ABD8815280AF342B350D23343991B9A7EC2F035D3B7F5A0F7316E6CC4EAD7`. It is an internal test build signed with the generated development identity.
- Android visual review returned **fix**: low-contrast dark system icons, default blue selected rail surface and oversized tablet navigation. Source `ca649b7` addresses these with the navigation theme, explicit system-bar styles and a 156 dp tablet rail. Native recapture and scoring of these corrections are pending.
- iOS native compilation succeeded on macOS, and the initial simulator catalog rendered on iPhone and iPad. The first deep-link captures were blocked by the OS confirmation and are not accepted as timer/editor/history evidence. A native interaction flow is present; complete iOS visual and interaction approval remains pending.
- The owner confirmed that Apple Developer and Google Play developer accounts have not been created. No store enrollment, signing-account setup or store publication was performed.
