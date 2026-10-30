import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { specialtyTimers } from "../../docs/specialty-catalog.js";
import { themeDefaults } from "../../docs/timer-themes.js";
import { byPopularity } from "../../docs/timer-popularity.js";
import { freshBoard, restoreBoard, servingBoard, boardCsv, customProfile } from "../src/core/board.ts";
import { act } from "../src/core/board-engine.js";
test("27 native specialty profiles include current web themes, order, assets and exact clock engine", () => {
  const read = (p: string) => fs.readFileSync(new URL(p, import.meta.url), "utf8");
  const profiles = JSON.parse(read("../src/core/specialty-catalog.json"));
  assert.deepEqual(profiles, specialtyTimers.map(themeDefaults).sort(byPopularity));
  assert.equal(profiles.length, 27);
  assert.equal(read("../src/core/board-engine.js"), read("../../docs/board-engine.js"));
  for (const p of profiles) assert(fs.existsSync(new URL(`../assets/specialty/${p.slug}.png`, import.meta.url)));
});
test("restored running clocks catch up, manual tea holds, invalid imports fail without mutation", () => {
  const initial = freshBoard(customProfile), running = act(initial, 0, "toggle", "sequence", 1000);
  assert.equal(restoreBoard(running, "sequence", 302000)[0].index, 1);
  const manual = act(initial.map(c => ({ ...c, automatic: false })), 0, "toggle", "sequence", 1000);
  const held = restoreBoard(manual, "sequence", 302000)[0];
  assert.equal(held.index, 0); assert.equal(held.waiting, true); assert.equal(held.anchor, null);
  assert.throws(() => restoreBoard([{ ...initial[0], stages: [{ name: "bad", seconds: -1 }] }], "sequence", 0));
  assert.throws(() => restoreBoard([{ ...initial[0], laps: ["bad"] }], "sequence", 0));
  const up = freshBoard({ ...customProfile, mode: "up", stages: [{ name: "Lap", seconds: 0 }] });
  assert.equal(restoreBoard(up, "up", 5000)[0].stages[0].seconds, 0);
});
test("serving planner aligns independent dish completion; CSV quotes names", () => {
  const board = freshBoard(customProfile), next = servingBoard(board, 900000, 0);
  assert.equal(next[0].scheduledAt! + 360000, 900000);
  assert.throws(() => servingBoard(board, 200, 0));
  board[0].name = 'Dish, "one"';
  assert(boardCsv(board, 0).includes('"Dish, ""one"""'));
});
