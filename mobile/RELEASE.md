# Mobile release checklist

## Owner setup

- Confirm Apple Developer and Google Play account ownership/type and app identifiers.
- Confirm Expo account/project and cloud-build budget before paid resource use.
- Keep signing keys in EAS/store-managed storage; never commit them.
- Provide the publisher's contact details and support/privacy URLs for the listings.

## Before store submission

- Obtain signed builds for both platforms.
- Test on actual iPhone, Android and supported tablet classes; document OS versions.
- Verify schedule/cancel/restart notifications through screen lock, permission denial/revocation, Focus, Doze and process termination.
- Verify sound/voice with music, Bluetooth headphones and interruptions.
- Check import, export, process recovery, large text, dark theme, keyboard and Back navigation.
- Resolve or explicitly assess the Expo CLI transitive dependency advisories recorded in VALIDATION.md before enabling OTA signing or exposing development tooling.
- Capture real native screenshots in current store-required sizes. Browser images are not store screenshots.
- Review the proposed store descriptions in store/metadata.en.json against the tested binary.
- Publish an accurate privacy notice and support page with the owner's contact information. Complete Apple privacy/Google Data Safety and age-rating forms.
- For applicable new personal Google accounts, complete the current closed-test requirement before requesting production access.
- Submit builds, respond to review feedback, choose release timing and verify actual store installation. Upload success alone is not store release.

## Later integrations from the full product plan

Website identity/private-library synchronization, Sign in with Apple and AlarmKit/Live Activities remain unimplemented. Beta 0.2.0 adds explicit anonymous live audience/control and a native Android overlay; the worklist and VALIDATION.md distinguish source implementation from completed network, simulator and physical-device checks. Arbitrary system overlays are unavailable on iOS.
