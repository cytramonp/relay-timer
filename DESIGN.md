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
  block-border: "#a6aaa2"
  timer-border: "#27484c"
  timer-ok: "#64c9c4"
  timer-bad: "#ff9b90"
  timer-float: "#58c2bc"
  transport-ink: "#132c30"
  reset-ink: "#431612"
  trace-base: "#969f98"
  trace-active: "#d4484e"
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
  block: "14px"
  agenda-action: "6px"
spacing:
  control-gap: "8px"
  column-gap: "44px"
  workspace-gap: "28px"
components:
  transport:
    backgroundColor: "{colors.ov-fg}"
    textColor: "{colors.transport-ink}"
    rounded: "{rounded.control}"
    padding: "10px 14px"
  float:
    backgroundColor: "{colors.timer-float}"
    textColor: "#061a1e"
    rounded: "{rounded.control}"
    padding: "10px 14px"
  reset:
    backgroundColor: "{colors.timer-bad}"
    textColor: "{colors.reset-ink}"
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

Cream paper, charcoal ink, upright serif headings and fine rules make a working meeting agenda feel editorial and immediately readable. The host clock sits inside a dark teal timer block on the light page. Cream identifies Start / Next Speaker, salmon identifies Reset, and bright teal identifies Float Timer. The compact clock leaves room for editing and handing off the agenda.

This documents the user-approved editorial redesign and subsequent explicit corrections of 25–26 October 2026. It replaces the earlier mineral/acid visual contract. CorpTimer is the selected brand; https://corptimer.com/ is the primary origin after the 25 October cutover to Firebase Hosting project `relay-timer-web-7c39`. Keep https://cytramonp.github.io/relay-timer/ available as the legacy Pages copy and preserve the functional product contract in PRODUCT.md. The meeting cascade is `docs/base.css`, then `docs/workspace.css`, then `docs/editorial.css`, then `docs/blocks.css`; standalone tools add `docs/special-timers.css` last. Inherited mechanics remain relevant, but older overwritten styles are not current design guidance.

The direction image `.impeccable/mocks/editorial-approved.png` is a reference, not an exact-match requirement: later user corrections supersede its oversized clock, pale green, filled Start and connector geometry. The earlier failed 63.7 reproduction score remains historical evidence; it is not a current passed gate. Current review screenshots are `.impeccable/review/desktop.png`, `mobile.png`, `user-320.png` and `mobile-agenda.png`. Documentation records the implemented system and does not establish deployment status or claim exact comp matching.

The timer-library extension has a SHIP finish-review disposition after the inactive chess-clock contrast correction. Evidence in `.impeccable/review/` includes `boxing-desktop.png`, `boxing-mobile.png`, `boxing-mobile-settings.png`, `directory-desktop.png`, `directory-mobile.png`, `chess-mobile.png`, `newyear-mobile.png`, `long-timer-320.png`, `meeting-desktop.png` and `meeting-320.png`. This covers viewport captures and reported browser checks, not full-page or real-device alarm validation. No deployment is established by this documentation pass.

**Key Characteristics:**

- Cream host workspace with flat surfaces, thin rules and red rule accents.
- Self-hosted Cantata One headings and Manrope interface text.
- Compact tabular clock and distinct transport, reset and floating actions.
- Editable desktop agenda beside the clock; focused mobile task navigation.
- Dark floating content and a light audience page with a dark timer, separate from private host tools.
- Illustrated standalone tools and a ruled directory within the same editorial world.

## Colors

The frontmatter records the actual editorial root tokens. Cream `bg` and `panel` share the same ground; `fg` is charcoal, while `muted` and `line` provide quieter hierarchy. `field` gives editable areas a subtle paper tint.

Red `accent` marks transport borders, Reset, active mobile navigation and short rule details. Teal `signal` fills Float and selected primary utility actions; `focus` is the darker teal keyboard outline. These roles replace the former acid-yellow action system. Template identity colors remain scoped to templates and do not redefine timing status.

The host `.ov` overrides overlay tokens locally to use charcoal text on transparent cream, red progress, muted grey upcoming segments, amber warning and red overtime. Floating views retain the dark teal overlay tokens. The audience stylesheet retains its own dark surface and gets the editorial light clock, red progress and red remote primary control. Do not assume root overlay tokens recolor every audience selector.

## Typography

