---
name: "CorpTimer"
description: "A newspaper workbench for shared meeting time."
colors:
  bg: "#eeece5"
  panel: "#eeece5"
  fg: "#20211e"
  muted: "#62635e"
  line: "#bbbcb4"
  soft: "#e5e4dc"
  field: "#f3f1eb"
  accent: "#c62d35"
  signal: "#299093"
  signal-hover: "#227d80"
  focus: "#17676b"
  green: "#c9dddd"
  green-ink: "#06282b"
  bad: "#a91f29"
  ov-bg: "#061a1e"
  ov-fg: "#f5f2e9"
  ov-muted: "#b5cbca"
  ov-line: "#375055"
  ov-ok: "#b7dedd"
  ov-warn: "#f1bc61"
  ov-bad: "#ff8b82"
  ov-past: "#609694"
  ov-up: "#354e51"
typography:
  display:
    fontFamily: "Manrope, Arial, sans-serif"
    fontSize: "clamp(90px,10.2vw,144px)"
    fontWeight: 750
    lineHeight: 1.1
    letterSpacing: "-.04em"
  headline:
    fontFamily: "'Cantata One', Georgia, serif"
    fontSize: "32px"
    fontWeight: 400
    lineHeight: 1.3
    letterSpacing: "-.7px"
  title:
    fontFamily: "'Cantata One', Georgia, serif"
    fontSize: "24px"
    fontWeight: 400
    lineHeight: 1.25
    letterSpacing: "-.5px"
  body:
    fontFamily: "Manrope, Arial, sans-serif"
    fontSize: "14px"
    lineHeight: 1.45
  label:
    fontFamily: "Manrope, Arial, sans-serif"
    fontSize: "12px"
rounded:
  control: "5px"
  utility: "4px"
  dialog: "8px"
spacing:
  control-gap: "8px"
  column-gap: "44px"
  workspace-gap: "28px"
components:
  transport:
    backgroundColor: "transparent"
    textColor: "#a7242d"
    rounded: "{rounded.control}"
    padding: "10px 14px"
  float:
    backgroundColor: "{colors.signal}"
    textColor: "#061a1e"
    rounded: "{rounded.control}"
    padding: "10px 14px"
  reset:
    backgroundColor: "{colors.accent}"
    textColor: "#fff"
    rounded: "{rounded.control}"
    padding: "7px 12px"
  agenda-input:
    backgroundColor: "{colors.field}"
    textColor: "{colors.fg}"
    rounded: "{rounded.control}"
    height: "44px"
  dialog:
    backgroundColor: "{colors.bg}"
    textColor: "{colors.fg}"
    rounded: "{rounded.dialog}"
---

# Design System: CorpTimer

## Overview

**Creative North Star: "The newspaper workbench"**

Cream paper, charcoal ink, upright serif headings and fine rules make a working meeting agenda feel editorial and immediately readable. The host clock sits directly on the paper. Red outlines identify Start / Next Speaker, solid red identifies Reset, and saturated teal identifies Float Timer. The compact clock leaves room for editing and handing off the agenda.

This documents the user-approved editorial redesign and subsequent explicit corrections of 25 October 2026. It replaces the earlier mineral/acid visual contract. CorpTimer is the selected working brand; domain registration is pending. Preserve the existing public URL, https://cytramonp.github.io/relay-timer/, and the functional product contract in PRODUCT.md. The effective cascade is `docs/base.css`, then `docs/workspace.css`, then `docs/editorial.css`; inherited mechanics remain relevant, but older overwritten styles are not current design guidance.

The direction image `.impeccable/mocks/editorial-approved.png` is a reference, not an exact-match requirement: later user corrections supersede its oversized clock, pale green, filled Start and connector geometry. The earlier failed 63.7 reproduction score remains historical evidence; it is not a current passed gate. Current review screenshots are `.impeccable/review/desktop.png`, `mobile.png`, `user-320.png` and `mobile-agenda.png`. Documentation records the implemented system and does not establish deployment status or claim exact comp matching.

**Key Characteristics:**

- Cream host workspace with flat surfaces, thin rules and red rule accents.
- Self-hosted Cantata One headings and Manrope interface text.
- Compact tabular clock and distinct transport, reset and floating actions.
- Editable desktop agenda beside the clock; focused mobile task navigation.
- Dark floating and audience surfaces, separate from private host tools.

## Colors

The frontmatter records the actual editorial root tokens. Cream `bg` and `panel` share the same ground; `fg` is charcoal, while `muted` and `line` provide quieter hierarchy. `field` gives editable areas a subtle paper tint.

Red `accent` marks transport borders, Reset, active mobile navigation and short rule details. Teal `signal` fills Float and selected primary utility actions; `focus` is the darker teal keyboard outline. These roles replace the former acid-yellow action system. Template identity colors remain scoped to templates and do not redefine timing status.

The host `.ov` overrides overlay tokens locally to use charcoal text on transparent cream, red progress, muted grey upcoming segments, amber warning and red overtime. Floating views retain the dark teal overlay tokens. The audience stylesheet retains its own dark surface and gets the editorial light clock, red progress and red remote primary control. Do not assume root overlay tokens recolor every audience selector.

