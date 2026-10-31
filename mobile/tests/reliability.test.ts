import test from "node:test";
import assert from "node:assert/strict";
import {
  act,
  settle,
  createBoard,
  display,
  seekCard,
} from "../src/core/board-engine.js";
import {
  freshBoard,
  customProfile,
  servingBoard,
  boardCsv,
} from "../src/core/board.ts";
import { boardSessionContinues, appendLap } from "../src/core/session.ts";
import { writeBackup, readBackup, validateConfig } from "../src/core/backup.ts";
import {
  writeDeviceBackup,
  readDeviceBackup,
} from "../src/core/device-backup.ts";
import { emptyStore } from "../src/core/store-codec.ts";
import {
  isUserDataKey,
  isPortableDataKey,
  checkBackupSize,
} from "../src/core/data-keys.ts";
import { scopedRepository } from "../src/core/data-repository.ts";
import { latestEffect } from "../src/core/latest-effect.ts";
import { commandQueue } from "../src/core/remote-commands.ts";
import { timebase } from "../src/core/timebase.ts";
import { createRun, toggleRun, alarmPlan } from "../src/core/clock.ts";
import { defaultConfig } from "../src/core/catalog.ts";
import { boardAlarmPlan } from "../src/core/board-alarms.ts";
import { bufferedWriter } from "../src/core/buffered-writer.ts";
import { withDeadline, checkDeadline } from "../src/core/deadline.ts";

test("buffered edits flush once; critical writes and reset supersede older text", () => {
  const saved: string[] = [];
  const writer = bufferedWriter<string>((v) => {
    saved.push(v);
    return true;
  });
  writer.schedule("a");
  writer.schedule("ab");
  writer.flush();
  assert.deepEqual(saved, ["ab"]);
  writer.schedule("older");
  writer.write("paused-latest");
  writer.flush();
  assert.deepEqual(saved, ["ab", "paused-latest"]);
  writer.schedule("deleted");
  writer.discard();
  writer.flush();
  assert.equal(saved.length, 2);
});
test("deadline covers a hung identity and prevents a late network side effect", async () => {
  let release!: () => void,
    fetched = false;
  const identity = new Promise<void>((resolve) => {
    release = resolve;
  });
  await assert.rejects(
    withDeadline(async (signal) => {
      await identity;
      checkDeadline(signal);
      fetched = true;
    }, 10),
    { name: "AbortError" },
  );
  release();
  await Promise.resolve();
  await Promise.resolve();
  assert.equal(fetched, false);
});

