import test from "node:test";
import assert from "node:assert/strict";
import { defaultConfig } from "../src/core/catalog.ts";
import {
  advance,
  alarmPlan,
  createRun,
  elapsed,
  extendRun,
  formatTime,
  newYearTarget,
  nextPhase,
  remaining,
  sequence,
  switchSide,
  toggleRun,
} from "../src/core/clock.ts";

test("meeting early finish carries spare time and overrun reduces later turns", () => {
  const c = {
    ...defaultConfig("meeting"),
    minimum: 0,
    agenda: [
      { id: "a", name: "A", seconds: 60 },
      { id: "b", name: "B", seconds: 60 },
      { id: "c", name: "C", seconds: 60 },
    ],
  };
  let r = toggleRun(createRun("meeting", c, "meeting", 1000), 1000);
  r = nextPhase(r, 31000);
  assert.equal(remaining(r, 31000), 90000);
  r = nextPhase(r, 151000);
  assert.equal(remaining(r, 151000), 30000);
  r = advance(r, 201000);
  assert.equal(r.status, "running");
  assert.equal(remaining(r, 201000), -20000);
});
test("pausing freezes time and restarting excludes the pause", () => {
  let r = toggleRun(
    createRun("simple", defaultConfig("simple"), "s", 1000),
    1000,
  );
  r = toggleRun(r, 11000);
  assert.equal(elapsed(r, 999000), 10000);
  r = toggleRun(r, 101000);
  assert.equal(elapsed(r, 111000), 20000);
});
test("interval clock catches up across several suspended stages", () => {
  let r = toggleRun(
    createRun(
      "fitness",
      {
        ...defaultConfig("fitness"),
        prepare: 0,
        rounds: 3,
        work: 20,
        rest: 10,
      },
      "f",
      1000,
    ),
    1000,
  );
  r = advance(r, 66000);
  assert.equal(r.index, 4);
  assert.equal(remaining(r, 66000), 15000);
  r = advance(r, 200000);
  assert.equal(r.status, "done");
  assert.equal(r.entries.length, 5);
  assert.equal(r.elapsed, 80000);
});
test("manual intervals wait until Next and do not carry remaining time", () => {
  let r = toggleRun(
    createRun(
      "boxing",
      {
        ...defaultConfig("boxing"),
        prepare: 0,
        work: 10,
        rest: 5,
        rounds: 2,
        automatic: false,
      },
      "b",
    ),
    1000,
  );
  r = advance(r, 31000);
  assert.equal(r.status, "waiting");
  assert.equal(remaining(r, 31000), 0);
  r = nextPhase(r, 40000);
  assert.equal(r.status, "running");
  assert.equal(remaining(r, 40000), 5000);
});
test("custom boxing sequence omits final rest", () => {
  const c = {
    ...defaultConfig("boxing"),
    rounds: 2,
    prepare: 5,
    cooldown: 20,
    customRounds: true,
    overrides: [
      { name: "Technique", work: 90, rest: 30 },
      { name: "Power", work: 120, rest: 45 },
    ],
  };
  assert.deepEqual(
    sequence("boxing", c).map((p) => [p.name, p.ms]),
    [
      ["Get ready", 5000],
      ["Technique", 90000],
      ["Rest", 30000],
      ["Power", 120000],
      ["Cool down", 20000],
    ],
  );
});
test("fitness substitutes set recovery at set boundaries", () => {
  assert.deepEqual(
    sequence("fitness", {
      ...defaultConfig("fitness"),
      rounds: 2,
      sets: 2,
      prepare: 0,
      work: 20,
      rest: 10,
      setRest: 60,
    }).map((p) => p.ms),
    [20000, 10000, 20000, 60000, 20000, 10000, 20000],
  );
});
test("Pomodoro uses long and optional final breaks", () => {
  const c = defaultConfig("pomodoro");
  assert.equal(
    sequence("pomodoro", c).reduce((n, p) => n + p.ms, 0),
    130 * 60000,
  );
  assert.equal(sequence("pomodoro", { ...c, finalBreak: false }).length, 7);
});
test("chess consumes delay before time and adds increment only on the active side", () => {
  let r = toggleRun(
    createRun(
      "chess",
      { ...defaultConfig("chess"), duration: 60, increment: 3, delay: 2 },
      "ch",
    ),
    1000,
  );
  r = advance(r, 2000);
  assert.equal(r.sides[0], 60000);
  assert.equal(r.delayLeft, 1000);
  r = switchSide(r, 0, 5000);
  assert.deepEqual(r.sides, [61000, 60000]);
  assert.equal(r.active, 1);
  assert.deepEqual(r.moves, [1, 0]);
  r = switchSide(r, 0, 6000);
  assert.equal(r.active, 1);
  r = advance(r, 100000);
  assert.equal(r.status, "done");
  assert.equal(r.sides[1], 0);
});
test("extension moves the deadline without resetting elapsed time", () => {
  let r = toggleRun(
    createRun("simple", { ...defaultConfig("simple"), duration: 10 }, "s"),
    1000,
  );
  r = extendRun(r, 60000, 6000);
  assert.equal(remaining(r, 6000), 65000);
});
test("notification plan is bounded and pausing cancels every alert", () => {
  let r = toggleRun(
    createRun(
      "fitness",
      { ...defaultConfig("fitness"), rounds: 99, sets: 20, warning: 5 },
      "n",
    ),
    1000,
  );
  const alarms = alarmPlan(r, 4000);
  assert.ok(alarms.length <= 48);
  assert.ok(alarms.every((a) => a.at > 4000));
  r = toggleRun(r, 4000);
  assert.deepEqual(alarmPlan(r, 4000), []);
});
test("New Year follows the selected zone", () => {
  assert.equal(
    newYearTarget(Date.parse("2026-12-31T20:30:00Z"), "Asia/Dubai"),
    Date.parse("2027-12-31T20:00:00Z"),
  );
  assert.equal(
    newYearTarget(Date.parse("2026-12-31T19:00:00Z"), "Asia/Dubai"),
    Date.parse("2026-12-31T20:00:00Z"),
  );
});
test("running snapshot survives a process restart", () => {
  const r = toggleRun(
    createRun("simple", { ...defaultConfig("simple"), duration: 30 }, "s"),
    1000,
  );
  const recovered = JSON.parse(JSON.stringify(r));
  assert.equal(remaining(advance(recovered, 11000), 11000), 20000);
});
test("format hours, overtime and tenths", () => {
  assert.equal(formatTime(3661000), "1:01:01");
  assert.equal(formatTime(-1500), "+0:02");
  assert.equal(formatTime(12345, true), "0:12.3");
});