Cantata One is loaded from `docs/fonts/CantataOne-Regular.ttf`; Manrope is loaded from `docs/fonts/Manrope.ttf`. Both use `font-display: swap`. Headings are upright, regular-weight serif: the wordmark is 32px, meeting title 32px, main section headings about 24–25px and dialog headings 29px. Interface text is Manrope, generally 11–14px according to hierarchy.

The host clock uses Manrope at weight 750 with tabular figures and the display clamp above. At widths up to 800px it uses `clamp(74px,18vw,120px)`. Small timer labels remain 14px. The system monospace numeric stack remains in inherited secondary and floating/live contexts where implemented; do not replace the new host clock with it. Mobile editable agenda fields use 16px text at up to 600px.

## Layout

The desktop workspace has a 1440px maximum width, 40px horizontal padding and 28px vertical spacing. The header has a 1500px maximum width and an 84px height. A ruled meeting heading precedes the two-column grid: `minmax(0,1.35fr) minmax(390px,1fr)`, separated by 44px. The timeline follows the timer block; agenda, timeline, parking, settings and session summary use outlined rounded blocks.

A thin extended bent grey/red SVG trace bridges the desktop gutter at agenda-heading level, with no endpoint circles. Its 170px by 100px canvas uses a 1.5px stroke. It refers to the entire agenda, never a particular row, and has no pointer interaction. It disappears at 1100px and below.

At 1100px the grid narrows, at 800px it becomes one column, and at 600px the existing Timer / Agenda / Notes focused-view behavior applies. At 480px the header navigation wraps and workspace side padding becomes 14px. The supported floor is 320px. Preserve the reviewed 320px and 390px layouts: task controls stay reachable, meeting tools wrap, agenda fields use the mobile two-line structure, and Agenda / Notes provide the return-to-timer preview. Do not restore desktop agenda columns on phones merely because a narrower breakpoint appears earlier in the stylesheet; the final 600px rule wins.

Standalone tools use a 1360px maximum wrapper and an illustrated ruled heading above a dark clock beside task-specific settings. At 760px and below, the clock precedes settings in one column, numeric fields use 16px text, and the directory changes from two columns to one. At 400px and below the navigation wraps and illustrations shrink; long clock values have their own reduced type scale. Preserve the 320px floor without clipping clocks or hiding controls. The directory uses ruled activity links and a six-duration strip that becomes three columns on phones; it is not a grid of elevated cards.

## Elevation & Depth

The main workspace has no card shadows: thin outlined rounded panels, spacing and surface tones provide separation. Dialogs have a thin border, 8px radius, no shadow and a charcoal translucent backdrop (`#20211e66`). Mobile navigation also has no shadow. Preserve inherited temporary interaction treatments where applicable; do not add ambient card elevation to the editorial workspace.

## Shapes

Use restrained 5px control and field corners, 4px utility corners and 8px dialog corners. Working panels and the timer block have 14px corners. The small timer status dot remains circular; the trace has no endpoint circles. The inherited dark mobile return preview retains its 12px radius. Template cards use 5px corners and small illustrated identity blocks; broad capsule styling is no longer the default host control language.

## Components

**Transport and floating.** Start / Next Speaker and Float Timer occupy the first control row at a normal 44px minimum height. Inside the dark timer, Start / Next is cream with dark teal text and hover `#dedbd2`. Float is bright teal with dark text and hover `#7bd4ce`. Preserve their small directional corner/arrow marks. The second row contains Pause, Undo and Reset at 40px minimum height; Reset is salmon with dark red text and hover `#ffb3aa`. Pause and Undo use light text and a muted teal outline.

**Clock states.** Ready/running use cream numbers inside the dark timer; warning and overtime use their semantic colors and existing text. Paused host clock opacity is **0.72**, overriding the old base opacity of 0.45. Keep real state and timing behavior; visual changes must not change milestones, carryover, pause or host authority.

**Agenda.** Editable names and minutes have pale fields, fine borders, 5px corners and 44px height. The current row receives a muted red paper tint. Drag handles, slot indices, actual timings, pins, result chips and delete controls retain their functional roles. The connector targets the agenda as a whole.

**Navigation and fields.** Keep Templates as a native select and Manage as its adjacent action. Templates, Manage, Add speaker and Add topic have visible 1px outlines, pale backgrounds, 6px corners and 42px minimum height. At mobile widths, the three task tabs have a fine bordered paper container with 5px corners and a red selected tab. Focus uses a 2px dark teal outline with 3px offset. Reduced-motion preferences disable button transitions; normal buttons inherit 0.15s background/border transitions. Disabled controls retain inherited opacity 0.38, except inactive standalone chess buttons: these explicitly retain opacity 1 so both players' clocks remain legible.

