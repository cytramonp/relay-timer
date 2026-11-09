# Timer languages, menu search and egg illustrations

Prepared 9 November 2026.

The web library has English, Spanish, French, German and Portuguese versions at
the existing English URLs and `/es/`, `/fr/`, `/de/`, `/pt/`. All 44 public pages
have complete static translations, self canonicals and reciprocal hreflang links,
including x-default. The sitemap contains 220 URLs. Live audience screens are
translated too, but remain noindex and excluded from the sitemap.

The language menu does not require an account. URLs determine the language;
timer storage keys and account storage remain unchanged. Moving between language
pages restores the same saved setup. The existing paused-on-reload behavior of
specialty timers is preserved. Authored controls are translated; input values,
sound identifiers and user-entered content retain their stored meaning.

All existing English guide text is retained. The localized build checks paragraph,
heading and list counts and fails on missing static messages. Existing guide
screenshots remain in place, with translated captions and alternative text.
Translation catalogs are static, locally served JSON files. No visitor content,
timer state or profile data is sent to a translation service. Initial translations
of already-public copy were prepared with Google's translation service, then
timer terminology and controls were reviewed and corrected in the checked-in
catalogs. `scripts/review-i18n.py` records those terminology corrections.

Menu search filters timer names and activity descriptions in the current language
and also supports English timer names. It ignores case and accents, including
oe/œ and ss/ß. It supports clearing, an empty result message and keyboard use.

The egg timer now has six vector illustrations: translucent uncooked white,
flowing yolk, creamy yolk, jammy yolk, nearly set yolk and fully firm yolk. Shape,
texture and labels all distinguish the stages. A small comparison row marks the
current milestone. Existing timing, alarms and editable stages are unchanged.

## Build and checks

Install the Python build dependency with
`python -m pip install -r scripts/requirements-localization.txt`.
`npm run build:timers` builds the English source pages and all language pages.
It needs no network or translation credentials. `npm run check` checks JS and
JSON; `npm test` includes routing, complete content structure, localized dynamic
messages, search matching and egg milestone/reset tests.

`scripts/collect-runtime-strings.mjs` is an optional translation-authoring helper;
it uses the TypeScript package in the mobile development installation. It is not
required to build or serve the web application. `scripts/collect-i18n.py` extracts
source messages; `scripts/translate-i18n.py` is an explicit one-off authoring tool,
never called by the build or the public site.

## Release boundary

The working checkout contains unrelated mobile and backend work. Source is saved
in the separate `codex/timer-languages-egg-search` branch. A baseline commit records
web changes already present in production; the next commit contains this feature.
The hosting release overlays only files changed during this task, retaining all
other live hashes and the entire existing hosting configuration. It checks the
current release both before staging and before promotion.

Post-release verification uses `python scripts/verify-localization.py`, checking
220 public documents, 17 exact assets, language metadata, and all five noindex
live screens. A sitemap being published or accepted does not establish indexing.
