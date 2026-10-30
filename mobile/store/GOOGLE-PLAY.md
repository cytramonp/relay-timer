# Google Play release preparation — 0.4.0 (6)

This package is prepared for **internal testing**, not an assertion of production approval.
The APK is for direct testing. Google Play receives the signed **Android App Bundle (.aab)**.

## Build and signing

- Package: `com.corptimer.app`; version `0.4.0`; version code `6`.
- Target SDK 36; compile/build tools 37; native ARM64 and x86-64.
- Billing Client 9.1.0. No microphone or broad photo/storage permissions.
- User-enabled floating countdown: `specialUse` foreground service, visible notification and Close control.
- Android automatic app backup is disabled. Explicit exports remain available.
- APK keeps the historical beta/debug certificate so it can update the earlier sideloaded beta.
- The Play bundle uses a **separate persistent RSA-4096 upload key**. It must never use the beta/debug certificate.
- Upload certificate SHA-256: `BC2A570E7F8A08509ACDFB0F9756E395C3EDD091A1FB276030A76E1FE8430BB2`.
- Private key and credentials are excluded from Git. Local backup: `D:/Codex_C/Personal/relay-timer/.local/play-upload/`.
- CI can build an unsigned bundle for local signing; alternatively it can use task-approved GitHub Actions secrets. Never publish keystores, passwords, service-account JSON or credentials in release assets.

CI workflow: `.github/workflows/mobile-android.yml`. It compiles the APK, checks its manifest and every ELF LOAD segment for 16 KB alignment, and exercises actual phone/tablet native UI. When a CI upload key is configured it also validates the signed bundle with bundletool. Local signing must separately verify the resulting JAR signature and bundle validity.

## What must happen in Play Console

1. Create/verify the owner's developer account and create `com.corptimer.app`. Do not pay registration fees or accept account terms on the owner's behalf without permission. Read-only verification on 2026-10-30 reached the “Creating a developer account” signup page for the current owner Google identity; no existing developer dashboard was available.
2. Upload the signed AAB to **Internal testing** and enroll Play App Signing. Use the persistent upload certificate above, not the APK beta certificate.
3. Create subscription `corptimer_pro_yearly`, base plan `annual`, auto-renewing annual billing; configure the approved $4.99/year reference price and country-specific prices/taxes in Play. Native UI displays the actual localized price supplied by Play, never a made-up conversion.
   Register the Android package and actual **Play App Signing** SHA-1 certificate in the existing Firebase/Google Auth project. Put its Web OAuth client ID in `googleWebClientId`. The optional native Google button uses Credential Manager 1.6.0 and Firebase credential linking/sign-in; no additional Google API scopes are requested. Test the same Google identity on web and native for shared account entitlement. Native purchase requires signed-in identity. This preparation build has an empty client ID and cannot perform Google sign-in. Verify account deletion across the shared web/native identity before activating account creation for production.
4. Connect a least-privilege Play Developer API service account to the existing billing Worker. Store its JSON only as `PLAY_SERVICE_ACCOUNT` in the server's secret store. Apply the additional `play_purchases` table to the **existing** D1 database. Deploy the merged Worker without replacing Stripe secrets or account data. No deployment of this native extension is implied by committing it.
5. For license testing only, set server `PLAY_ALLOW_TEST=true`. Test success, decline, pending → paid, cancellation through expiry, restore/reinstall, refund, grace, hold, repeated taps and network interruption through the actual Play-installed build. Disable test entitlements for the public production server after the agreed testing configuration is separated.
6. Set `mobile/src/config/billing-public.json` `purchasesEnabled:true` **only after** the product and verification endpoint are working. This 0.4.0 preparation build deliberately has purchases disabled. Rebuild with a higher version code for the payment-enabled release.
7. Complete the publisher's support email (Play requires one), privacy URL, audience, content rating, ads declaration, data-safety and foreground-service declaration. Public contact details belong in the Play publisher profile; the app's feedback recipient is still hidden.
8. Complete applicable account testing / production-access requirements and review the pre-launch report. New personal accounts currently require at least 12 opted-in testers continuously for 14 days before applying for production access. Internal testing does not itself satisfy this requirement.

**Production blockers:** developer-account status, Android OAuth/app-signing certificate setup and real shared-account login test, live Play subscription configuration and credential connection, real store purchase tests, account-deletion readiness for enabled sign-in, finalized publisher identity/privacy/contact and live policy URL, store declarations and any mandatory closed test. A valid signed AAB alone does not clear these gates.

## Listing assets

- `metadata.en.json`: listing and release copy.
- `assets/icon-512.png`: Play icon.
- `assets/feature-graphic.png`: 1024×500 feature graphic.
- `screenshots/`: actual native captures, populated after the release APK passes CI. Do not substitute web screenshots for native evidence.
- `privacy-notice.draft.md`: code-based notice; unresolved publisher/vendor retention facts are marked. Do not submit the draft as a final policy.
- `data-safety.draft.json`: proposed answers to reconcile with the publisher's vendor settings and Play definitions.

Foreground service review description: “When the user taps Open floating timer and grants display-over-other-apps permission, CorpTimer shows a movable countdown with Next, Pause/Resume, Undo and Close above another app. A persistent notification indicates this service. It stops when closed or when the task ends. It does not record the screen, other apps or audio.” Attach the actual native floating-mode demonstration and verify the physical-device experience.

## Sources checked for this release

- https://support.google.com/googleplay/android-developer/answer/9859152
- https://support.google.com/googleplay/android-developer/answer/14151465
- https://developer.android.com/google/play/requirements/target-sdk
- https://developer.android.com/guide/practices/page-sizes
- https://developer.android.com/google/play/billing/integrate
- https://developer.android.com/google/play/billing/security
- https://developers.google.com/android-publisher/api-ref/rest/v3/purchases.subscriptionsv2/get

Recheck these time-sensitive requirements at actual submission.
