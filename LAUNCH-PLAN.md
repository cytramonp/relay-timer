# CorpTimer: domain, launch and monetization decision

Research checked 26 October 2026. Monetization remains a proposed experiment, not a revenue forecast. The owner subsequently purchased **corptimer.com** through Namecheap; Firebase Hosting and DNS setup are recorded in DEPLOYMENT.md. No paid features, billing activation, outreach or store submission are included in this release.

## Domain decision

Selected primary domain: **corptimer.com**. The following alternative quotes were earlier research, not the selected launch domains.

Porkbun's live search offered enabled Add to cart buttons for these exact names:

| Domain | First year USD | Current annual renewal USD | Use |
| --- | ---: | ---: | --- |
| corptimer.work | 2.06 | 10.81 | Lowest-cost relevant launch choice |
| corptimer.app | 8.75 | 14.93 | Stronger fit for web and future mobile app |

Prices are current registrar quotes, subject to change and applicable taxes. Availability is not a reservation. One domain is sufficient. Do not create multiple competing indexed copies.

- Registration: https://porkbun.com/checkout/search?q=corptimer.work and https://porkbun.com/checkout/search?q=corptimer.app
- Primary tariffs: https://porkbun.com/tld/work and https://porkbun.com/products/domains

## Hosting and safe cutover

Selected host: **Firebase Hosting**, in the existing Firebase project. GitHub remains the source repository and legacy migration address. GitHub Pages explicitly excludes hosting commercial SaaS: https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits

Prepare the existing static `docs/` directory, preserve its relative asset URLs, and keep the Firebase backend. Connect the purchased domain in the hosting dashboard, configure the actual assigned DNS records, wait for HTTPS, then add that exact origin to Firebase Authentication's authorized domains. Verify Google sign-in with the owner and a saved-meeting write/read on the new origin; it has not yet been verified end to end.

Before changing the entry URL, offer Export all on the old site and Import on the new site: browser-local records do not move between origins automatically. Saved Google library records can sync only after authenticated verification. Keep the existing GitHub Pages URL available during migration. Preserve outstanding viewer URLs; test a viewer and controller against the same backend after cutover, using a clearly marked disposable room and clean it up afterward. Add canonical URLs and redirects only after the new address works.

Firebase custom-domain configuration: https://firebase.google.com/docs/hosting/custom-domain

## Positioning

Lead with: **A shared agenda timer that passes saved time to the next speaker.** Show a 20-second demonstration of early finish, overrun and floating display.

Initial audience: independent facilitators, trainers, workshop hosts and organizers of short multi-speaker sessions. Daily scrum is an additional use case, not the initial commercial promise. A small Reddit discussion shows real objections to generic meeting timers and existing substitutes; it does not measure the whole market: https://www.reddit.com/r/scrum/comments/1lmweqq/

The product's valuable job is a visible shared time budget and an on-time finish, with host control and flexible handoffs. Do not sell rigid surveillance of employees.

## Monetization experiment

Keep the core timer, carryover, floating display, agenda editing and existing users' saved data free during validation. No new feature restrictions are proposed for this release.

1. Add optional one-time support, e.g. USD5 or USD10, after a completed session and in the footer. Never interrupt an active timer. This validates goodwill, not recurring willingness to pay.
2. Test a future **Host Pro at USD39/year** after delivering one requested paid capability: custom-branded audience display, reusable team-shared templates, or multiple co-hosts with distinct permissions. These are proposed additions; do not label existing capabilities as new paid features or promise undelivered features.
3. For occasional professional workshops, test a **USD9 event pass** as an alternative to annual billing once the relevant paid features exist. Start with one paid offer, not several plans and a billing matrix.

Donation providers: Ko-fi Free currently charges 0% platform fee for one-time tips when its paid-feature/Standard mode is off; payment processing still applies. Buy Me a Coffee charges 5% plus payment processing. Confirm payout eligibility and the owner's account before integration. Sources: https://help.ko-fi.com/hc/en-us/articles/360002506494-Does-Ko-fi-take-a-fee and https://help.buymeacoffee.com/en/articles/8105744-how-to-calculate-charges-on-your-payment

Market anchors, not direct revenue forecasts:

- TIMEBOX: Free with 8 slots; Professional USD39/year: https://thetimebox.app/pricing/
- Stagetimer: Free, Pro USD210/year, Premium USD420/year; also non-renewing 30-day event licenses. It serves a more professional event-production use case: https://stagetimer.io/pricing/
- Founder Lukas Hermann described USD25,000 monthly revenue in a June 2025 interview. Founder-reported, not independently audited and not current CorpTimer potential: https://www.42lh.com/talks/2025-06-25-starter-story/

## Thirty-day distribution test

Spend the next product cycle on real sessions and reliability rather than more cosmetic variants.

Week 1: chosen domain, stable viewer progress and Google sync checks, installable web app check, clear first-run instructions, optional support link after payout setup. Instrument only the minimum product events with an accurate privacy notice: session started/completed, repeat host, live-share creation, float used and support click. Do not send agenda names, notes or participant names to analytics. Do not infer sessions from visits.

Week 2: recruit 20 relevant hosts through personally authorized outreach or user-made posts. Offer actual use in their next meeting, not a survey about whether the idea sounds good. Prepare one demo and distinct entry pages/presets for workshop timers, meeting agenda timers and speaker timers. The root URL must still open the actual timer immediately. Search phrases are content hypotheses, not measured search volumes.

Week 3: watch real sessions with permission and fix failures. Prioritize Google sync, viewer/progress, screen-sharing behavior and mobile usability. Ask what they currently use, what made them switch and what they would pay to improve.

Week 4: deliver one repeated paid request and offer the USD39/year pilot to those users. Optional product-directory/community submissions come after repeat usage; posting messages still requires explicit user authorization and compliance with each community's rules.

Proposed decision rules (experimental thresholds, not industry benchmarks):

- Continue: at least 10 recruited hosts run real sessions and at least 5 return for another session within 14 days; seek 3 payments for a concrete delivered professional capability.
- Free utility: repeat use exists, but professional users repeatedly decline the offer; maintain a small free product with support contributions and limited development time.
- Pause new feature work: after 20 qualified hosts have genuinely tried it, fewer than 3 repeat and no common unresolved job emerges. Do not infer failure from insufficient traffic or incomplete onboarding alone.

## Android sequence

The repository already has a web manifest and service worker, but real-device install/offline/background behavior needs verification. First finish the installable web experience and test on Android. A store listing itself is not a distribution strategy.

A later Android package can reuse the web app with Trusted Web Activity. This does not grant reliable background alarms, lock-screen operation or a floating overlay over other apps. If users need those, design and test native Android timing/notification behavior explicitly.

Official references:

- https://developer.chrome.com/docs/android/trusted-web-activity
- https://developer.android.com/develop/background-work/services/alarms
- https://support.google.com/googleplay/android-developer/answer/6112435/ (USD25 developer registration)
- https://support.google.com/googleplay/android-developer/answer/14151465?hl=en (applicable new personal accounts: 12 testers continuously opted in for 14 days before production-access application)

Build the Play version after repeat usage demonstrates that mobile installation or native behavior is a real bottleneck. Suggested trigger: at least 10 active hosts explicitly request Android capabilities; this is an internal prioritization rule, not a store requirement.
