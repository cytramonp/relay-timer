# Mobile timer workspace

## Scope and visitor mode
Operate. Native iOS/iPadOS and Android meeting workspace, with other timers, editors, templates, reports and settings. The owner rejected the first catalog-first beta; this is a replacement of that mobile surface while preserving the website's identity.

## Audience and task
Facilitate a meeting: Welcome first, then named participants; change the running order and budgets, see the remaining speakers, park tangents privately and export an original-plan/actual report. Save reusable templates. Other timers remain available in their own tab.

## Direction
Use the established CorpTimer cream/charcoal/red/teal palette, original glasses, upright serif headings, tabular digits and fine rules. Light is the default; Dark and Use device are explicit choices. Use native stack/tab navigation, sheets and switches; Reanimated/Gesture Handler for dedicated drag handles. No new visual identity exercise.

## First viewport
Meeting opens directly: plain editable Meeting title, Welcome at 2:00, next person's available budget and number remaining, a turn progress bar and eight proportional segmented cells, Start/Next, Pause, Undo and +1 minute. The timeline and run of show continue below. Tablets use available width without widening the Android navigation rail into the work area.

## Signature interaction
Dragging a dedicated handle changes the running order while the current speaker retains their stable ID. Next chooses the first unfinished participant; spare time passes forward, overtime reduces later budgets, and Undo restores the speaker without rewinding elapsed meeting time. Timeline boundaries and clock cursor are draggable and also expose accessible actions.

## Quality bar

Readable current clock and next budget; visible segmented cells and number remaining; 48-point control targets; clear running/paused/complete words; reliable dedicated-handle reorder without hijacking page scroll; reduced-motion support; safe areas, keyboard access, large text and correct system chrome in light/dark appearance. Use actual native phone/tablet evidence per OS. No approved comp exists; the user's website palette and concrete functionality requirements are the authority.

## Constraints and unresolved verification
Code-led adaptation of the pinned brand. The current immediate deliverable is an installable Android beta APK; iOS is separately compiling/testing. Native Google private-library sync is unimplemented pending provider configuration. Android floating windows require explicit special permission; iOS has an in-app focus view. Browser preview/live tests do not establish native authentication, rendering, physical-device performance or background alarms. No detector runs against native code. See VALIDATION.md for exact binary provenance and review scope.
