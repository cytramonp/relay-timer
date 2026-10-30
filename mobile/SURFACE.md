# Mobile timer workspace

## 0.4 extension

The 0.4 Android candidate retains this visual system and adds 27 specialty timer boards, favorite/start controls, collapsed stage editors, JSON/CSV tools, optional local branding, a compact plan status and a dedicated Pro screen. Dark teal clock panels use the existing cream/teal/coral tokens. Trial/Free/Pro status is server-backed; Google account/purchase controls are visibly disabled until the publisher configures them. Private native library sync and specialty background alarms are not implied. Current implementation and verification boundaries are in `PARITY-0.4.md`, `VALIDATION.md` and `store/GOOGLE-PLAY.md`; the earlier 0.3 review below remains historical.

## Scope and visitor mode
Operate. Native iOS/iPadOS and Android meeting workspace, with other timers, editors, templates, reports, settings and support. This (0.3.0) refinement preserves the established Meeting-first surface and the website's identity.

## Audience and task
Facilitate a meeting: Welcome first, then named participants; change the running order and budgets, see the remaining speakers, park tangents privately and export an original-plan/actual report. Save reusable templates. Other timers remain available in their own tab.

## Direction
Use the established CorpTimer cream/charcoal/red/teal palette, original glasses, upright serif headings, tabular digits and fine rules. Light is the default; Dark and Use device are explicit choices. Use native stack/tab navigation, sheets and switches; Reanimated/Gesture Handler for dedicated drag handles. No new visual identity exercise.

## First viewport
Meeting opens directly: plain editable Meeting title, Welcome at 5:00 followed by Alex, Morgan, Jordan, Sam and Taylor at 11:00 each, for a 60-minute total. The next person's available budget, remaining count, turn progress bar, six proportional segmented cells, Start/Next, Pause, Undo and +1 minute stay visible together. Cells follow the actual agenda; preserve custom saved names and durations. The status/focus row reserves at least 48 logical units in normal flow; padded name and clock line boxes retain room for native glyphs. The timeline and run of show continue below. Tablets use available width without widening the Android navigation rail into the work area.

## Signature interaction
Dragging a dedicated handle changes the running order while the current speaker retains their stable ID. Next chooses the first unfinished participant; spare time passes forward, overtime reduces later budgets, and Undo restores the speaker without rewinding elapsed meeting time. Timeline boundaries and clock cursor are draggable and also expose accessible actions.

A shared 264-unit circular duration dial uses 60 ticks: clockwise adds and counterclockwise subtracts one displayed minute or second per detent. Center typing, plus/minus and adjustable accessibility actions provide alternatives. Click mute persists; tactile feedback follows global Haptics. Generic agenda input retains decimal draft strings until Done. Final phone/tablet emulator QA verified empty and `2.` intermediates, `2.5` minutes saved as 150 seconds and shown as `2:30`, and the full 120-minute total readout in its nonshrinking control. The reordered phone viewport scrolls its 60-minute total above the header; dedicated long-total captures show the complete 120-minute number, and tablet evidence also shows 60.

Settings offers Support & feedback with three categories, a message and optional reply email. Local AsyncStorage restores unsent drafts; validation, sending, error and success states are explicit. An owner-approved Web3Forms public alias routes only those fields plus app version/platform and provider routing fields; no recipient email is embedded, and agendas/notes/history are excluded.

## Quality bar

Readable current clock and next budget; visible segmented cells and number remaining; 48-point control targets; clear running/paused/complete words; reliable dedicated-handle reorder without hijacking page scroll; reduced-motion support; safe areas, keyboard access, large text and correct system chrome in light/dark appearance. Use actual native phone/tablet evidence per OS. No approved comp exists; the user's website palette and concrete functionality requirements are the authority.

## Constraints and unresolved verification
Code-led refinement of the pinned brand, without an approved comp. Corrected Android build and expanded native QA run `40829694438` succeeded for runtime source `7927e48ffeb28880831230cf053920de48e2bc8a`. The repository-root `.impeccable/review/meeting-dial-feedback/android/` matrix now contains 23 final PNGs and 2 reorder MP4s from that exact binary, including phone/tablet long-total captures. Android versionCode is 5, APK SHA256 is `E2CD7B77A5F76B435D756AF999809B5AF90E5152FE0E4E3B5087C41CB786A568`, and the existing signer was confirmed. Reviewer disposition is **ship**: all three scored corrections are resolved at Android emulator beta correction scope only.

Initial (0.3.0) run `40826232688` passed its original 21-PNG/2-MP4 matrix before the decimal-draft, total-readout and documentation review corrections. Its captures have been superseded by the corrected binary's matrix. The older (0.2.0) ship verdict remains historical and applies only to its own correction.

One browser-preview feedback delivery was verified in the owner's Gmail; adjacent `web-feedback-sent.png` is browser transport proof only. Native delivery, current iOS/iPad flows, physical sound/haptic feel and physical-device performance are unverified. Native Google private-library sync is unimplemented pending provider configuration. Android floating windows require explicit special permission; iOS has an in-app focus view. Browser preview/live tests do not establish native authentication, rendering or background alarms. No detector runs against native code; sidecar HTML specimens are reference previews only. See VALIDATION.md for recorded binary provenance and review scope.
