---
name: "CorpTimer mobile beta"
description: "The CorpTimer newspaper workbench, adapted to a native timer workspace."
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
  dark-bg: "#182225"
  dark-field: "#233235"
  dark-ink: "#f5f2e9"
  dark-muted: "#b8c5c2"
  dark-line: "#526663"
  dark-red: "#ff9b90"
  dark-teal: "#83d4ce"
  dark-soft: "#28494a"
  transport-ink: "#132c30"
  reset-ink: "#431612"
typography:
  display:
    fontFamily: "Manrope"
    fontSize: "70px"
    letterSpacing: "-2px"
  headline:
    fontFamily: "Cantata"
    fontSize: "26px"
    lineHeight: "35px"
  body:
    fontFamily: "System"
    fontSize: "16px"
    lineHeight: "24px"
  label:
    fontFamily: "System"
    fontSize: "15px"
    fontWeight: 600
rounded:
  control: "6px"
  illustration: "8px"
  chess: "10px"
  clock: "14px"
spacing:
  row: "10px"
  page: "20px"
  page-bottom: "48px"
components:
  action-outline:
    backgroundColor: "transparent"
    textColor: "{colors.teal}"
    rounded: "{rounded.control}"
    padding: "12px 17px"
  action-primary:
    backgroundColor: "{colors.teal}"
    textColor: "{colors.bg}"
    rounded: "{rounded.control}"
    padding: "12px 17px"
  action-cream:
    backgroundColor: "{colors.cream}"
    textColor: "{colors.transport-ink}"
    rounded: "{rounded.control}"
    padding: "12px 17px"
  action-danger:
    backgroundColor: "{colors.salmon}"
    textColor: "{colors.reset-ink}"
    rounded: "{rounded.control}"
    padding: "12px 17px"
  field:
    backgroundColor: "{colors.field}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "12px"
  timer-stage:
    backgroundColor: "{colors.clock}"
    textColor: "{colors.cream}"
    rounded: "{rounded.clock}"
    padding: "22px"
---

# Design System: CorpTimer mobile beta

## Overview

**Creative North Star: "The newspaper workbench"**

This mobile extension preserves CorpTimer's cream paper, charcoal ink, upright serif headings, fine rules, original glasses and half-comic activity artwork. The catalog is an illustrated list; an active timer is a dark teal stage. Native task conventions guide navigation, editing and switches.

This is the implemented mobile system, scoped separately from the web design in `../DESIGN.md`. Source is the authority for tokens and behavior. `.impeccable/review/mobile-beta/home-web-390.png` and `history-web-390.png` at the repository root remain browser previews only. Native Android phone/tablet captures now exist in `.local/final-android-captures/`, covering home, timer, editor, History and dark large text. Android APK CI run `40446595327` succeeded on source `ddfcc48`.

The Android-only visual review returned **FIX** for low-contrast dark system icons, default blue selection and a tablet sidebar occupying about 45% of the width. The source corrections documented below await new native verification; those captures do not validate the corrections. iOS Xcode compilation succeeded and simulator home rendered, but an OS Open dialog blocked deep-link screenshots. The Maestro interaction-capture pipeline is pending; there is no iOS visual pass. No native release approval or store submission is established. The owner has no Apple or Google developer account.

**Key Characteristics:**

- Flat editorial surfaces and ruled activity rows.
- Bundled serif headings, system body text and tabular clock digits.
- Red identity/navigation accents; teal utility actions; cream timer transport and salmon Reset.
- Automatic light/dark appearance and OS-native Expo UI switches.

## Colors

The frontmatter records `src/theme.tsx` plus the reusable action text colors. Unprefixed tokens describe light appearance. `dark-*` entries replace the corresponding roles when the OS requests dark appearance; clock, cream, salmon and bright remain shared. Component tokens show their light appearance mapping and receive the same theme substitution at runtime.

**Primary.** Teal identifies outlined utility actions and filled primary/selected actions. Red marks the short catalog rule, active navigation and current sequence item; in dark appearance it becomes salmon for legibility.

**Secondary.** Bright teal identifies clock status and progress. Salmon marks overtime digits/progress and Reset. Cream provides clock content and filled transport controls.

**Neutral.** Background and field tones separate the page from editable areas; ink and muted set hierarchy; fine line borders divide rows. Soft teal supports transient notices.

**The State Has Words Rule.** Keep status text, current-interval labels and accessible values alongside color. Brand artwork's red lens sector is static identity artwork.

## Typography

Cantata One is bundled as `Cantata`; Manrope is bundled as `Manrope`. Body, labels and actions use the platform system font. Headings stay upright. The root layout now holds the splash screen until font loading resolves, mounting the workspace after the fonts are ready or a font error occurs. This prevents the normal first render from preceding bundled-font availability; corrected native rendering remains pending verification.

