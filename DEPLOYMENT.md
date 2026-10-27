# CorpTimer deployment

Primary origin: **https://corptimer.com/**

Cutover verified, 25 October 2026 (America/Los_Angeles): **https://corptimer.com/** returns HTTP 200 with valid TLS and loads the application in the browser. **https://www.corptimer.com/** redirects to that primary origin. Firebase recognizes both domains as `HOST_ACTIVE` / `OWNERSHIP_ACTIVE`; its managed certificates are in `CERT_PROPAGATING`, so provider-wide certificate distribution is still finishing. No TLS validation was bypassed. Browser QA on the custom domain confirmed that the countdown advances, Pause freezes it and Reset restores the initial timer.

- Repository: https://github.com/cytramonp/relay-timer
- Local checkout: `D:\Codex_C\Personal\relay-timer`
- Hosting: Firebase project/site `relay-timer-web-7c39`, public directory `docs/`.
- Provider URL: https://relay-timer-web-7c39.web.app/
- Registrar: Namecheap; DNS changes are made in the owner's Chrome session.
- `www.corptimer.com` is configured as a 301 redirect to `corptimer.com` in Firebase Hosting.

## DNS

| Type | Host | Value |
| --- | --- | --- |
| A | @ | 199.36.158.100 |
| TXT | @ | hosting-site=relay-timer-web-7c39 |
| CNAME | www | relay-timer-web-7c39.web.app. |

An additional public ACME TXT verification record is configured for the apex. Keep it while certificate issuance is pending; consult Firebase's current desired records before changing it. The www alias can also validate through Firebase's HTTP challenge. Existing mail forwarding/SPF settings are preserved. Do not replace unrelated DNS records or nameservers.

DNS propagation and managed certificate issuance are separate from publishing site files. A successful deploy does not by itself prove the custom domain has valid HTTPS. Verify both origins without bypassing TLS validation.

## Authentication and data continuity

Firebase Authentication's authorized domains include `corptimer.com` and `www.corptimer.com`, alongside the existing Firebase, GitHub Pages and local development origins. Google provider, Firestore database and rules are unchanged.

Browser storage is origin-specific. Keep https://cytramonp.github.io/relay-timer/ available for **My meetings → Export all**, then **Import** the backup on the new domain. Signed-in saved libraries use the existing Firebase backend; verify real Google sign-in and a saved record read/write with the owner before claiming end-to-end synchronization on the new origin. Existing viewer links continue to use that backend; do not revoke real rooms during deployment QA.

## Releases

Run `npm run check` and appropriate model tests before publication. `.firebaserc` and `firebase.json` support the official Firebase CLI. `scripts/deploy-hosting.py` publishes the same directory through Firebase's REST deploy API using a process-only short-lived Google Cloud access token; see README.md for the command.

Commit and push source separately. Firebase Hosting does not automatically deploy on GitHub pushes. Do not introduce permanent deploy credentials or enable billing without the owner's approval.

## Timer library release - 26 October 2026

Controls follow-up: `sites/relay-timer-web-7c39/releases/1793067097278000` publishes 59 files with the native timer dropdown, compact lower picker, red/teal outlined controls, actual-config preset selection and paired-line accents. Existing 42 tests pass; browser checks cover selection after edits/reload, menu navigation, Escape, outside click and menu bounds at 320px. The independent narrow review returned Ship. Details: `outputs/timer-library/controls-release.json`.

Published the fourteen standalone tools, timer directory and page-specific How it works and advice disclosures, including the Meeting Timer guide. Firebase release: `sites/relay-timer-web-7c39/releases/1793059330139000`, 58 public files. All 42 tests pass. The canonical domain returned HTTP 200 on all sixteen sitemap URLs; fifteen timer pages contain the closed static guide. Published CSS, JavaScript and the illustration atlas match the checked local bytes. See `outputs/timer-library/public-verification.json` and `validation.md` for scoped evidence.

The Search Console HTTPS URL-prefix property is verified. The submitted `/sitemap.xml` has Success status and sixteen discovered pages. Preserve `docs/google9b7523e5b6829d1e.html` to retain ownership. `robots.txt` permits OAI-SearchBot and references the sitemap; `llms.txt` lists the public tools. Submission and discovery do not establish indexing or search visibility.

Release verification: 29 model tests and JavaScript/JSON checks pass. The deployed provider origin returned HTTP 200 with the new canonical URL and outlined-panel stylesheet. Browser QA confirmed Start, Next speaker with carried time, Pause, Undo and Reset. Google authorized-domain configuration was reread after update; a real Google sign-in and saved-meeting sync on the .com origin still require owner verification.
