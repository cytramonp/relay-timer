---
name: "Relay Timer (working title)"
description: "A light facilitator workspace with a dark shared timer."
colors:
  bg: "#edeeeb"
  panel: "#fff"
  fg: "#1a1b17"
  muted: "#64665e"
  line: "#dedfd8"
  accent: "#20221b"
  soft: "#f0f1e9"
  signal: "#e5f65b"
  signal-hover: "#d5e64a"
  focus: "#687c16"
  field: "#f7f8f3"
  hover: "#e4e7dc"
  ok: "#246841"
  warn: "#936000"
  bad: "#ae2924"
  up: "#d9dcd0"
  ov-bg: "#181a15"
  ov-fg: "#f8f9f1"
  ov-muted: "#b1b4a5"
  ov-line: "#3d4035"
  ov-ok: "#e5f65b"
  ov-warn: "#f5cd6e"
  ov-bad: "#ffa294"
  ov-past: "#9aa36c"
  ov-up: "#414536"
  audience-bg: "#151712"
  audience-fg: "#f7f8f0"
typography:
  display:
    fontFamily: "ui-monospace, 'Cascadia Mono', Consolas, monospace"
    fontSize: "clamp(88px,9vw,132px)"
    fontWeight: 600
    lineHeight: 1.05
    letterSpacing: "-.04em"
  headline:
    fontFamily: "'Manrope', Arial, sans-serif"
    fontSize: "clamp(34px,3.7vw,52px)"
    fontWeight: 650
    lineHeight: 1.15
    letterSpacing: "-.04em"
  title:
    fontFamily: "'Manrope', Arial, sans-serif"
    fontSize: "18px"
    fontWeight: 650
    lineHeight: 1.4
    letterSpacing: "-.025em"
  speaker:
    fontFamily: "'Manrope', Arial, sans-serif"
    fontSize: "34px"
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: "-.03em"
  body:
    fontFamily: "'Manrope', Arial, sans-serif"
    fontSize: "14px"
    fontWeight: 450
    lineHeight: 1.45
  label:
    fontFamily: "'Manrope', Arial, sans-serif"
    fontSize: "12px"
  button:
    fontFamily: "'Manrope', Arial, sans-serif"
    fontSize: "13px"
    fontWeight: 600
    lineHeight: 1.45
  live-display:
    fontFamily: "ui-monospace, 'Cascadia Mono', Consolas, monospace"
    fontSize: "clamp(74px,13vw,200px)"
    fontWeight: 550
    lineHeight: 1.2
    letterSpacing: "-.04em"
rounded:
  field: "8px"
  input: "10px"
  surface: "16px"
  pill: "999px"
spacing:
  tight: "8px"
  stack: "18px"
  column-gap: "22px"
  panel-inset: "24px"
  workspace-inset: "28px"
components:
  button-primary:
    backgroundColor: "{colors.signal}"
    textColor: "{colors.accent}"
    typography: "{typography.button}"
    rounded: "{rounded.pill}"
    padding: "8px 13px"
    height: "40px"
  button-primary-hover:
    backgroundColor: "{colors.signal-hover}"
  button-secondary:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.fg}"
    typography: "{typography.button}"
    rounded: "{rounded.pill}"
    padding: "8px 13px"
    height: "40px"
  button-share:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.panel}"
    typography: "{typography.button}"
    rounded: "{rounded.pill}"
    padding: "9px 16px"
    height: "44px"
  agenda-input:
    backgroundColor: "{colors.field}"
    textColor: "{colors.fg}"
    rounded: "{rounded.field}"
    padding: "6px 8px"
    height: "40px"
  navigation:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.fg}"
    rounded: "{rounded.pill}"
    padding: "8px 12px 8px 22px"
    height: "68px"
  status-chip:
    backgroundColor: "color-mix(in srgb, #246841 18%, transparent)"
    textColor: "{colors.ok}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "0 4px"
  panel:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.fg}"
    rounded: "{rounded.surface}"
    padding: "{spacing.panel-inset}"
  stage:
    backgroundColor: "{colors.ov-bg}"
    textColor: "{colors.ov-fg}"
    rounded: "{rounded.surface}"
    padding: "28px 30px 25px"
  dialog:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.fg}"
    rounded: "{rounded.surface}"
    padding: "34px"
  live-stage:
    backgroundColor: "{colors.audience-bg}"
    textColor: "{colors.audience-fg}"
---

# Design System: Relay Timer (working title)

## Overview

**Creative North Star: "Facilitator's broadcast / control desk" — extracted, provisional descriptive label.** This describes the implemented system in SURFACE.md; it is not an approved brand metaphor or final product name.

The user-confirmed direction pairs a light workspace with a dark timer and uses robot.com as its visual reference. Pale mineral ground, warm-black timing surfaces, acid-yellow actions, rounded flat panels and capsule controls give the working tool a soft industrial character. Self-hosted Manrope supplies geometric lettering without copying the reference's proprietary font or imagery.