## Typography

Cantata One is loaded from `docs/fonts/CantataOne-Regular.ttf`; Manrope is loaded from `docs/fonts/Manrope.ttf`. Both use `font-display: swap`. Headings are upright, regular-weight serif: the wordmark is 32px, meeting title 32px, main section headings about 24–25px and dialog headings 29px. Interface text is Manrope, generally 11–14px according to hierarchy.

The host clock uses Manrope at weight 750 with tabular figures and the display clamp above. At widths up to 800px it uses `clamp(74px,18vw,120px)`. Small timer labels remain 14px. The system monospace numeric stack remains in inherited secondary and floating/live contexts where implemented; do not replace the new host clock with it. Mobile editable agenda fields use 16px text at up to 600px.

## Layout

The desktop workspace has a 1440px maximum width, 40px horizontal padding and 28px vertical spacing. The header has a 1500px maximum width and an 84px height. A ruled meeting heading precedes the two-column grid: `minmax(0,1.35fr) minmax(390px,1fr)`, separated by 44px. The timeline follows the timer controls; the agenda has no enclosing card.

A single short grey connector bridges the desktop gutter at agenda-heading level. Its final 15px and hollow end dot are red. It refers to the entire agenda, never a particular row, and has no pointer interaction. It disappears at 1100px and below.

At 1100px the grid narrows, at 800px it becomes one column, and at 600px the existing Timer / Agenda / Notes focused-view behavior applies. At 480px the header navigation wraps and workspace side padding becomes 14px. The supported floor is 320px. Preserve the reviewed 320px and 390px layouts: task controls stay reachable, meeting tools wrap, agenda fields use the mobile two-line structure, and Agenda / Notes provide the return-to-timer preview. Do not restore desktop agenda columns on phones merely because a narrower breakpoint appears earlier in the stylesheet; the final 600px rule wins.

## Elevation & Depth

The main workspace is flat: panels are transparent, borderless and square with no shadow. Fine rules, spacing and field tones provide separation. Dialogs have a thin border, 8px radius, no shadow and a charcoal translucent backdrop (`#20211e66`). Mobile navigation also has no shadow. Preserve inherited temporary interaction treatments where applicable; do not add ambient card elevation to the editorial workspace.

## Shapes

Use restrained 5px control and field corners, 4px utility corners and 8px dialog corners. Main panels have zero radius. The small timer status dot and connector endpoint remain circular. The inherited dark mobile return preview retains its 12px radius. Template cards use 5px corners and small illustrated identity blocks; broad capsule styling is no longer the default host control language.

## Components

**Transport and floating.** Start / Next Speaker and Float Timer occupy the first control row at a normal 44px minimum height. Start / Next is transparent with a red border and dark red text; hover is pale red `#f1e0da`. Float is saturated teal with dark text, a darker teal border and hover `#3aa5a6`. Preserve their small directional corner/arrow marks. The second row contains Pause, Undo and Reset at 40px minimum height; Reset is filled red with white text and darkens to `#a51f29` on hover.

**Clock states.** Ready/running use charcoal numbers; warning and overtime use their semantic colors and existing text. Paused host clock opacity is **0.72**, overriding the old base opacity of 0.45. Keep real state and timing behavior; visual changes must not change milestones, carryover, pause or host authority.

**Agenda.** Editable names and minutes have pale fields, fine borders, 5px corners and 44px height. The current row receives a muted red paper tint. Drag handles, slot indices, actual timings, pins, result chips and delete controls retain their functional roles. The connector targets the agenda as a whole.

**Navigation and fields.** Keep Templates as a native select and Manage as its adjacent action. At mobile widths, the three task tabs have a fine bordered paper container with 5px corners and a red selected tab. Focus uses a 2px dark teal outline with 3px offset. Reduced-motion preferences disable button transitions; normal buttons inherit 0.15s background/border transitions. Disabled controls retain inherited opacity 0.38.

**Secondary surfaces.** Templates, saved meetings, import/export, reports, settings and private parking retain their current workflows. Templates use editable identity colors and proportional duration graphics. Keep official Google sign-in artwork, including the compact mobile header asset. Floating and audience views stay dark; private parking and reports never become audience content. Viewer access remains read-only; co-host controls remain a separate capability, and the host tab must stay open.

## Do's and Don'ts

- **Do** preserve the cream/charcoal editorial ground and upright serif hierarchy.
- **Do** retain red outlined Start / Next, red filled Reset and saturated teal Float.
- **Do** keep the smaller clock, 0.72 paused opacity and short agenda-level connector.
- **Do** preserve responsive 320px/390px task navigation, focus visibility and real editable data.
- **Do** retain the canonical public URL, optional sign-in and immediate app entry.
- **Don't** restore the superseded mineral/acid world or treat historical mock scores as current approval.
- **Don't** enlarge the clock or fill Start to imitate the older reference image.
- **Don't** connect the clock to an individual speaker row.
- **Don't** introduce remote font dependencies, decorative card shadows or a marketing/paywall gate.
- **Don't** convey state through color alone or imply floating content is always visible in every screen-sharing mode.
