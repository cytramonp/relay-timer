const sharp = require("sharp");
const fs = require("node:fs/promises");
const path = require("node:path");
(async () => {
  const root = path.resolve(__dirname, "..");
  const source = await sharp(path.resolve(root, "../docs/icon.svg"))
    .resize(1024, 1024)
    .flatten({ background: "#eeece5" })
    .png()
    .toBuffer();
  await fs.writeFile(path.join(root, "assets/icon.png"), source);
  await fs.writeFile(path.join(root, "assets/splash-icon.png"), source);
  await sharp(path.resolve(root, "../docs/icon.svg"))
    .resize(512, 512)
    .extend({
      top: 256,
      bottom: 256,
      left: 256,
      right: 256,
      background: "#eeece5",
    })
    .png()
    .toFile(path.join(root, "assets/adaptive-icon.png"));
  await sharp(source)
    .resize(64, 64)
    .png()
    .toFile(path.join(root, "assets/favicon.png"));
})();