**Standalone clocks and settings.** The 14 standalone pages share a dark teal clock stage, cream Start, salmon Reset, tabular Manrope digits and upright serif phase labels. Their adjacent outlined settings expose the relevant activity controls rather than the meeting agenda. Settings, presets and restored sessions are local to each tool and browser; standalone tools do not use account sync. Keep fullscreen, visible phase/status text, sound testing and the open-tab/browser-alarm limitation reachable. The original Meeting Timer remains at `/`; Other Timers opens `/timers/`. Source composition lives in `scripts/build-timers.mjs`, `docs/timer-forms.js` and `docs/special-timers.js`.

**Editorial illustrations.** The user's minimal half-comic correction uses thick charcoal outlines on cream with restrained red and teal accents, sparse motion marks and no labels. `docs/assets/timer-illustrations.jpg` is one eight-scene atlas, arranged as two columns by four rows: boxing, fitness, Pomodoro, classroom, chess, stopwatch, simple countdown and New Year. CSS selects each cell with `background-size: 200% 400%` and uses `mix-blend-mode: darken` to join the cream page. Preserve the scene's accessible text alternative, heading hierarchy and ruled directory composition. The generated prompt is preserved in the JPEG COM metadata and `outputs/timer-library/illustration-prompt.txt`; keep provenance with any replacement shipping raster. The stopwatch scene belongs to its tool and does not restore the removed decorative meeting stopwatch.

**Secondary surfaces.** Templates, saved meetings, import/export, reports, settings and private parking retain their current workflows. Templates use editable identity colors and proportional duration graphics. Keep official Google sign-in artwork, including the compact mobile header asset. Floating content stays dark; the audience page matches the light host page with a dark timer stage and light outlined agenda; private parking and reports never become audience content. Viewer access remains read-only; co-host controls remain a separate capability, and the host tab must stay open.

**How it works and advice.** Each timer page ends with a closed native details disclosure, below the related links on standalone tools and above the meeting footer. Its quiet 13px summary and plus/minus mark keep the workspace primary. Expanded content uses the existing serif section headings, readable body copy and practical bullets, with two columns on desktop and one on phones. Instructions are specific to the activity or duration and remain in static HTML for every reader. The disclosure does not require JavaScript. The follow-up desktop/mobile review returned SHIP.

## Do's and Don'ts

- **Do** preserve the cream/charcoal editorial ground and upright serif hierarchy.
- **Do** retain cream Start / Next, salmon Reset and bright teal Float inside the dark timer.
- **Do** keep the smaller clock, 0.72 paused opacity and thin bent agenda-level trace without endpoint circles.
- **Do** preserve responsive 320px/390px task navigation, focus visibility and real editable data.
- **Do** retain the canonical public URL, optional sign-in and immediate app entry.
- **Do** preserve illustrated tool headings, ruled directory links, legible inactive chess clocks and separate browser-local setups.
- **Don't** restore the superseded mineral/acid world or treat historical mock scores as current approval.
- **Don't** enlarge the meeting clock or restore its decorative stopwatch.
- **Don't** connect the clock to an individual speaker row.
- **Don't** introduce remote font dependencies, decorative card shadows or a marketing/paywall gate.
- **Don't** convey state through color alone or imply floating content is always visible in every screen-sharing mode.


## Selected identity — 26 October 2026

User selected schematic logo A: black rectangular glasses, eye on viewer-left, red elapsed-time sector in viewer-right lens. `docs/assets/corptimer-mark.svg` is its scalable vector adaptation, paired with the existing CorpTimer wordmark and a red Timer accent. Host and audience headers share the mark. The install/favicon icon places it on a cream square. The sector is static brand artwork, not a live progress indicator.

## Approved block refinement — 26 October 2026

`docs/blocks.css` is the final visual override after `editorial.css` and supersedes older borderless-panel and short dotted-connector guidance. The timer block uses 24px desktop padding; light working panels use 22px (settings keeps zero padding). At 600px and below, timer and primary working panels use 18px 14px padding and preserve the 320px agenda layout. The timer progress bar is 12px high with 4px corners. The decorative stopwatch is hidden. Audience mode uses the same light-page/dark-timer composition. Logo A and the canonical URL remain unchanged.
