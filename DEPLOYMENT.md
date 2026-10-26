# CorpTimer deployment

Primary origin: **https://corptimer.com/**

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
