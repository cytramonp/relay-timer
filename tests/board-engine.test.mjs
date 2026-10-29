import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  createBoard,
  act,
  settle,
  elapsed,
  display,
} from "../docs/board-engine.js";
import { specialtyTimers } from "../docs/specialty-catalog.js";
const profile = (mode = "sequence") => ({
  mode,
  count: 3,
  stages: [
    { name: "Work", seconds: 10 },
    { name: "Rest", seconds: 5 },
  ],
});
test("individual starts, pauses and lap splits do not change other athletes", () => {
  let b = createBoard(profile("up"));
  b = act(b, 0, "toggle", "up", 1000);
  b = act(b, 1, "toggle", "up", 3000);
  b = act(b, 0, "lap", "up", 5000);
  b = act(b, 0, "pause", "up", 6000);
  assert.equal(elapsed(b[0], 20000), 5000);
  assert.equal(elapsed(b[1], 20000), 17000);
  assert.equal(elapsed(b[2], 20000), 0);
  assert.deepEqual(b[0].laps, [4000]);
});
test("sequence catches up over boundaries and stops at final deadline", () => {
  let b = act(createBoard(profile()), 0, "toggle", "sequence", 0);
  let c = settle(b[0], "sequence", 12000);
  assert.equal(c.index, 1);
  assert.equal(display(c, "sequence", 12000), "0:03");
  c = settle(c, "sequence", 20000);
  assert.equal(c.done, true);
  assert.equal(c.anchor, null);
  assert.equal(display(c, "sequence", 20000), "0:00");
});
test("early handoff starts the recovery from the handoff timestamp", () => {
  let b = act(createBoard(profile()), 0, "toggle", "sequence", 0);
  b = act(b, 0, "next", "sequence", 2000);
  assert.equal(display(b[0], "sequence", 2000), "0:05");
  assert.equal(display(b[0], "sequence", 4000), "0:03");
});
test("turn handoff keeps only one player running and preserves time banks", () => {
  let b = createBoard({
    ...profile("turn"),
    stages: [{ name: "Bank", seconds: 60 }],
  });
  b = act(b, 0, "toggle", "turn", 0);
  b = act(b, 0, "next", "turn", 10000);
  assert.equal(b.filter((c) => c.anchor !== null).length, 1);
  assert.equal(b[1].anchor, 10000);
  assert.equal(display(b[0], "turn", 30000), "0:50");
  b = act(b, 2, "toggle", "turn", 20000);
  assert.equal(b[1].anchor, null);
  assert.equal(b[2].anchor, 20000);
});
test("extension changes current stage and reset clears only its clock", () => {
  let b = act(createBoard(profile()), 0, "toggle", "sequence", 0);
  b = act(b, 0, "add", "sequence", 5000);
  assert.equal(display(b[0], "sequence", 5000), "1:05");
  assert.equal(b[0].stages[1].seconds, 5);
  assert.equal(b[1].stages[0].seconds, 10);
  b = act(b, 0, "reset", "sequence", 9000);
  assert.equal(b[0].anchor, null);
  assert.equal(b[0].elapsed, 0);
});
test("public social images exist for every specialty page", () => {
  for (const p of specialtyTimers) {
    assert.ok(fs.statSync(`docs/assets/${p.slug}.png`).size > 1000);
    assert.ok(
      fs.readFileSync(`docs/${p.slug}/index.html`, "utf8").includes(`og:image`),
    );
  }
});
