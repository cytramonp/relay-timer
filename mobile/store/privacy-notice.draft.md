# CorpTimer mobile privacy notice — draft for publisher review

**Not publication-ready.** Confirm the operator's full legal name, contact and jurisdiction, intended markets/age range, lawful bases, vendor regions/agreements, access controls, account/billing retention, deletion process and backup handling before publishing. Prepared 2026-10-30. Public notice must identify the same operator as the Play listing.

CorpTimer provides meeting, workout and everyday timers. [PUBLISHER LEGAL NAME AND CONTACT] is responsible for the personal data described here. This notice covers the native mobile app; the website also has optional Google sign-in and private cloud-library synchronization that are not implemented in this native release.

## Your timer data

Agendas, participant names, notes, history, reusable plans, specialty boards, favorites, chosen starting timer and company logo are stored on your device. Programs and history have local limits of 200 and 100 records. They remain until you delete them, reset the relevant library, clear app storage or uninstall. Android automatic app backup is disabled in this release. Exports, copied reports and shared files go to the destination you choose and are retained according to that destination. Company logos are also included in a full device-data export; they are not uploaded to support or billing.

## Checking access and subscriptions

Firebase Authentication creates a persistent anonymous identity when the app checks your trial, Free or Pro access. Cloudflare Workers and D1 receive the identity, random session reservation IDs, first-use and usage timestamps and counts. These records enforce the trial and daily allowance; they do not contain your agenda, notes or timer contents. A network connection is needed for new starts; current timers can continue offline. Standard transport metadata is also processed by service providers. [CONFIRM LAWFUL BASIS, RETENTION, REGIONS AND DELETION PROCESS].

When activated, optional Google account linking uses Android Credential Manager for your basic Google identity/profile and Firebase Authentication to verify and persist sign-in. This allows the same Firebase account to check access on web and Android. No Drive, Gmail, calendar or other Google API permission is requested. This preparation build does not have an OAuth client configured, so the button is disabled. [CONFIRM ACCOUNT DELETION ROUTES AND ASSOCIATED-DATA HANDLING BEFORE ACTIVATION].

If enabled for your store release, Google Play processes optional annual subscriptions and payment information under its own terms and privacy policy. CorpTimer receives a purchase token, product and subscription status/expiry so its server can verify access with Google. The server stores the token and a token hash linked to the current anonymous app identity; restoring the verified purchase to another install reassigns current access. Card data is not entered into CorpTimer. Cancelling retains access until paid expiry; deleting app data does not cancel the store subscription. [CONFIRM TRANSACTION-RECORD RETENTION AND LEGAL REQUIREMENTS]. The 0.4.0 preparation build cannot charge for Pro.

## Optional live links

Creating a live link sends the public meeting title, agenda names/durations/status and countdown to Firebase Firestore. Anyone holding the viewer link can see that projection. A separate capability link can control the timer; share it only with a trusted co-host. Private notes, follow-ups and reports are excluded. Stop sharing deletes the projection, commands and ownership records when successful. Access expires after 24 hours, which does not itself prove physical provider deletion. The anonymous provider account persists independently. [CONFIRM CLOUD ACCOUNT RETENTION/EXPIRY CLEANUP].

## Feedback

The in-app form sends only the message you choose, optional reply email, category, app version and platform through Web3Forms to our support inbox. We use it to respond and improve the service. Unsent drafts are stored locally and cleared after service acceptance. The form's configured submission retention is three years; [CONFIRM SUPPORT-MAILBOX RETENTION/DELETION]. No agenda, history, notes, logo or attachment is added automatically. Providers receive ordinary connection metadata.

## Permissions, security and international processing

Notifications are optional local alerts. Floating mode uses display-over-other-apps permission and a visible Android foreground service. Logo selection uses the system document picker. The app does not record microphone or screen content, access precise location, or include advertising, analytics or AI processing. Firebase, Cloudflare, Google Play and Web3Forms may process data outside your country. [CONFIRM RELEVANT TRANSFER SAFEGUARDS AND HOW TO OBTAIN DETAILS]. We use HTTPS and access controls; no system provides absolute security.

## Choices and requests

You can edit/delete local items, export your data, stop a live link, manage notification/overlay permissions and cancel a subscription in Google Play. Contact us through Support & feedback for access, correction, deletion or another privacy request. [PUBLISHER CONTACT, IDENTITY VERIFICATION, RESPONSE TIMING, APPEAL/COMPLAINT ROUTES AND REGULATOR]. No deletion should be described as immediate provider erasure unless confirmed.

The service is intended for [CONFIRM AGE RANGE]; classroom and brushing presets do not establish a child-directed service or a children's-data policy. [CONFIRM CHILDREN'S ACCESS/CONSENT MEASURES]. We will update this notice for material changes and show the current effective date after publisher approval.
