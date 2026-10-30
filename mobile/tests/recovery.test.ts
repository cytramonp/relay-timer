import test from "node:test";
import assert from "node:assert/strict";
import { defaultConfig } from "../src/core/catalog.ts";
import { createRun, toggleRun } from "../src/core/clock.ts";
import { recoverStore } from "../src/core/recovery.ts";
import { kinds, type Store } from "../src/core/types.ts";

test("foreground recovery archives background completion exactly once", () => {
  const run = toggleRun(
    createRun(
      "simple",
      { ...defaultConfig("simple"), duration: 5 },
      "background",
    ),
    1000,
  );
  const initial: Store = {
    version: 1,
    drafts: Object.fromEntries(
      kinds.map((k) => [k, defaultConfig(k)]),
    ) as Store["drafts"],
    run,
    programs: [],
    history: [],
    settings: { notifications: false, keepAwake: true, haptics: true },
  };
  const recovered = recoverStore(initial, 15000);
  assert.equal(recovered.run!.status, "done");
  assert.equal(recovered.history.length, 1);
  assert.equal(recovered.history[0].elapsed, 5000);
  assert.equal(recovered.history[0].entries[0].actual, 5000);
  assert.equal(recoverStore(recovered, 20000).history.length, 1);
});
