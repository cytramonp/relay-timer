import { assertLibraryCapacity } from "../src/core/library.ts";
import { decodeStore } from "../src/core/store-codec.ts";
import { timers as webTimers } from "../../docs/timer-catalog.js";
import profiles from "../src/core/specialty-catalog.json" with { type: "json" };
import { catalog } from "../src/core/catalog.ts";
import test from "node:test";
import assert from "node:assert/strict";
import {
  customInstance,
  readPreferences,
  savedBoardSummary,
} from "../src/core/library.ts";
import {
  readDeviceBackup,
  writeDeviceBackup,
} from "../src/core/device-backup.ts";
import { freshBoard, customProfile } from "../src/core/board.ts";
import { emptyStore } from "../src/core/store-codec.ts";
import { isUserDataKey, isPortableDataKey } from "../src/core/data-keys.ts";
const instance = "12345678-1234-4abc-8def-123456789abc";
const slug = "custom-timer-" + instance;
const key = "corptimer.board." + slug;
test("favorite preferences tolerate malformed storage, sanitize IDs, and deduplicate", () => {
  for (const raw of [null, "{", "null", "[]", "42", '{"favorites":"boxing"}'])
    assert.deepEqual(readPreferences(raw), { favorites: [], home: null });
  assert.deepEqual(
    readPreferences(
      JSON.stringify({
        favorites: ["boxing", null, "boxing", {}, "../path", "egg-timer"],
        home: 42,
      }),
    ),
    { favorites: ["boxing", "egg-timer"], home: null },
  );
  assert.equal(
    readPreferences(
      JSON.stringify({
        favorites: Array.from({ length: 150 }, (_, i) => "timer-" + i),
      }),
    ).favorites.length,
    100,
  );
});
test("saved setup listing rejects unknown and malformed records while keeping legacy setups", () => {
  const raw = JSON.stringify({ board: freshBoard(customProfile) });
  assert.equal(savedBoardSummary(key + ".setup", raw, [])?.instance, instance);
  assert.equal(
    savedBoardSummary("corptimer.board.custom-timer.setup", raw, [])?.instance,
    null,
  );
  assert.equal(
    savedBoardSummary("corptimer.board.unknown.setup", raw, []),
    null,
  );
  assert.equal(savedBoardSummary(key + ".setup", "{", []), null);
  assert.equal(savedBoardSummary(key + ".setup", '{"board":null}', []), null);
  assert.equal(customInstance("custom-timer-" + "a".repeat(36)), null);
});
test("independent custom timers survive backup paused with setup and no account reservation", () => {
  const raw = JSON.stringify({
    board: freshBoard(customProfile),
    session: "private-session",
    sessionOwner: "private-owner",
    options: { sound: true },
  });
  const output = readDeviceBackup(
    writeDeviceBackup(emptyStore(), [
      [key, raw],
      [key + ".setup", raw],
      [key + ".reservation", "reserved"],
    ]),
  );
  assert.deepEqual(
    output.data.map(([k]) => k),
    [key, key + ".setup"],
  );
  for (const [, value] of output.data) {
    const record = JSON.parse(value);
    assert.equal(record.session, null);
    assert.equal(record.sessionOwner, null);
    assert.equal(record.board[0].anchor, null);
  }
  assert.equal(isUserDataKey(key), true);
  assert.equal(isUserDataKey(key + ".setup"), true);
  assert.equal(isPortableDataKey(key + ".reservation"), false);
  assert.throws(
    () =>
      writeDeviceBackup(emptyStore(), [
        ["corptimer.board.custom-timer-" + "a".repeat(36), raw],
      ]),
    /Unknown board/,
  );
});

test("mobile catalog contains every website primary and specialty timer", () => {
  const webPrimary = webTimers.filter(
    (timer) => timer.kind !== "specialty" && !("minutes" in timer),
  );
  assert.deepEqual(
    new Set(catalog.map((timer) => timer.kind)),
    new Set(webPrimary.map((timer) => timer.kind)),
  );
  assert.deepEqual(
    new Set(profiles.map((timer) => timer.slug)),
    new Set(
      webTimers
        .filter((timer) => timer.kind === "specialty")
        .map((timer) => timer.slug),
    ),
  );
});

test("global brand color and embedded logo survive device backup; unsafe values fall back", () => {
  const store = emptyStore();
  store.settings.accent = "violet";
  store.settings.companyLogo = "data:image/png;base64,aGVsbG8=";
  const restored = readDeviceBackup(writeDeviceBackup(store, [])).store;
  assert.equal(restored.settings.accent, "violet");
  assert.equal(restored.settings.companyLogo, store.settings.companyLogo);
  const unsafe = decodeStore(
    JSON.stringify({
      ...store,
      settings: {
        ...store.settings,
        accent: "prototype",
        companyLogo: "https://untrusted.example/logo.png",
      },
    }),
  );
  assert.equal(unsafe.store.settings.accent, "teal");
  assert.equal(unsafe.store.settings.companyLogo, undefined);
});

test("custom copy projection allows replacement but blocks record and encoded byte overflow before writes", () => {
  const records: [string, string][] = Array.from({ length: 100 }, (_, i) => [
    "corptimer.board.timer-" + i,
    "{}",
  ]);
  assert.doesNotThrow(() =>
    assertLibraryCapacity(records, [[records[0][0], '{"updated":true}']]),
  );
  assert.throws(
    () =>
      assertLibraryCapacity(records, [
        [key, "{}"],
        [key + ".setup", "{}"],
      ]),
    /library is full/,
  );
  assert.doesNotThrow(() =>
    assertLibraryCapacity(
      [],
      [
        [key, "{}"],
        [key + ".setup", "{}"],
      ],
    ),
  );
  // Escaped strings and UTF-8 must count, not just JS characters or media file sizes.
  assert.throws(
    () => assertLibraryCapacity([], [[key, "界".repeat(11_000_000)]]),
    /32 MB/,
  );
  assert.throws(
    () =>
      assertLibraryCapacity(
        [],
        [
          [key, "x".repeat(16_000_000)],
          [key + ".setup", "x".repeat(16_000_000)],
        ],
      ),
    /32 MB/,
  );
});
