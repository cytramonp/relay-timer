---
name: "Relay Timer (working title)"
description: "A light meeting workspace with a dark stage timer."
colors:
  bg: "#f4f5f7"
  panel: "#fff"
  fg: "#182329"
  muted: "#5f6975"
  line: "#dce1e6"
  accent: "#2d50cc"
  accent-hover: "#233eaa"
  soft: "#edf1f7"
  ok: "#17905A"
  warn: "#C77E00"
  bad: "#ae2924"
  ov-bg: "#131c29"
  ov-fg: "#f5f7fa"
  ov-muted: "#aab7c8"
  ov-line: "#344050"
  ov-ok: "#9ce0c2"
  ov-warn: "#f3c56f"
  ov-bad: "#ff978b"
  ov-past: "#647ebd"
  ov-up: "#394757"
typography:
  display:
    fontFamily: "ui-monospace, 'Cascadia Mono', Consolas, monospace"
    fontSize: "clamp(78px,8.8vw,124px)"
    fontWeight: 650
    lineHeight: 1.12
    letterSpacing: "-.04em"
  headline:
    fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"
    fontSize: "27px"
    fontWeight: 650
    lineHeight: 1.3
    letterSpacing: "-.7px"
  title:
    fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"
    fontSize: "15px"
    fontWeight: 650
    lineHeight: 1.4
    letterSpacing: "-.25px"
  body:
    fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"
    fontSize: "14px"
    lineHeight: 1.45
  label:
    fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"
    fontSize: "12px"
  button:
    fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"
    fontSize: "13px"
    fontWeight: 500
rounded:
  field: "6px"
  control: "7px"
  panel: "12px"
  stage: "14px"
  pill: "999px"
spacing:
  control-gap: "7px"
  stack: "16px"
  panel-inset: "22px"
  column-gap: "24px"
  workspace-inset: "28px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.panel}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    padding: "8px 13px"
    height: "40px"
  button-primary-hover:
    backgroundColor: "{colors.accent-hover}"
  button-secondary:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.fg}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    padding: "8px 13px"
    height: "40px"
  button-text:
    textColor: "{colors.accent}"
    typography: "{typography.button}"
    padding: "3px 6px"
    height: "32px"
  agenda-input:
    backgroundColor: "#fbfcfd"
    textColor: "{colors.fg}"
    rounded: "{rounded.field}"
    padding: "6px 8px"
    height: "38px"
  navigation:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.fg}"
    height: "72px"
  status-chip:
    textColor: "{colors.ok}"
    rounded: "{rounded.pill}"
    padding: "0 4px"
  panel:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.fg}"
    rounded: "{rounded.panel}"
    padding: "{spacing.panel-inset}"
  stage:
    backgroundColor: "{colors.ov-bg}"
    textColor: "{colors.ov-fg}"
    rounded: "{rounded.stage}"
    padding: "24px 28px 22px"
  timeline:
    backgroundColor: "{colors.soft}"
    rounded: "5px"
    height: "22px"
  settings:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.fg}"
    rounded: "{rounded.panel}"
---

# Design System: Relay Timer (working title)

## Overview

**Creative North Star: "Facilitator's control desk" — extracted, provisional descriptive label.** This records the implemented direction in SURFACE.md; it is not a newly approved brand metaphor or final product name.

The confirmed visual commitment is a light workspace with a dark timer. Porcelain surfaces, ink text, cobalt actions, thin rules and consistent stroke icons keep the working controls quiet while the current speaker and countdown remain prominent. The interface opens directly into a usable tool.

This document captures the effective cascade at commit `cd4cc3c`: `docs/base.css` supplies timer mechanics and timing states; the later `docs/workspace.css` defines the public workspace appearance. Frontmatter values are normative extracted values, not a new stylesheet. Color names and descriptive language below identify their observed roles.

**Key Characteristics:**

- Light utility workspace and dark navy stage.
- System sans for controls; tabular monospace for time.
- Cobalt actions, restrained borders and modest corner radii.
- Separate planned and actual timing tracks.
- Stacked, touch-aware controls on small screens.

## Colors

The palette combines cool light neutrals and a cobalt action color with a separate, higher-luminance timer palette. Descriptive names are extracted role labels.

### Primary

- **Cobalt action** (`accent`): primary controls, action links, selection controls and visible keyboard focus. `accent-hover` is the primary button hover state.
- **Timing states** (`ok`, `warn`, `bad`): progress, warning and overrun in the workspace. Their labels and track structure accompany the colors.

### Neutral

- **Porcelain ground** (`bg`) and **white panel** (`panel`): page ground and working surfaces.
- **Ink** (`fg`) and **slate text** (`muted`): principal text and supporting labels.
- **Cool rule** (`line`) and **soft lane** (`soft`): borders, dividers and unfilled timeline lanes.
- **Navy stage** (`ov-bg`), **stage white** (`ov-fg`), **stage slate** (`ov-muted`) and **stage rule** (`ov-line`): timer surface, speaker text, secondary text/idle digits and bars.
- **Stage green**, **stage amber**, **stage coral** (`ov-ok`, `ov-warn`, `ov-bad`): active, warning and overrun timer states.
- **Past blue** (`ov-past`) and **upcoming slate** (`ov-up`): completed and upcoming blocks in the stage agenda strip.

The visible timeline legend uses additional fixed swatches in workspace.css. Do not substitute those for timing-state tokens: the lanes themselves use the base stylesheet's color-mix treatments.

**The Stage Separation Rule.** Keep workspace and timer color families distinct; preserve the confirmed light-workspace/dark-timer pairing.

## Typography

**Display Font:** the `--f-num` system monospace stack.
**Body Font:** the `--f-ui` system sans stack.

