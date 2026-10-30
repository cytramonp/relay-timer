import { test } from "node:test";
import assert from "node:assert/strict";
import { defaultConfig } from "../src/core/catalog.ts";
import {
  createRun,
  toggleRun,
  nextPhase,
  remaining,
  advance,
  extendRun,
  report,
} from "../src/core/clock.ts";
import {
  allocate,
  deadlineFor,
  editDuration,
  editMeetingRun,
  meetingProjection,
  meetingView,
  moveBoundary,
  nudgeMeeting,
  splitSeconds,
  undoMeeting,
} from "../src/core/meeting.ts";
const setup = () => ({
  ...defaultConfig("meeting"),
  minimum: 15,
  agenda: [
    { id: "w", name: "Welcome", seconds: 120, kind: "topic" as const },
    { id: "a", name: "Alex", seconds: 240 },
    { id: "b", name: "Morgan", seconds: 240 },
  ],
  total: 600,
});
const start = () => toggleRun(createRun("meeting", setup(), "test", 0), 0);
test("default meeting is one hour: five-minute welcome and five equal participants", () => {
  const c = defaultConfig("meeting");
  assert.equal(c.title, "Meeting");
  assert.equal(c.agenda[0].name, "Welcome");
  assert.equal(c.agenda[0].seconds, 300);
  assert.equal(c.agenda[1].name, "Alex");
  assert.equal(c.agenda.length, 6);
  assert.equal(c.total, 3600);
  assert.equal(
    c.agenda.reduce((sum, slot) => sum + slot.seconds, 0),
    3600,
  );
  assert.ok(c.agenda.slice(1).every((slot) => slot.seconds === 660));
});
test("next budget uses shared deadline and changes if the current speaker stops now", () => {
  const r = start();
  assert.equal(meetingView(r.config, r, 60000).nextBudget, 300000);
  assert.equal(meetingView(r.config, r, 180000).nextBudget, 180000);
  const next = nextPhase(r, 60000);
  assert.equal(remaining(next, 60000), 300000);
});
test("reorder keeps current speaker by ID and visits pending slots before and after them", () => {
  let r = nextPhase(start(), 60000);
  const c = {
    ...r.config,
    agenda: [r.config.agenda[2], r.config.agenda[0], r.config.agenda[1]],
  };
  r = editMeetingRun(r, c, 90000);
  assert.equal(r.phases[r.index].id, "a");
  r = nextPhase(r, 90000);
  assert.equal(r.phases[r.index].id, "b");
  assert.equal(r.entries[0].id, "w");
});
test("undo handoff preserves meeting elapsed rather than rewinding time", () => {
  const r = undoMeeting(nextPhase(start(), 60000), 90000);
  assert.equal(r.phases[r.index].id, "w");
  assert.equal(r.entries.length, 0);
  assert.equal(remaining(r, 90000), 30000);
});
test("next on a paused meeting resumes the next turn", () => {
  const paused = toggleRun(start(), 30000),
    next = nextPhase(paused, 60000);
  assert.equal(next.status, "running");
  assert.equal(next.elapsed, 30000);
});
test("equal times includes topics, clears pins and freezes completed slots", () => {
  const r = nextPhase(start(), 120000);
  const c = allocate(
    {
      ...r.config,
      agenda: r.config.agenda.map((a) => ({ ...a, pinned: true })),
    },
    r,
    600,
    true,
  );
  assert.equal(c.agenda[0].seconds, 120);
  assert.deepEqual(
    c.agenda.slice(1).map((a) => a.seconds),
    [240, 240],
  );
  assert.ok(c.agenda.slice(1).every((a) => !a.pinned));
});
test("automatic split keeps topic and pinned budgets, proportional total respects completed slots", () => {
  const c = setup();
  assert.deepEqual(
    allocate(c, null, 720).agenda.map((a) => a.seconds),
    [120, 300, 300],
  );
  assert.deepEqual(
    allocate({ ...c, autoSplit: false }, null, 1200).agenda.map(
      (a) => a.seconds,
    ),
    [240, 480, 480],
  );
});
test("boundary drag conserves total and changes the adjacent pair with proportions off", () => {
  const c = moveBoundary({ ...setup(), keepProp: false }, null, 0, 180);
  assert.deepEqual(
    c.agenda.map((a) => a.seconds),
    [180, 180, 240],
  );
  const prop = moveBoundary(setup(), null, 0, 180);
  assert.equal(
    prop.agenda.reduce((n, a) => n + a.seconds, 0),
    600,
  );
  assert.equal(prop.agenda[0].seconds, 180);
});
test("manual minutes edit uses proportional peers and original plan survives changes/extension", () => {
  const r = start(),
    c = editDuration(r.config, r, "a", 300),
    changed = editMeetingRun(r, c, 10000),
    extended = extendRun(changed, 60000, 10000);
  assert.equal(extended.originalAgenda?.[0].seconds, 120);
  assert.equal(extended.config.agenda[0].seconds, c.agenda[0].seconds + 60);
  assert.ok(extended.planChanges!.length >= 2);
});
test("automatic handoff traverses long gaps by deadlines, including zero-length slots", () => {
  const c = { ...setup(), automatic: true, minimum: 0 };
  c.agenda[0].seconds = 0;
  const r = advance(toggleRun(createRun("meeting", c, "test", 0), 0), 900000);
  assert.equal(r.status, "done");
  assert.equal(r.elapsed, 480000);
  assert.equal(r.entries.length, 3);
});
test("clock correction preserves logged turns and never goes before current start", () => {
  const r = nextPhase(start(), 60000),
    corrected = nudgeMeeting(r, -600000, 90000);
  assert.deepEqual(corrected.entries, r.entries);
  assert.equal(corrected.elapsed, r.phaseStart);
});
test("public projection excludes notes, follow-ups, reports and internal identifiers", () => {
  const r = {
    ...start(),
    notes: "PRIVATE",
    parking: [
      { id: "private", text: "PRIVATE", owner: "PRIVATE", done: false },
    ],
  };
  const data = JSON.stringify(meetingProjection(r.config, r, 1000));
  assert.ok(!data.includes("PRIVATE"));
  assert.ok(!data.includes('"id"'));
});
test("report preserves planned values by stable ID after reordering", () => {
  let r = nextPhase(start(), 60000);
  r = editMeetingRun(
    r,
    { ...r.config, agenda: [...r.config.agenda].reverse() },
    60000,
  );
  r = nextPhase(r, 90000);
  assert.equal(report(r).entries[1].planned, 240000);
  assert.equal(report(r).originalAgenda?.[0].name, "Welcome");
});
test("allocation and deadlines match the web numeric contract", () => {
  assert.deepEqual(splitSeconds(75, [1, 1, 1]), [30, 30, 15]);
  assert.equal(deadlineFor(setup().agenda, "a", 400000, 15), 415000);
});
