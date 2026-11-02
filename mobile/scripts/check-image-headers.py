"""Fail before native compilation if a bundled image has a misleading suffix."""
from pathlib import Path

root = Path(__file__).resolve().parents[1]
count = 0
for folder in (root / "assets", root / "docs/custom-timers/screenshots"):
    for image in folder.rglob("*"):
        if image.suffix.lower() not in (".png", ".jpg", ".jpeg"):
            continue
        header = image.read_bytes()[:12]
        expected = b"\x89PNG\r\n\x1a\n" if image.suffix.lower() == ".png" else b"\xff\xd8\xff"
        if not header.startswith(expected):
            raise SystemExit(f"Image format does not match extension: {image.relative_to(root)}")
        count += 1
print(f"Verified {count} image headers before native compilation")