This is an extraction of the final implementation: `docs/base.css` supplies mechanics, then `docs/workspace.css` supplies the effective appearance, including its later reference-driven overrides and final mobile agenda rule. `docs/index.html`, `docs/live.html` and `docs/live.js` define host, audience and controller surfaces. Tokens above are normative. The earlier cobalt system is superseded. There is no separate approved comp or quality-bar image.

**Key Characteristics:**

- Mineral light workspace and warm-black stage.
- Self-hosted Manrope with tabular system monospace for time.
- Acid-yellow primary actions and capsule navigation.
- Flat rounded panels separated by tone and space.
- Separate host workspace, audience display and remote controls.

## Colors

The palette combines low-chroma mineral and olive neutrals with a bright signal accent. Descriptive names below identify extracted roles.

### Primary

- **Acid signal** (`signal`): Start / next, Add item, CSV export, active live sharing, live countdown and progress. `signal-hover` supplies primary hover.
- **Warm ink** (`accent`): action text and the inactive Share live capsule. The primary button uses warm ink text over acid signal.
- **Olive focus** (`focus`): the visible keyboard outline; focus is not represented by the fill alone.

### Neutral

- **Mineral ground** (`bg`) and **white surface** (`panel`): page and enclosing utility panels.
- **Warm text** (`fg`) and **mineral muted** (`muted`): primary content and supporting copy.
- **Quiet rule** (`line`), **soft lane** (`soft`), **field chalk** (`field`) and **olive hover** (`hover`): separators, timeline ground, agenda fields and control hover.
- **Warm-black stage** (`ov-bg`), **stage ivory** (`ov-fg`), **stage sage** (`ov-muted`) and **stage rule** (`ov-line`): host timer and floating display.
- **Audience black** (`audience-bg`) and **audience ivory** (`audience-fg`): the full-page live surface.

Workspace timing states use `ok`, `warn`, `bad` and `up`. The dark timer uses its separate `ov-ok`, `ov-warn`, `ov-bad`, `ov-past` and `ov-up` states. These are semantic treatments, not extra brand accents. The planned timeline uses the implementation's olive tints; actual early / over segments retain their own status tints and text legend.

**The Stage Separation Rule.** Preserve the confirmed light host workspace and dark timer. The audience and controller share the full dark live surface.

**The Signal Rule.** Use acid signal for the implemented primary actions and live timing emphasis; preserve distinct warning and overrun states.

## Typography

**Display Font:** system monospace from `--f-num`, with Cascadia Mono and Consolas fallbacks.
**Body Font:** Manrope from the self-hosted variable font `docs/fonts/Manrope.ttf`, with Arial and sans-serif fallbacks.

Manrope's geometric, close-set headlines sit beside stable numeric timing. The variable font is declared for weights 200–800 with font-display swap. Timing, duration and report values retain tabular alignment.

### Hierarchy

- **Display:** the fluid host countdown recorded above; warning and overtime change its state color, pause reduces opacity.
- **Headline:** the unboxed meeting-name field, with a fluid desktop size and a 38px phone size.
- **Title:** section headings at weight 650; some intermediate-width timeline headings reduce to 16px.
- **Speaker:** the host stage name at weight 500; phones use 29px. The live speaker uses weight 550 and `clamp(30px,4vw,66px)`, becoming 34px on phones.
- **Body:** 14px workspace text at weight 450. Dialog body copy uses 13px with a 1.7 line height.
- **Label:** 12px metadata, timing hints, connection messages and report headers.
- **Button:** 13px at weight 600; primary host transport uses 15px, reducing to 14px on phones. Most mobile utilities use 12px.
- **Live display:** larger audience countdown at weight 550; up to 900px it uses `clamp(70px,13vw,130px)`, and up to 560px `clamp(64px,22vw,100px)`.

**The Numeric Alignment Rule.** Use the numeric stack and tabular figures for clocks, durations and timing comparisons.

## Layout

The centered host workspace caps at 1376px, with 28px horizontal insets, 35px top padding and a 28px section gap. The desktop working grid is `minmax(0,1.2fr) minmax(440px,1fr)` with a 22px gap. Columns stack panels 18px apart. The floating white header caps at 1392px, sits 16px below the viewport edge, and uses a capsule silhouette.

At 1150px, workspace insets become 24px, top padding 30px, grid gap 18px and panels 20px. At 900px the workspace caps at 760px and the working grid stacks. At 560px it uses 16px insets, 27px top padding and a 23px section gap; panels use 20px 15px. The header becomes a rounded two-row block with a three-column action row. The transport is a three-column grid: Start / next spans two columns beside Pause; Undo, Float and Reset form the second row.

The final phone agenda uses two lines per row: name across the top between drag and delete controls, minutes below on the left and Available / Used on the right. Desktop column labels hide there. Drag and delete targets are 36px wide and at least 44px tall. Keep names editable and timing values readable rather than squeezing desktop columns onto phones.

The live display caps at 1600px with a main timer and 220–310px agenda column, a 6vw gap and generous viewport-relative insets. At 900px the agenda narrows to 200px. At 560px it stacks below the timer with a 50px separation. The controller adds wrapping transport capsules beneath the same stage.

