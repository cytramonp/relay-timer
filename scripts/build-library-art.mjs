import fs from "node:fs";
import { createRequire } from "node:module";
import { specialtyTimers } from "../docs/specialty-catalog.js";
const require = createRequire(
  new URL("../mobile/package.json", import.meta.url),
);
const sharp = require("sharp");
fs.mkdirSync("mobile/assets/specialty", { recursive: true });
for (const p of specialtyTimers) {
  await sharp(`docs/assets/${p.slug}.svg`)
    .png()
    .toFile(`docs/assets/${p.slug}.png`);
  fs.copyFileSync(
    `docs/assets/${p.slug}.png`,
    `mobile/assets/specialty/${p.slug}.png`,
  );
}
fs.writeFileSync(
  "mobile/src/core/specialty-art.ts",
  "export const specialtyArt: Record<string, number> = {\n" +
    specialtyTimers
      .map(
        (p) =>
          `  '${p.slug}': require('../../assets/specialty/${p.slug}.png'),`,
      )
      .join("\n") +
    "\n};\n",
);