test("reset/pause/manual start cancel a kitchen schedule; no later re-anchor", () => {
  const board = servingBoard(freshBoard(customProfile), 900000, 0);
  for (const action of ["reset", "pause", "toggle"]) {
    const next = act(board, 0, action, "sequence", 1000);
    assert.equal(next[0].scheduledAt, null);
    assert.equal(board[0].scheduledAt, 540000);
  }
  const reset = act(board, 0, "reset", "sequence", 1000)[0];
  assert.equal(settle(reset, "sequence", 600000).anchor, null);
});
test("settle shares unchanged state and never mutates transitions", () => {
  const idle = freshBoard(customProfile)[0];
  assert.equal(settle(idle, "sequence", 1000000), idle);
  const run = { ...idle, anchor: 1000 };
  assert.equal(settle(run, "sequence", 1001), run);
  const next = settle(run, "sequence", 302000);
  assert.equal(next.index, 1);
  assert.equal(run.index, 0);
  assert.equal(next.stages, run.stages);
});
test("last-clock reset ends execution; other paused or scheduled work keeps its lease", () => {
  let board = createBoard({ ...customProfile, count: 2 });
  board = act(board, 0, "toggle", "sequence", 1000);
  assert.equal(boardSessionContinues(board, 0), false);
  board = act(board, 1, "toggle", "sequence", 2000);
  board = act(board, 1, "pause", "sequence", 3000);
  assert.equal(boardSessionContinues(board, 0), true);
  assert.equal(
    boardSessionContinues([{ ...board[0], done: true }, board[1]], 1),
    false,
  );
});
test("501/502 laps retain accurate split, absolute lap number and serialized metadata", () => {
  let board = act(
    createBoard({
      count: 1,
      mode: "up",
      stages: [{ name: "Run", seconds: 0 }],
    }),
    0,
    "toggle",
    "up",
    1000,
  );
  let primary = { laps: [] as number[], lapBase: 0, lapOffset: 0 };
  for (let i = 1; i <= 502; i++) {
    board = act(board, 0, "lap", "up", 1000 + i * 1000);
    primary = appendLap(primary, i * 1000);
  }
  assert.equal(board[0].lapOffset, 2);
  assert.equal(board[0].lapBase, 2000);
  const rewound = seekCard(board[0], 1, "up");
  assert.equal(rewound.lapBase, 0);
  assert.equal(rewound.lapOffset, 0);
  assert.equal(rewound.laps.length, 0);
  assert.deepEqual(primary.laps, board[0].laps);
  assert(
    boardCsv(JSON.parse(JSON.stringify(board)), 503000).includes(
      '"3.00","Recorded","3","1.00"',
    ),
  );
});
test("maximum-size legal program library can export and import its own output", () => {
  const config = validateConfig("meeting", {
    agenda: Array.from({ length: 200 }, (_, i) => ({
      id: `slot-${i}`,
      name: "A".repeat(120),
      seconds: 60,
    })),
  });
  const programs = Array.from({ length: 200 }, (_, i) => ({
    id: `p-${i}`,
    kind: "meeting" as const,
    name: `Meeting ${i}`,
    config,
    updatedAt: 0,
  }));
  const json = writeBackup(programs);
  assert(json.length > 4000000);
  assert.equal(readBackup(json, () => "imported").length, 200);
  assert.throws(() => checkBackupSize("а".repeat(100), 150));
});
test("device backup transfers all portable domains, excludes credentials and pauses boards", () => {
  const store = emptyStore();
  store.programs = [
    {
      id: "p",
      kind: "simple",
      name: "Saved",
      config: defaultConfig("simple"),
      updatedAt: 1000,
    },
  ];
  store.run = toggleRun(
    createRun("stopwatch", defaultConfig("stopwatch"), "active", 1000),
    1000,
  );
  store.run.notes = "Private active note";
  const board = act(freshBoard(customProfile), 0, "toggle", "sequence", 1000);
  const json = writeDeviceBackup(
    store,
    [
      [
        "corptimer.board.custom-timer",
        JSON.stringify({
          board,
          session: "paid-id",
          sessionOwner: "other-user",
        }),
      ],
      [
        "corptimer.library.v1",
        JSON.stringify({ favorites: ["custom-timer"], home: "custom-timer" }),
      ],
      [
        "corptimer-feedback-draft-v1",
        JSON.stringify({
          message: "Unsent feedback",
          email: "",
          category: "Other",
        }),
      ],
      ["firebase:authUser:secret", "credential"],
      ["corptimer-live-host-v1", "capability"],
      ["corptimer.board.custom-timer.reservation", "pending-payment"],
    ],
    5000,
    9000,
  );
  const imported = readDeviceBackup(json);
  assert.equal(imported.data.length, 3);
  assert.equal(imported.store.run, null);
  assert.equal(imported.store.history[0].notes, "Private active note");
  assert.equal(imported.store.history[0].elapsed, 4000);
  assert.equal(imported.store.history[0].finishedAt, 9000);
  assert(
    !json.includes("paid-id") &&
      !json.includes("credential") &&
      !json.includes("capability"),
  );
  const restored = JSON.parse(
    imported.data.find(([key]) => key === "corptimer.board.custom-timer")![1],
  );
  assert.equal(restored.board[0].elapsed, 4000);
  assert.equal(restored.board[0].anchor, null);
  assert.equal(restored.session, null);
  assert.equal(imported.store.programs[0].name, "Saved");
  assert.equal(isUserDataKey("firebase:authUser:secret"), false);
  assert.equal(isUserDataKey("corptimer.board.custom-timer.reservation"), true);
  assert.equal(
    isPortableDataKey("corptimer.board.custom-timer.reservation"),
    false,
  );
});
test("malformed device backup is rejected before a replacement can run", () => {
  assert.throws(() =>
    readDeviceBackup(
      JSON.stringify({
        format: "corptimer-device",
        version: 1,
        store: emptyStore(),
        data: { "firebase:authUser:secret": "{}" },
      }),
    ),
  );
  const store = emptyStore();
  store.history = [
    {
      id: "bad",
      kind: "simple",
      title: "Bad",
      finishedAt: 0,
      elapsed: 1,
      entries: [],
      laps: [1],
      notes: {},
    } as never,
  ];
  assert.throws(() =>
    readDeviceBackup(
      JSON.stringify({
        format: "corptimer-device",
        version: 1,
        store,
        data: {},
      }),
    ),
  );
});
test("repository replacement waits for in-flight writes and rejects old-screen late writes", async () => {
  const values = new Map<string, string>();
  let release!: () => void, started!: () => void;
  const began = new Promise<void>((resolve) => {
    started = resolve;
  });
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const repository = scopedRepository({
    getItem: async (k) => values.get(k) ?? null,
    async setItem(k, v) {
      started();
      await gate;
      values.set(k, v);
    },
    removeItem: async (k) => {
      values.delete(k);
    },
  });
  const old = repository.scope();
  const write = old.setItem("board", "old");
  await began;
  const replacement = repository.replace(async () => {
    values.clear();
  });
  const late = old.setItem("board", "resurrected");
  release();
  await Promise.all([write, replacement, late]);
  assert.equal(values.size, 0);
  assert.equal(old.current(), false);
  await repository.scope().setItem("board", "new");
  assert.equal(values.get("board"), "new");
});
test("latest effect skips obsolete pending schedules and flags interrupted async output", async () => {
  const events: string[] = [];
  let release!: () => void, started!: () => void;
  const began = new Promise<void>((resolve) => {
    started = resolve;
  });
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const apply = latestEffect<string>(async (value, current) => {
    if (value === "start") {
      started();
      await gate;
    }
    events.push(current() ? value : "stale-cleanup");
  });
  const a = apply("start");
  await began;
  const b = apply("obsolete-edit"),
    c = apply("pause");
  release();
  await Promise.all([a, b, c]);
  assert.deepEqual(events, ["stale-cleanup", "pause"]);
});
test("remote Next acknowledges only successful start and serializes following Pause", async () => {
  const events: string[] = [];
  let resolveStart!: (v: boolean) => void;
  const start = new Promise<boolean>((resolve) => {
    resolveStart = resolve;
  });
  const consume = commandQueue({
    now: () => 1000,
    current: () => true,
    execute: async (action) => {
      events.push(action);
      return action === "next" ? start : true;
    },
    acknowledge: (id) => {
      events.push(`ack:${id}`);
    },
    rejected: () => {
      events.push("rejected");
    },
    clear: async (id) => {
      events.push(`clear:${id}`);
    },
  });
  const a = consume("one", "next", 1000),
    b = consume("two", "pause", 1000);
  await Promise.resolve();
  await Promise.resolve();
  assert.deepEqual(events, ["next"]);
  resolveStart(false);
  await Promise.all([a, b]);
  assert.deepEqual(events, [
    "next",
    "rejected",
    "clear:one",
    "pause",
    "ack:two",
    "clear:two",
  ]);
  await consume("two", "pause", 1000);
  assert.equal(events.filter((e) => e === "pause").length, 1);
});
test("obsolete-room commands cannot acknowledge a pending start", async () => {
  let current = true,
    finish!: (value: boolean) => void;
  const pending = new Promise<boolean>((resolve) => {
    finish = resolve;
  });
  const acks: string[] = [];
  const consume = commandQueue({
    now: () => 0,
    current: () => current,
    execute: () => pending,
    acknowledge: (id) => {
      acks.push(id);
    },
    rejected() {},
    clear: async () => {},
  });
  const result = consume("old", "next", 0);
  await Promise.resolve();
  await Promise.resolve();
  current = false;
  finish(true);
  await result;
  assert.deepEqual(acks, []);
});
test("native monotonic epoch ignores wall-clock corrections, sleep and same-boot process restarts", () => {
  const first = { wall: 1000000, monotonic: 10000, boot: "A" };
  const clock = timebase(first);
  const after = { wall: 4610000, monotonic: 20000, boot: "A" };
  assert.equal(clock.now(after), 1010000);
  const board = act(
    createBoard({
      count: 1,
      mode: "up",
      stages: [{ name: "Run", seconds: 0 }],
    }),
    0,
    "toggle",
    "up",
    clock.now(first),
  );
  assert.equal(display(board[0], "up", clock.now(after)), "0:10");
  const restart = timebase(
    { ...after, monotonic: 80000 },
    clock.checkpoint(after),
  );
  assert.equal(restart.now({ ...after, monotonic: 80000 }), 1070000);
  const backward = { wall: 1, monotonic: 90000, boot: "A" };
  assert.equal(restart.now(backward), 1080000);
  const reboot = timebase(
    { wall: 2, monotonic: 5, boot: "B" },
    restart.checkpoint(backward),
  );
  assert(reboot.now({ wall: 2, monotonic: 5, boot: "B" }) >= 1080000);
});
test("specialty alarms cover independent schedules, manual boundaries and Speech thresholds", () => {
  const scheduled = servingBoard(freshBoard(customProfile), 900000, 0);
  assert.equal(boardAlarmPlan(scheduled, "sequence", 0).at(-1)?.at, 900000);
  const manual = act(
    freshBoard({ ...customProfile, automatic: false }),
    0,
    "toggle",
    "sequence",
    1000,
  );
  assert.equal(boardAlarmPlan(manual, "sequence", 1000).length, 1);
  const speech = act(
    createBoard({
      count: 1,
      mode: "up",
      stages: [{ name: "Speech", seconds: 0 }],
    }),
    0,
    "toggle",
    "up",
    1000,
  );
  assert.deepEqual(
    boardAlarmPlan(speech, "up", 1000, {
      green: 2,
      amber: 4,
      red: 6,
      sound: true,
      hideDigits: false,
      kidsView: false,
    }).map((a) => a.at),
    [3000, 5000, 7000],
  );
  const config = { ...defaultConfig("boxing"), rounds: 99 };
  const run = toggleRun(createRun("boxing", config, "long", 0), 0);
  assert(alarmPlan(run, 0, Infinity).length > 48);
});
