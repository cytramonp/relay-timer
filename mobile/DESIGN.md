---
name: "CorpTimer mobile 0.2"
description: "A Meeting-first native workspace in CorpTimer's cream, charcoal and dark teal."
colors:
  bg: "#eeece5"
  field: "#f6f4ee"
  ink: "#20211e"
  muted: "#62635e"
  line: "#bbbcb4"
  red: "#b82933"
  teal: "#17676b"
  soft: "#d6e5e2"
  clock: "#061a1e"
  cream: "#f5f2e9"
  salmon: "#ff9b90"
  bright: "#64c9c4"
  panel: "#f6f4ee"
  clock-muted: "#a8c2c1"
  clock-track: "#29464b"
  clock-line: "#355157"
  on-signal: "#112e31"
  on-teal: "#f5f2e9"
  success: "#246841"
  danger-text: "#8e2925"
  dark-bg: "#182225"
  dark-field: "#233235"
  dark-ink: "#f5f2e9"
  dark-muted: "#b8c5c2"
  dark-line: "#526663"
  dark-red: "#ff9b90"
  dark-teal: "#83d4ce"
  dark-on-teal: "#112e31"
  dark-soft: "#28494a"
  dark-panel: "#1c3033"
  dark-success: "#9ed8ba"
  dark-danger-text: "#ffb1a5"
  action-cream-ink: "#132c30"
  action-danger-ink: "#431612"
typography:
  display:
    fontFamily: "Manrope"
    fontSize: "80px"
    fontWeight: 600
    lineHeight: "92px"
    letterSpacing: "-2px"
  display-focus:
    fontFamily: "Manrope"
    fontSize: "128px"
    fontWeight: 600
    lineHeight: "150px"
    letterSpacing: "-2px"
  headline:
    fontFamily: "Cantata"
    fontSize: "28px"
  title:
    fontFamily: "Cantata"
    fontSize: "25px"
    lineHeight: "34px"
  body:
    fontFamily: "System"
    fontSize: "16px"
    lineHeight: "24px"
  label:
    fontFamily: "System"
    fontSize: "15px"
    fontWeight: 600
  clock-label:
    fontFamily: "Manrope"
    fontSize: "12px"
rounded:
  field: "6px"
  transport: "10px"
  control: "12px"
  stage: "16px"
spacing:
  compact: "8px"
  row: "10px"
  stage-gap: "14px"
  gap: "16px"
  page: "18px"
  stage-padding: "20px"
  section-gap: "24px"
  columns: "26px"
  page-bottom: "42px"
components:
  action-outline:
    backgroundColor: "transparent"
    textColor: "{colors.teal}"
    rounded: "{rounded.control}"
    padding: "12px 17px"
    typography: "{typography.label}"
  action-primary:
    backgroundColor: "{colors.teal}"
    textColor: "{colors.bg}"
    rounded: "{rounded.control}"
    padding: "12px 17px"
    typography: "{typography.label}"
  action-cream:
    backgroundColor: "{colors.cream}"
    textColor: "{colors.action-cream-ink}"
    rounded: "{rounded.control}"
    padding: "12px 17px"
  action-danger:
    backgroundColor: "{colors.salmon}"
    textColor: "{colors.action-danger-ink}"
    rounded: "{rounded.control}"
    padding: "12px 17px"
  field:
    backgroundColor: "{colors.field}"
    textColor: "{colors.ink}"
    rounded: "{rounded.field}"
    padding: "12px"
  meeting-next:
    backgroundColor: "{colors.cream}"
    textColor: "{colors.on-signal}"
    rounded: "{rounded.transport}"
    padding: "0px 16px"
  meeting-stage:
    backgroundColor: "{colors.clock}"
    textColor: "{colors.cream}"
    rounded: "{rounded.stage}"
    padding: "20px"
  agenda-current:
    backgroundColor: "{colors.soft}"
    textColor: "{colors.ink}"
    rounded: "{rounded.transport}"
    height: "100px"
  timeline-current:
    backgroundColor: "{colors.teal}"
    textColor: "{colors.on-teal}"
    rounded: "5px"
    height: "48px"
---

# Design System: CorpTimer mobile 0.2

## Overview

**Creative North Star: "The meeting workbench"**

CorpTimer's native workspace carries the website's cream paper, charcoal ink, upright serif headings, original glasses and fine rules into a working meeting timer. A solid dark-teal clock anchors the interface. Clear names, tabular time and restrained color make the current turn, the next person's available budget and the remaining speakers easy to read together.