The public stylesheet overrides the base Onest and Martian Mono declarations with system stacks. The UI loads no external font resource. Tabular numerals keep clocks, durations and usage values aligned.

### Hierarchy

- **Display:** large tabular countdown; frontmatter records the desktop fluid rule. At widths up to 1150px it becomes 105px, up to 900px 116px, and up to 560px `clamp(76px,22vw,103px)`.
- **Headline:** editable meeting name; reduces to 25px on phones.
- **Title:** compact section headings. The speaker name is a separate 30px, weight 550 stage role, reducing to 27px on phones.
- **Body:** ordinary workspace text; help dialogs use 13px text with a 1.75 line height.
- **Label:** 12px metadata, hints, timeline labels and agenda usage.
- **Button:** 13px at rest; most mobile workspace buttons use 12px.

## Layout

The working container is centered with a maximum width of 1376px and desktop padding of 30px 28px 0. Its vertical gap is 26px. The main two-column grid uses `minmax(0,1.3fr) minmax(430px,1fr)` with a 24px gap. Columns use 16px stacks.

At 1150px, horizontal padding becomes 24px and the grid gap 18px. At 900px, the grid stacks, the workspace caps at 760px and the main controls remain on one row when space permits. At 560px, workspace padding is 22px 16px 0 and controls become a three-column grid: Start spans two columns beside Pause; Undo, Float and Reset occupy the second row. Primary timer controls and agenda drag/delete targets have 44px minimum touch dimensions.

Agenda rows keep editable names, minutes and usage aligned. Phone rows hide the ordinal and retain 44px drag/delete targets. Settings retain a two-column grid, with wrapping text and supporting hints. The header wraps on phones; header help hides there while footer help remains available.

The floating display has separate height breakpoints at 169px and 79px. These reduce stage chrome and prioritize clock/name, while idle Start remains available. Preserve these functional adaptations when adding controls.

## Elevation & Depth

The workspace is flat at rest: borders, white panels and the dark stage provide separation. Panels and ordinary buttons have no ambient shadow. The dragging agenda row uses a temporary `0 6px 18px rgba(0,0,0,.18)` shadow. Dialogs use a tinted `#17223566` backdrop. The toast is a solid dark utility notice.

**The Flat Rest Rule.** Keep ordinary workspace surfaces flat; use the existing temporary drag treatment for movement feedback.

## Shapes

Fields use small rounded corners, controls a slightly softer control radius, and panels/stage larger enclosing radii as recorded in frontmatter. The stage uses a fine dark border; other panels use the cool rule. Timeline lanes clip segments within gently rounded ends. Status chips retain pill corners, while the stage's individual agenda blocks use 2px corners. Icons are small, consistent inline stroke SVGs; the wordmark is a filled SVG.

## Components

### Buttons

Primary buttons use cobalt with white text and the darker cobalt hover. Secondary controls use white, a thin rule, and a cool gray hover with a stronger border. Text actions use cobalt on transparent ground. Reset uses the destructive text color. Normal buttons have a 40px minimum height; timer controls use 44px. Disabled controls reduce opacity to .38 and retain disabled behavior.

Visible keyboard focus uses a 2px cobalt outline with a 3px offset. State transitions are limited to background and border color over .15s. Reduced-motion preference disables transitions.

### Inputs / Fields

Agenda fields use a near-white fill, a thin rule and small rounded corners. Names and minutes use 13px type; numerical fields use the numeric stack. The meeting title is an unboxed editable headline with the shared visible focus outline. Mobile agenda fields grow to 42px and use 12px type. Search uses a distinct 12px 13px inset.

### Navigation

A white, ruled utility header holds the wordmark and compact workspace actions. Optional account access receives a lightly tinted bordered button. Footer utilities are muted and wrap on narrow screens. Navigation remains subordinate to the timer.

### Chips

Small timing-result chips use status text over an 18% color-mix tint. They accompany actual usage, using green, red or cobalt for early, over or live states.

### Cards / Containers

White bordered panels group agenda, timeline and settings without shadows. Default panel padding is 22px, with contextual responsive reductions. Dialogs have a 14px radius and bounded viewport width. The saved-meeting library is a dialog containing a search field and ruled rows.

### Stage Timer

The dark stage groups position, speaker, countdown, progress and next speaker. Minimum desktop height is 355px. Idle/done digits use stage-muted; active, warning and overrun use their stage state colors. Pause reduces digit opacity. The thin progress bar and proportional agenda strip reinforce the numerical clock. Floating mode reuses this stage with compact layouts and its own inline controls.

### Planned / Actual Timeline

Two 22px lanes distinguish planned slots from actual usage. Planned segments tint past, current and upcoming states; current progress is a two-stop gradient. Topic segments add a repeating diagonal pattern. Actual early/over segments use separate status tints. Milestone boundaries are draggable; the meeting clock has a knob with keyboard correction. Labels and the legend explain color.

### Settings

A native disclosure keeps lower-frequency timing and floating controls compact. Its summary uses a plus stroke icon that rotates on open. Inside, labeled fields and checkboxes use the standard input vocabulary. Supporting text wraps beside the associated setting.

## Do's and Don'ts

### Do:

- **Do** preserve the confirmed light workspace and dark timer.
- **Do** reuse the source CSS custom properties when adding controls or stage states.
- **Do** keep tabular monospace for clocks and usage values.
- **Do** preserve visible focus, mobile touch targets and reduced-motion handling.
- **Do** keep planned and actual tracks visibly distinct.

### Don't:

- **Don't** replace the immediate working tool with a marketing or pricing gate.
- **Don't** imply the working title or extracted descriptive metaphor is a final brand decision.
- **Don't** add ambient card shadows to the flat workspace.
- **Don't** communicate timing state through color alone.
- **Don't** remove the mobile footer help entry when the header help action is hidden.

