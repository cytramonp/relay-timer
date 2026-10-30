# Support form

The Support & feedback screen stays inside the application. It validates a message of 10–5,000 characters and an optional reply email, saves an unsent draft locally, prevents concurrent sends and shows validation, offline, timeout, rate-limit and service-failure states. An error never masquerades as delivery. The success copy says the delivery service accepted the message.

Web3Forms routes a public form alias to the support mailbox. The recipient address and account credentials are not bundled in the application. A public alias can be used only for form submissions, not to read email or administer the account. `EXPO_PUBLIC_FEEDBACK_FORM_KEY` can override the dedicated default alias for a separate build environment. It is intentionally a public client identifier, not a secret.

The owner approved the free account, terms, CAPTCHA and one synthetic test on 2026-10-28. The dashboard confirmed the Free plan, one form, 250 submissions/month, basic spam protection and no paid autoresponder. Its configured retention was three years; no retention reduction or paid feature was enabled.

## Verified delivery

The compiled web preview's actual Send message action submitted exactly one nonempty message, labelled TEST / QA — DO NOT CONTACT and tagged `CT-FEEDBACK-20261028-01`. The service accepted it and the owner's Gmail INBOX contained the matching message at 21:33:10 PDT on 2026-10-28. The plain-text email body contained the message, category, app_version and platform; no agenda or participant data was present. The preview's Expo manifest reported the older `0.1.0` metadata; the new public native configuration is independently `0.3.0`, Android code 5 / iOS build 5. This delivery test proves transport from the browser preview, not yet native-device networking.

Empty and invalid-email submissions were stopped locally. Reopening the form restored the draft. Native regression runs only the empty-form validation and UI flow; they deliberately send no additional nonempty test messages.

Sources: https://docs.web3forms.com/getting-started/api-reference and https://docs.web3forms.com/getting-started/faq . Actual provider retention, quota and recipient were inspected in its authenticated settings. Privacy inventory: `store/data-inventory.md`.