This documents the built Meeting-first (0.2.0) system and replaces the catalog-first (0.1) mobile documentation. The website's `../DESIGN.md` remains separate. Direction comes from `PRODUCT.md` and `SURFACE.md`; implementation truth comes from `src/theme.tsx`, `src/components/{meeting-clock,meeting-timeline,agenda-row,ui}.tsx`, `src/screens/meeting.tsx`, `src/app/(tabs)/_layout.tsx` and `modules/corptimer-overlay`. Dimensions below are React Native logical units, represented as `px` only in portable frontmatter and HTML previews. They are not screenshot pixel measurements.

Native evidence is the repository-root `.impeccable/review/mobile-redesign/android/` packet (17 PNGs and 2 reorder MP4s). Final Android versionCode (4), source `1357cede23099a952b3910550c19c8e00de93f1c`, passed phone/tablet launch, vertical scroll through timeline handles, an actual horizontal boundary edit, drag reorder, early handoff and background overlay Next/Pause/Undo/Close in run `40805997754`. The original review returned **fix** for selected timeline text. `android-verdict.md` resolves that sole correction at approximately (8.41:1) and records **ship** for the Android emulator fix scope. This is not a new whole-surface review, physical-device approval or store approval. No native HTML/CSS detector ran.

The final APK, native capture ZIP and provenance JSON are retained in the [Android beta 4 prerelease](https://github.com/cytramonp/relay-timer/releases/tag/mobile-v0.2.0-beta.4), beyond temporary Actions artifact retention. This distribution does not establish a store release.

`VALIDATION.md` governs evidence limits. iOS native compilation and an iPhone simulator launch/reorder were observed; full iOS/iPad flow and the later contrast correction remain pending. Native Google private-library sync is unimplemented. The owner has no store developer accounts. Browser previews and the browser live-share check do not establish native authentication, hardware performance, background alerts or store availability.

**Key Characteristics:**

- A dominant clock with visible next budget, remaining count and proportional turn cells.
- Upright Cantata headings, Manrope clock figures and native system body text.
- Flat cream/charcoal surfaces, fine rules, teal utility actions and coral overtime/reset signals.
- Dedicated gesture handles, native navigation and switches, explicit timer-state words.
- Light by default; Dark and Use device are explicit preferences.

## Colors

Frontmatter extracts reused roles from `src/theme.tsx`. Unprefixed roles describe light appearance; `dark-*` entries override corresponding roles. Clock colors remain shared. Camel-case source names map to hyphenated portable names: `clockMuted` becomes `clock-muted`, `onTeal` becomes `on-teal`. Component mappings show light appearance and follow the runtime theme. Unused pastel primitives are omitted.

### Primary

**Working teal** identifies utility actions, selected timeline slots and duration handles. **Red ink** marks the wordmark and active navigation; dark appearance uses the shared salmon signal. Selected timeline text uses `onTeal`: cream in light appearance and dark `onSignal` ink in dark appearance. Both name and duration use it.

### Secondary

**Bright teal** shows completed/progress portions on the clock. **Salmon/coral** marks overtime and Reset. **Cream** supplies stable clock content and the main Start/Next transport. Clock-muted, clock-track and clock-line provide supporting text, tracks and outlines. Reports use separate success and danger-text roles on the page ground.

### Neutral

**Paper** is the light page ground; **field/panel** is a slightly brighter editable or pending-slot surface. Charcoal ink, muted ink and fine rules define hierarchy. Dark appearance changes page roles to charcoal grounds and light text. Soft teal highlights current agenda rows, selected navigation and notices.

**The Foreground Follows Its Surface Rule.** Selected teal cells use `onTeal`; the dark clock uses cream. Generic Action primary buttons currently use the page-ground foreground, while Meeting transport uses `onSignal` explicitly.

**The State Has Words Rule.** Keep READY, NOW, PAUSED, OVER TIME or COMPLETE, next-budget language, remaining counts and agenda state labels alongside color. The red lens sector of the original glasses remains identity artwork.

## Typography

**Display Font:** bundled Manrope, loaded as `Manrope`.
**Heading Font:** bundled Cantata One, loaded as `Cantata`.
**Body Font:** platform system font. The native Android overlay uses system serif and sans-serif-medium instead of the bundled families.

The upright heading/figure pairing gives the workspace an editorial character while time stays scannable. Root navigation waits for font readiness or a font error before mounting; Android captures show the intended bundled fonts.

- **Clock display:** frontmatter display role, one line with size-to-fit and tabular numerals. Focus uses display-focus. Overtime changes digits to salmon; completion displays elapsed time.
- **Meeting title:** headline role, a plain editable title with minimum height (48). Preserve custom saved names.
- **Section title:** title role; general Heading uses its declared line height. Current-speaker text uses Cantata at (25), line height (36); focus uses (34)/(46). Timeline title uses (21).
- **Body:** body role. Next-speaker text uses Manrope at (16); budget explanation uses system text at (13), line height (20).
- **Labels:** general actions and field labels use label. Clock status uses clock-label. Secondary transport uses Manrope at (13), weight (600); tabs use system text at (13), weight (600).
- **Dense timeline/agenda text:** timeline names use Manrope at (11), durations (10); agenda names/planned durations use Manrope at (15), supporting state/budget text (11). Keep accessible labels and adjustment actions. This compact scale is not a general body-text scale.

**The Clock Keeps Its Place Rule.** Use tabular numerals for clocks and plan/available values. Keep main-clock one-line fitting so its width does not displace controls.

## Layout

Meeting opens directly. The ready starter has Welcome at (2:00) followed by seven named participants. Title/share and Templates/New meeting rows precede the clock. Current time, next budget, remaining count, progress, proportional cells and transport form the first working view. Timeline and Run of show continue below. Eight cells describe the starter, not a fixed maximum; cells come from the agenda.

The Meeting scroll container uses page padding (18), bottom padding (42), section gaps (24), full width and a centered maximum width (1200). Below window width (900), clock/timeline and agenda stack with a rule between them. At (900) or more they take equal columns with gap (26). For later items, private notes and further actions continue below. This breakpoint reads window width; it is not a claim about every tablet model.

Run-of-show rows have fixed height (100), fine bottom rules, dedicated handles, editable names, state, planned/used/available time and menus. Current rows receive soft teal and rounded corners. Keep plan and available values separate. Timeline width is at least its measured container and otherwise `min(1000, agenda.length × 77)`, with horizontal scrolling. Its plan row is (48) high and actual row (18); segments are proportional to duration.

Secondary screens use shared Page padding (20), bottom padding (48), gaps (20) and centered maximum width (850). Wrapping action rows use gaps (10); field wrappers grow from a (140) basis. These remain distinct from Meeting's container scale.

Expo Router supplies **Meeting, Timers, Library, History, Settings**. Library's internal route is `programs` and screen title is “My programs”; “Programs” is not the tab label. Android moves tabs to a left rail at window width (768), with width/minimum/maximum all (156). Other cases use bottom tabs. Active navigation is red on soft teal; inactive items are muted. Headers share the page ground without shadows. Original glasses appear at (30 × 30) beside the Cantata wordmark.

Safe-area-aware navigation wraps the workspace. Theme roles map navigation, system bars and background to the chosen appearance. Current Android dark/large-text captures show readable system chrome, superseding the historical (0.1) defect; this does not prove every OS/device configuration. The general touch target is (48), but source dimensions are specific: main transport (52) high, pause (58) wide, reorder handle (40 × 56), menu trigger (40 × 48), inline name minimum height (44). Do not claim all controls are universally (48 × 48).

## Elevation & Depth

Depth comes from page/field/soft tones, thin borders and the solid clock stage. No custom card shadows are defined. Native modals, menus, alerts and switches keep platform presentation. Dragged rows rise through z-order and a slight scale change, without decorative shadows. Android's floating timer is an actual permission-based window above other apps, with a dark fill and fine outline.

**The Flat Workbench Rule.** Use rules and tonal changes for hierarchy. Preserve native interruption and editing presentation instead of adding decorative floating cards.

## Shapes

The clock uses stage corners. Focus removes the radius and increases padding to (28), gap to (24). Generic actions use control corners; Meeting transport/current agenda rows use transport corners. Fields retain smaller field corners. Timeline plan cells use (5) corners and actual track (4); the boundary grip is a line with a circular center. Ordinary agenda rows remain open and ruled. Activity thumbnails keep their existing crops and cream grounds in dark appearance.

## Components

### Meeting clock and transport

A complete working instrument on one dark ground. The stage uses padding (20), gap (14), explicit status, current name, main clock, a (9)-high progress track and a (7)-high proportional cell strip with gaps (3). Completed cells fill bright teal; the current cell fills with turn progress. Next name/budget and remaining count follow immediately.

Start becomes Next speaker, Finish meeting or New meeting as state requires. Cream primary transport is at least (52) high with horizontal padding (16) and an arrow. Pause/Resume sits beside it with a clock-line outline. Undo, +1 min and salmon Reset occupy the second row at minimum height (48). Primary pressed opacity is (0.75), secondary (0.6), disabled (0.35). IconAction is at least (48 × 48) with (22)-size icons, accessible names and disabled state.

Next chooses the first unfinished participant. Spare time passes forward; overtime reduces later budgets. Undo restores the speaker without rewinding elapsed meeting time. Keep these mechanics visible through the budget copy and separate plan/available values.

### Timeline

The plan sits above actual time used, scale marks and a text legend. Completed plan cells use soft teal, current uses teal/onTeal, pending uses panel/ordinary text. The actual strip uses bright teal within plan, salmon over plan and teal for its active portion.

Boundary handles expose (48 × 60) areas with a (4 × 31) visible line and (12)-diameter circular grip. Clock cursor uses (48 × 48), with a red line/dot. Both horizontal gestures activate beyond horizontal movement (±6) and fail on vertical movement (±8), yielding vertical swipes to the page. Boundaries expose accessible ±15-second actions; cursor exposes ±30-second actions. Separate minus/plus actions correct the clock by a minute. Boundaries touching completed slots are disabled. The final Android run observed vertical scrolling through handles and an actual horizontal edit.

### Agenda rows and reorder

Dedicated handles own reorder. Active drag follows the pointer, scales to (1.02), and uses opacity (0.96). Neighbors move by one row with a spring of duration (400ms), damping ratio (1). Reduced-motion mode removes scale and spring. Edge autoscroll supports held drags. Stable slot IDs preserve the current speaker. Accessible increment/decrement and native Move up/Move down menu actions provide alternatives.

Names commit on native end-editing; web preview additionally commits on blur. Duration opens an editor. Native menus offer move, pin and remove, disabled where state disallows them. This describes source behavior, not a complete TalkBack, VoiceOver or keyboard audit.

### Actions, fields and native controls

Generic Action variants use a (1)-width border, minimum height (48), frontmatter padding, pressed opacity (0.7) and disabled (0.45). Outline is transparent/teal; primary teal/page-ground; cream and danger use dedicated foregrounds. These differ from Meeting transport's onSignal pairing.

Fields have persistent labels, fine borders, themed placeholders, minimum height (48), type size (17), padding (12). Meeting title and agenda names are intentionally plain inline editors. Private notes use a multiline field, minimum height (120), padding (14) and control corners. Soft-teal notices use an alert role and minimum-height (48) Dismiss action. Switches use `@expo/ui` Host/Switch with teal seed and minimum host height (48). Native confirmations use system alerts.

### Android floating timer and focus

The native foreground service requires overlay permission. Its window uses dark clock ground, cream content, muted supporting text, clock-line outline and radius (14dp). Wide/square/strip widths are (290)/(240)/(300dp). A labeled grip moves the window; Close ends floating. Name uses Android serif (18sp); clock uses sans-serif-medium (54sp), or (38sp) in strip mode. Strip hides the name. A (6dp) segmented track, next budget and Next, Pause/Resume, Undo, +1 min remain. Buttons have minimum height/width (48dp), dark-teal fill and (8dp) corners. Progress uses module-specific native teal (`rgb(87,193,189)`), rather than theme-selected app teal.

Final emulator verification observed controls above the launcher. Its overlay permission was granted before launch; that does not prove hardware consent, alarms, Doze, process-death recovery or uninterrupted background operation. iOS offers in-app focus; do not imply an iOS floating window or Live Activity.

### Identity and secondary surfaces

Keep original glasses and half-comic illustrations. Other timers remain in their own tab, with illustrated catalog rows. Templates, saved copies and reports share the paper/type/teal/rule vocabulary. Reports distinguish original plan from actual results; private notes and For later items stay off the explicit public projection.

All twelve raster origins are embedded. The provenance scan and decoded RGBA comparison record unchanged pixels. `assets/PROVENANCE.md` identifies glasses, approved atlas crops, fonts/licenses and synthesized audio. Preserve origins when regenerating assets. This pass creates no new imagery.

## Do's and Don'ts

### Do:

- **Do** preserve original glasses, approved illustrations, upright Cantata headings and dark-teal clock.
- **Do** use current theme roles, including onTeal for both selected timeline text rows.
- **Do** keep current time, next budget, remaining count and segmented progress readable together.
- **Do** preserve dedicated handles, accessible alternatives, stable speaker IDs and page scrolling.
- **Do** retain Meeting, Timers, Library, History and Settings labels and explicit appearance preferences.
- **Do** consult VALIDATION.md for current native, network, hardware and release evidence boundaries.

### Don't:

- **Don't** restore catalog-first entry or rename the Meeting starter; preserve custom saved names.
- **Don't** use cream text on the dark theme's light-teal selected timeline surface.
- **Don't** turn ruled rows into shadowed cards or replace native navigation, switches and menus with decorative chrome.
- **Don't** treat sidecar HTML samples as native rendering or gesture proof.
- **Don't** equate the Android correction's ship verdict with whole-iOS, physical-device or store approval.
- **Don't** imply native Google private sync, iOS floating windows, Live Activities or guaranteed background alerts.
