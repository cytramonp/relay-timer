import test from "node:test";
import assert from "node:assert/strict";
import { defaultConfig } from "../src/core/catalog.ts";
import {
  csv,
  readBackup,
  validateConfig,
  writeBackup,
} from "../src/core/backup.ts";
import type { Program } from "../src/core/types.ts";

test("mobile backup round-trips as an independent program without session data", () => {
  const p: Program = {
    id: "original",
    name: "My rounds",
    kind: "boxing",
    updatedAt: 1,
    config: defaultConfig("boxing"),
  };
  const json = writeBackup([p]);
  const [restored] = readBackup(json, () => "independent", 1000);
  assert.equal(restored.id, "independent");
  assert.equal(restored.name, "My rounds");
  assert.equal(restored.updatedAt, 1000);
  assert.deepEqual(restored.config, p.config);
  assert.ok(!json.includes("notes"));
});
test("web standalone setup can be imported", () => {
  const [p] = readBackup(
    JSON.stringify({
      version: 1,
      kind: "fitness",
      config: { rounds: 8, work: 20, rest: 10 },
    }),
    () => "x",
  );
  assert.equal(p.kind, "fitness");
  assert.equal(p.config.rounds, 8);
});
test("web meeting import strips private notes and skips deleted records", () => {
  const rows = readBackup(
    JSON.stringify({
      meetings: [
        {
          title: "Standup",
          state: {
            agenda: [{ name: "Ada", min: 5 }],
            parking: [{ text: "private" }],
            run: { t0: 12 },
          },
        },
        { deleted: true },
      ],
    }),
    () => "x",
  );
  assert.equal(rows.length, 1);
  assert.equal(rows[0].config.agenda[0].seconds, 300);
  assert.ok(!JSON.stringify(rows).includes("private"));
});
test("invalid numbers, zero rounds, duplicate agenda IDs and unknown kinds fail import", () => {
  assert.throws(() => validateConfig("boxing", { rounds: 0 }));
  assert.throws(() => validateConfig("boxing", { work: NaN }));
  assert.throws(() => validateConfig("boxing", { sets: 1.5 }));
  assert.throws(() =>
    validateConfig("meeting", {
      agenda: [
        { id: "a", name: "a", seconds: 1 },
        { id: "a", name: "b", seconds: 2 },
      ],
    }),
  );
  assert.throws(() =>
    readBackup('{"version":1,"kind":"other","config":{}}', () => "x"),
  );
  assert.throws(() => readBackup("oops", () => "x"));
});
test("unknown fields are stripped and invalid zones fail validation", () => {
  const c = validateConfig("simple", { title: "Simple", secret: "no" });
  assert.ok(!("secret" in c));
  assert.throws(() => validateConfig("newyear", { zone: "invalid/zone" }));
});
test("CSV quotes embedded delimiters and neutralizes formula cells", () => {
  assert.equal(csv([["=SUM(A1)", 'a,"b"', 12]]), '"\'=SUM(A1)","a,""b""","12"');
});
