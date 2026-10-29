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

The 0.2.0 tree reports 13 findings (8 high, 5 low), involving Expo tooling, node-forge, zod and Firebase's transitive Node gRPC dependencies. Automatic fixes propose incompatible Expo/Firebase major downgrades; no forced downgrade or unverified override is applied. The app does not enable OTA code signing or expose development tooling. These findings remain an assessment/update gate before production release; no clean dependency-audit claim is made.

Expo Doctor currently passes 19/20 checks. Fourteen installed SDK 58 packages are behind newly available compatible patch versions. The lockfile makes the tested build reproducible; patch alignment and another native build remain required before a production release.

## Meeting redesign 0.2.0 — current checks

- Source `8db6413` replaces catalog-first entry with Meeting, Welcome (2 minutes) and seven named participants. It adds stable-ID drag reorder, cumulative next-speaker budgets, segmented progress, a resizable timeline, templates, private follow-ups, original-plan reports, explicit anonymous live sharing and an Android overlay module.
- TypeScript and lint pass. All 34 mobile tests pass. GitHub run `40798939793` passes typecheck, lint, tests and both browser/native JavaScript exports. These do not establish a compiled native app or a native UI pass.
- Browser checks on the production export establish early handoff, pause/Undo, timer persistence after reload, private follow-up creation and report readback. Browser-specific text-field blur persistence was corrected separately from the initial native build.
- Android run `40798934523` successfully compiled the standalone release-mode arm64/x86_64 test APK from source `8db6413f4a40d3204c81d81f24eed9a27ccd61d6`. File `CorpTimer-0.2.0-beta.apk` is 73,707,527 bytes, SHA-256 `4A7171FEE3BCFEFFA88975E35709AEF410F6B76319BFDCDF57FE22678473D6DA`. It uses the generated development signing identity; this is not a Play Store release.
- Verification run [40801486345](https://github.com/cytramonp/relay-timer/actions/runs/40801486345) downloaded that exact APK and passed on Android API35 phone and tablet: launch, actual recorded Alex/Morgan drag reorder, early Welcome handoff to reordered Morgan, and floating-window Next/Pause/Undo above the launcher. It captured ready/active/reordered views, floating mode, dark appearance with font scale1.3, tablet landscape and other-timer/editor/History regression views. This does not establish physical-device performance, native Firebase authentication, notification delivery or real-device permission consent (the disposable emulator granted overlay permission before launch).
- The first UI run stopped at an assertion looking for the offscreen PAUSED label, while Resume confirmed the actual paused state. A second stopped because the default accessibility dump omitted a non-focusable floating window that was visible in the screenshot. The final run corrected the assertion and retrieved all native windows; neither earlier harness failure is treated as an app crash or a successful whole flow.
- A fresh Android visual review is pending. iPhone/iPad native compilation and Meeting-first Maestro flow are separately running in `40799413913`; no redesigned iOS native pass is claimed here.
- After explicit owner approval, a synthetic TEST QA meeting was shared through the existing Firebase rules. The public viewer showed Welcome, updated to Alex after native-app-source Next/Pause actions in the browser export, and excluded the private follow-up. Stop sharing completed; reloading the viewer showed that the link was unavailable. This verifies the browser host-to-Firebase-to-viewer/revoke path, not native authentication or remote co-host commands. The separate private Google identity/library synchronization is unimplemented, and the Firebase administration CLI is unauthenticated.
- The section below is historical evidence for 0.1.0 and does not approve the redesigned interface.

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