- **Headline:** the frontmatter headline role styles section headings; catalog titles use Cantata at (23px), timer phase labels at (22px).
- **Clock:** Manrope uses tabular figures. The standard clock uses the display role with one-line fitting and a (90px) minimum height. New Year uses (46px), chess (54px), and the active-session return preview (38px).
- **Body:** the body role is selectable; catalog descriptions reduce to (14px) with (20px) line height. Field values use (17px); action and field labels use the label role.

Do not import the web's small interface text scale into the native workspace. Native large-type behavior still needs device validation.

## Layout

`Page` is a vertical scroll container with automatic content-inset adjustment, a centered content width capped at (850px), page padding from the spacing tokens, and consistent vertical gaps. Rows wrap with the row gap; field wrappers grow from a (140px) basis. The timer remains above its agenda/sequence and program-saving controls.

Expo Router supplies the stack and four tabs: Timers, My programs, History and Settings. Editors open as modals; timer headers expose Edit. Headers use the page ground without a shadow. Tabs use red active tint, muted inactive tint, soft-teal selected background and (13px) semibold labels. Android moves tabs to a (156px) left rail at widths of (768px) or more; other cases use bottom tabs. The narrower rail and explicit selected background correct the reviewed source; native recapture and scoring are pending.

The complete React Navigation theme maps primary/notification, background/card, text and border to CorpTimer roles. StatusBar and Stack explicitly select light foregrounds in dark appearance and dark foregrounds in light appearance. Android's `expo-navigation-bar` uses the matching foreground style; `expo-system-ui` sets the themed system background and the app declares automatic appearance. These are source-level corrections to system chrome and selection, not a passed visual gate.

`SafeAreaProvider` wraps navigation. Notices live inside `Page`, beneath the navigation and within the scroll content, rather than above the safe-area-aware navigation tree.

## Elevation & Depth

No custom card shadows are defined. Rules, borders, paper tints and the dark clock establish depth. Keep system modal presentation and alerts; do not replace them with decorative floating cards.

## Shapes

Controls and fields share restrained control corners. Activity thumbnails, paired chess clocks and timer stages use the separate radius tokens. Catalog rows remain open and ruled, rather than individually enclosed cards. The active-session return stage shares the clock radius with slightly tighter (18px) padding.

## Components

**Actions and fields.** All `Action` variants have a (48px) minimum height and a (1px) border. Pressed opacity is (0.7), disabled opacity (0.45), with disabled accessibility state. Cream actions serve timer transport; salmon serves Reset. Selected editor choices use the filled primary variant. Fields have persistent labels, a (48px) minimum height, thin borders and themed placeholder text. Validation appears as an inline text alert.

**Native controls.** `Toggle` uses `@expo/ui` Host/Switch, seeded with the theme teal and a (48px) minimum host height. Confirmations use React Native alerts on native platforms; browser preview uses `window.confirm`. Preserve system Back and the existing modal flow.

**Catalog and identity.** Activity rows pair a (76px × 70px) image area with title, description and teal chevron, separated by thin rules. Meeting uses the original glasses icon; the other activities use the existing cropped artwork. Images retain their cream ground in dark appearance. Keep that artwork rather than inventing a replacement illustration style.

**Clock and sequence.** The dark stage contains explicit phase/status, phase position, tabular digits, wrapping transport controls and an (8px) progress track where applicable. Overtime changes digits and progress to salmon. Chess uses two large tap targets with an active teal outline and fill. Sequence rows use a red current title plus “Current interval” text. Classroom can hide digits while retaining visual progress.

**Notices and interruptions.** Notices use the soft surface, alert role and a (48px) minimum Dismiss target. AppState restoration routes through `src/core/recovery.ts`; this is source behavior, not native lifecycle evidence. Preserve the visible background-alert and volume explanations. OS notification delivery and continuous background execution must not be implied by the clock's appearance.

## Do's and Don'ts

- **Do** preserve the original glasses, activity artwork, upright headings and ruled catalog.
- **Do** use theme roles for both appearances and retain the dark active-clock stage.
- **Do** preserve wrapping controls, labeled fields, native switches and explicit timer state.
- **Do** recapture and rescore the corrected Android phone/tablet surfaces; complete iOS interaction captures before claiming native visual approval.
- **Don't** copy web-only floating controls, private host panels or desktop agenda composition into this app.
- **Don't** replace system navigation with decorative custom chrome or add card shadows.
- **Don't** treat browser previews, a successful build or unscored source corrections as a native release approval.
