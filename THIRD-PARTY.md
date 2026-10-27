# Third-party assets

- **Manrope variable font**: downloaded from the Google Fonts repository, `ofl/manrope/Manrope[wght].ttf`. SIL Open Font License 1.1; included at `docs/fonts/OFL.txt`. Source: https://github.com/google/fonts/tree/main/ofl/manrope
- **QR Code Generator**, Kazuhiko Arase: self-hosted ES module from the official `js/dist/qrcode.mjs` source, stored as `docs/vendor/qrcode.js` for consistent static-host MIME handling. MIT license included at `docs/vendor/QR-LICENSE.txt`. Source: https://github.com/kazuhikoarase/qrcode-generator
- **Firebase Web SDK 13.1.0**: loaded from Google's official gstatic distribution; no analytics SDK is initialized.
- **Sign in with Google buttons**: official light pill PNG assets for Android and Web, at 4x resolution, from https://developers.google.com/static/identity/images/signin-assets.zip (23 October 2026). Standard and icon-only variants are used unmodified, with source provenance embedded as PNG metadata. These are Google brand assets, not covered by this repository's license. Guidance: https://developers.google.com/identity/branding-guidelines

robot.com is a user-selected visual reference. Its logo, photography, video and proprietary font files are not distributed with this application. The timer library also ships its own generated raster illustrations.

- **Cantata One**: self-hosted from https://github.com/google/fonts/tree/main/ofl/cantataone. SIL Open Font License 1.1 included at `docs/fonts/CantataOne-OFL.txt`.

- **Timer illustrations**: eight original generated editorial/comic scenes in `docs/assets/timer-illustrations.jpg`, created with the built-in ImageGen tool on 26 October 2026. The atlas uses the existing CorpTimer palette and does not copy third-party artwork. Full prompt: `outputs/timer-library/illustration-prompt.txt` and embedded JPEG COM metadata.