Share and report dialogs cap at 700px and 850px respectively, with viewport-bounded widths and a 90dvh scrolling limit. The share QR is 150px square beside the viewer link; on phones it centers above the link. Report tables scroll horizontally in their own wrapper. Floating timer mode retains its separate compact height adaptations at 169px and 79px.

## Elevation & Depth

The implemented workspace is flat: tonal contrast, white panels, generous gaps and the dark stage create hierarchy. Main panels and navigation have no ambient shadow. A moving agenda row alone uses the temporary drag shadow `0 6px 18px rgba(0,0,0,.18)`. Dialogs obscure the workspace with the dark olive backdrop `#12170f70`; the toast is a solid dark notice.

**The Flat Rest Rule.** Keep resting surfaces flat; reserve the existing shadow for drag feedback.

## Shapes

Capsules define buttons, desktop navigation, template selection and library search. Main panels, stage and dialogs share the soft surface radius in frontmatter. Agenda fields use the smaller field radius; general input and total-duration controls use the input radius. Most panels and dialogs have no border; fields use soft fills with subtle hover strokes. Thin rules remain in report rows, private parking, live agenda and separators.

Progress lanes have gently rounded, clipped ends; the host agenda-strip blocks have small 2px corners. Icons are compact inline stroke SVGs; the host wordmark uses a filled SVG with an acid cutout. Do not borrow robot photography, logos or proprietary type.

## Components

### Buttons

Primary controls are acid capsules with warm ink text. Secondary buttons are white with a quiet rule; quiet and text controls use transparent grounds. Share live starts as a warm-ink capsule and becomes acid when live. Reset and revocation use destructive text.

Normal controls have a 40px minimum height; header actions use 44px and host transport 48px (46px on phones). Hover changes background and color over .16s. Visible focus uses a 2px olive outline with a 4px offset. Disabled opacity is .38. Reduced-motion preference removes transitions.

### Inputs / Fields

Agenda names and minutes use soft chalk fill, a transparent 1px border and 8px corners; hover exposes a quiet olive stroke. The editable meeting title is unboxed. Library search is a soft capsule. Parking entry fields use slightly warmer soft fills, while existing parking items use unboxed fields with ruled rows. Numeric inputs preserve timing alignment.

### Navigation

The white capsule header holds the wordmark and utility actions. Its account capsule has a pale tint. On phones, the wordmark sits above the three main actions. Header help hides at intermediate widths; footer help remains accessible. The live header is unboxed on the full dark surface, with connection status and Full screen action; status wraps below on phones.

### Chips

Compact timing-result pills use semantic foregrounds over 18% color-mix tints and accompany actual usage text. The private parking count uses a pale round badge. Status color never replaces a label.

### Cards / Containers

White flat panels group agenda, timeline, private parking and settings. Settings use a native disclosure with a rotating plus icon and a two-column inner form. Dialogs reuse the surface radius with larger typography and insets. The library presents search and ruled saved-meeting rows. Private parking keeps its privacy note visible beneath the editor.

### Stage Timer

The host stage contains position, speaker, countdown, progress, proportional agenda strip and next speaker. Desktop minimum height is 375px, 345px at the intermediate breakpoint, 350px when stacked, and 320px on phones. Idle digits use stage ivory; running, warning and overrun use the respective stage states. Done uses the base stage-muted state. Floating mode reuses the dark display and adds compact controls.

### Planned / Actual Timeline

Separate planned and actual lanes retain draggable milestone boundaries and a correctable meeting-clock marker. Current and completed planned segments use olive tones; topic segments retain diagonal texture. Early and overrun usage retain separate treatments. Keep textual legend and time values alongside color.

### Live Viewer / Controller

The live surface expands the same timing language into a dark broadcast layout: large current name, acid countdown, state copy, slim progress bar, next slot and ruled coming-up list. Viewer links show the read-only display. A controller link reveals Start / next, Pause / resume, Undo and Extend 1 min capsules plus acknowledgement text. Disconnected, expired and unavailable states replace timing claims with explicit copy.

### Sharing / Reports

Sharing groups the QR and viewer link first, then separates the co-host control capability with rules and explanatory copy. Revocation remains a destructive action. Reports use a clean ruled comparison table, session selector, plan-change text and CSV / copy / print controls. Print hides surrounding workspace and dialog controls. Neither report nor private parking content belongs on the audience surface.

## Do's and Don'ts

### Do:

- **Do** preserve the confirmed mineral light workspace and warm-black timer.
- **Do** use self-hosted Manrope for interface text and tabular system monospace for timing.
- **Do** use acid-yellow capsules for primary actions and preserve semantic timing states.
- **Do** keep the final two-line phone agenda, visible focus and reduced-motion behavior.
- **Do** keep planned and actual time visibly distinct.
- **Do** keep audience, controller and private workspace roles visually explicit.

### Don't:

- **Don't** restore the superseded cobalt palette or external font dependencies.
- **Don't** imply the working title or extracted broadcast-desk description is an approved brand name.
- **Don't** add ambient shadows to resting panels.
- **Don't** communicate timing or connection state through color alone.
- **Don't** expose private parking or reports in the shared display.
- **Don't** replace the immediate working tool with a marketing or pricing gate.
