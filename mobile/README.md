# CorpTimer mobile

Native React Native / Expo SDK 58 application for iPhone, iPad and Android, in the same repository as corptimer.com. Version 0.4.0 adds 27 specialty profiles, favorites/start timer, stage editing and exports, company branding and Trial/Free/Pro access. It preserves the one-hour Meeting, rotary controls, gestures and in-app support form from 0.3. See [PARITY-0.4.md](PARITY-0.4.md) and [store/GOOGLE-PLAY.md](store/GOOGLE-PLAY.md) for implementation and activation boundaries.

## Run

Requires Node 24 and npm. From this directory:

```sh
npm ci
npm start
```

Use a native development or standalone build for full functionality: the Android floating timer includes a local Expo module and is unavailable in Expo Go. For the browser UI preview:

```sh
npm run export:web
node scripts/serve-preview.cjs
```

Open http://127.0.0.1:4176. A browser preview checks UI and portable logic; it does not establish native notification, audio, gesture or device behavior.

## Included

- Nine timer modes: Meeting, Boxing, Fitness, Pomodoro, Classroom, Chess, Stopwatch, Countdown, New Year.
- 27 themed specialty profiles, independent clocks, staged sequences/turns/laps, native guides, favorites and chosen starting timer. Custom stages/setups, JSON/CSV, kitchen serving planner, speech signals, breathing/brushing guides and optional local company logo.
- Server-backed full trial until both 10 days and 10 starts, then Free two starts per UTC day; Pro access and customization gates. Starting a new timer needs a connection; existing primary runs continue offline.
- Native Google Play Billing 9.1.0 and current Credential Manager/Firebase account linking adapters, prepared behind disabled configuration until publisher console setup and real store tests. No payment can be taken in this preparation build.
- Meeting opens with Welcome (5 minutes), five named participants (11 minutes each), current/next budgets, six segmented cells, Next, Pause, Undo and +1 minute. The total is 60 minutes. Drag agenda handles to reorder while preserving the current speaker's identity.
- Rotate a duration dial clockwise/counterclockwise, use accessible +/- actions or type a number. Mechanical click sounds can be muted independently of haptics.
- Support & feedback stays inside the app, preserves unsent drafts and sends through Web3Forms without bundling the recipient address. See FEEDBACK.md for the verified transport boundary and provider setup.
- A proportional timeline with draggable boundaries, clock correction, equal times, pinned durations, automatic split and keep proportions; manual and automatic handoff.
- Website starter templates, editable saved plans, duplicate/color/icon controls, private follow-ups and notes, original-plan versus actual reports, CSV/copy/print.
- Explicit live viewer/control sharing through the existing Firebase protocol; QR links, heartbeat, expiry and revocation. Hosting requires the app to stay active. End-to-end network validation is pending.
- Android floating timer with special-permission opt-in, draggable native window, foreground notification and Next/Pause/Undo/Extend controls. Device verification is tracked separately. iOS has an in-app focus view.
- Workout presets, sets, custom rounds, preparation/cooldown, automatic or manual transitions.
- Pomodoro long-break frequency and optional final break; classroom visual-only mode.
- Two-sided chess clock with increment, per-turn delay, selectable first player and flag stopping.
- Stopwatch laps; time-zone-aware New Year target; quick countdowns.
- Named local programs, search, deletion, JSON import/export, web timer and meeting-plan import.
- Last 100 session results with planned/actual durations and CSV export; spreadsheet formula protection.
- SQLite-backed local storage on native, browser storage in the UI preview, timestamp-based session recovery.
- Bundled gong/bell/beep, in-app volume, optional spoken cues and haptics, screen wake lock.
- Permission-based local notification scheduling, cancellation/replacement after pause, handoff, extension and reset.
- Light/dark palettes, system font scaling, safe-area-aware navigation and English interface.
- Original CorpTimer glasses, derived illustrations, fonts and licenses.

Programs, notes and reports are local by default. Creating a live link explicitly uploads only the meeting title, public agenda, timing state and an anonymous host identity to Firebase. Anyone holding the viewer link can read that projection; a separate capability link grants timer control. Notes, follow-up owners and reports are excluded. Private-library synchronization and native Google sign-in are not implemented. Website plans can be imported without importing active runs, reports or private notes.

## Verification

```sh
npm run typecheck
npm run lint
npm test
npm run export:web
npm run export:native
npx expo-doctor
```

See [VALIDATION.md](VALIDATION.md) for what was actually checked and what remains unverified. The root website keeps its own test/check commands and deployment boundary.

[store/data-inventory.md](store/data-inventory.md) records the implemented local/cloud data paths for preparing accurate privacy disclosures. Store metadata is a draft, not a completed submission.

## Android installation build

The previous tested baseline is [Android 0.3.0 beta, build5](https://github.com/cytramonp/relay-timer/releases/tag/mobile-v0.3.0-beta.1). The 0.4 release evidence and download status are recorded in VALIDATION.md. Do not infer a new release from the version number alone.

The repository's **Android APK and Google Play bundle** workflow builds standalone arm64/x86-64 artifacts with embedded JavaScript and API36 emulator verification. Download `corptimer-android-test-apk` from a successful run, unzip and install it; no Metro server is needed. The beta APK retains its historical debug certificate for update compatibility. Google Play requires the separately signed AAB. An unsigned CI bundle may be signed locally with `scripts/sign-play-bundle.ps1`, keeping the upload key on the owner's computer. See the Play preparation document before any upload.

This uses the generated development signing key. It is an internal test build, not a Play Store release. Do not treat its signing identity as the permanent production identity. Native projects are generated by `expo prebuild`; never commit generated `android/` or `ios/` folders or signing material.

## Signed distribution

Build profiles are in `eas.json`. With the owner's Expo account, link an EAS project using `npx eas-cli@latest init`, then build:

```sh
npx eas-cli@latest build --platform android --profile preview
npx eas-cli@latest build --platform ios --profile simulator
npx eas-cli@latest build --platform all --profile production
```

Cloud build resources have plan limits. Production distribution needs owner-controlled signing credentials and the Apple/Google developer accounts. `com.corptimer.app` is the configured identifier; confirm availability and ownership before enrolling it. This source tree contains no EAS project ID, Apple team ID, signing keys or service account credentials.

## System behavior and next release gates

- Native compilation, real-device QA, notification permission denied/revoked, screen lock, Focus/Doze, Bluetooth audio, interrupted audio, large text, phone/tablet layout and gestures must be checked before store submission.
- Background notification sounds use system volume. The app's volume slider only affects foreground audio. Android notification channels can be controlled or silenced by the device owner.
- Schedule at most 48 upcoming alerts (warnings included) to stay below the iOS pending-notification ceiling. Programs with more alerts require foreground replenishment; uninterrupted background cues for arbitrarily long programs are not guaranteed.
- Speech and final-countdown beeps run in the foreground. Local notifications signal scheduled phase boundaries and work warnings.
- No AlarmKit, Live Activity, Apple Watch or arbitrary iOS system overlay is implemented. No silent background audio workaround is used.
- Website Google/Firebase private-library sync and Sign in with Apple require a separate identity integration. The available Firebase CLI session is unauthenticated; no OAuth clients, signing configuration or provider permissions have been changed.
- There is no payment, advertising, analytics or remote push service in this version.

## Assets

Run `npm run assets` to derive icons/illustration crops from approved website artwork and synthesize the three short PCM cues. Python requires Pillow. The icon uses Sharp. See `assets/PROVENANCE.md` and the bundled font licenses. Images and sounds are bundled so the app can work without downloading resources.
