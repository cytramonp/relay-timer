# Bundled asset provenance

- icon.png, adaptive-icon.png, splash-icon.png, favicon.png: rasterized/resized from the existing original CorpTimer glasses in repository `docs/icon.svg`. Source retained in the repository.
- boxing.jpg, fitness.jpg, pomodoro.jpg, classroom.jpg, chess.jpg, stopwatch.jpg, simple.jpg, newyear.jpg: cropped and optimized from the previously approved AI-generated CorpTimer atlas at docs/assets/timer-illustrations.jpg. The exact original generation prompt is retained in outputs/timer-library/illustration-prompt.txt and the original JPEG metadata. Mobile crops carry the source in their JPEG comments.
- bell.wav, gong.wav, beep.wav: short synthesized PCM tones produced by scripts/prepare-assets.py; no sampled third-party audio.
- Manrope.ttf and CantataOne-Regular.ttf: copied from the website's self-hosted fonts; the corresponding OFL license files are bundled alongside them.

The unused Expo template icon assets are not part of the configured application identity.

The 0.2 source also embeds these origins in all twelve rasters using Impeccable's PNG text/JPEG comment format. The provenance scan reports zero missing origins, and decoded RGBA hashes confirm the metadata operation changed no pixels. Regenerating assets must preserve or re-embed those origins; no new artwork was generated for the Meeting redesign.
