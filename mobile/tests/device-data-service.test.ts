import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import * as keys from "../src/core/data-keys.ts";
import { scopedRepository } from "../src/core/data-repository.ts";
import {
  readDeviceBackup,
  writeDeviceBackup,
} from "../src/core/device-backup.ts";
import { emptyStore } from "../src/core/store-codec.ts";

// Exercise the real service boundary with in-memory SDK/SQLite doubles. No
// provider, user browser storage, mailbox, or account is contacted.
const source = fs.readFileSync(
  new URL("../src/services/device-data.ts", import.meta.url),
  "utf8",
);
const body = source
  .slice(source.indexOf("// Read durable ownership"))
  .replaceAll("export async function", "async function");
const js = ts.transpileModule(body, {
  compilerOptions: { target: ts.ScriptTarget.ES2022 },
}).outputText;

function fixture() {
  const data = new Map<string, string>([
    ["firebase:auth:local", "test-auth-sentinel"],
    [
      keys.FAVORITES_KEY,
      JSON.stringify({ favorites: ["multi-stopwatch"], home: null }),
    ],
    [
      keys.FEEDBACK_DRAFT_KEY,
      JSON.stringify({
        message: "Unsent QA draft",
        email: "",
        category: "A question",
      }),
    ],
    ["corptimer.board.multi-stopwatch.reservation", "pending-qa-reservation"],
  ]);
  const sqlite = new Map([
    ["corptimer-mobile-v1", JSON.stringify(emptyStore())],
  ]);
  let rejectNextSet = false;
  const storage = {
    getItem: async (key: string) => data.get(key) ?? null,
    setItem: async (key: string, value: string) => {
      data.set(key, value);
    },
    removeItem: async (key: string) => {
      data.delete(key);
    },
    getAllKeys: async () => [...data.keys()],
    multiGet: async (names: string[]) =>
      names.map((key) => [key, data.get(key) ?? null]),
    multiRemove: async (names: string[]) => {
      for (const key of names) data.delete(key);
    },
    multiSet: async (entries: [string, string][]) => {
      for (const [key, value] of entries) {
        data.set(key, value);
        if (rejectNextSet) {
          rejectNextSet = false;
          throw Error("Simulated storage failure");
        }
      }
    },
  };
  const userData = scopedRepository(storage);
  const localStorage = {
    setItem: (key: string, value: string) => {
      sqlite.set(key, value);
    },
    removeItem: (key: string) => {
      sqlite.delete(key);
    },
  };
  const service = new Function(
    "AsyncStorage",
    "isUserDataKey",
    "isPortableDataKey",
    "LIVE_HOST_KEY",
    "readDeviceBackup",
    "writeDeviceBackup",
    "rawStore",
    "saveStore",
    "runNow",
    "userData",
    "localStorage",
    `${js}; return {exportDeviceData, clearUserData, restoreDeviceData};`,
  )(
    storage,
    keys.isUserDataKey,
    keys.isPortableDataKey,
    keys.LIVE_HOST_KEY,
    readDeviceBackup,
    writeDeviceBackup,
    () => sqlite.get("corptimer-mobile-v1"),
    (store: unknown) =>
      sqlite.set("corptimer-mobile-v1", JSON.stringify(store)),
    () => Date.now(),
    userData,
    localStorage,
  );
  return {
    service,
    data,
    sqlite,
    userData,
    failNextSet: () => {
      rejectNextSet = true;
    },
  };
}

test("device service export, deletion and restore preserve auth, clear grants and fence old writers", async () => {
  const f = fixture(),
    old = f.userData.scope();
  const backup = await f.service.exportDeviceData(emptyStore());
  assert.equal(backup.includes("test-auth-sentinel"), false);
  assert.equal(backup.includes("pending-qa-reservation"), false);
  await f.service.clearUserData();
  assert.deepEqual([...f.data.keys()], ["firebase:auth:local"]);
  await old.setItem(keys.FEEDBACK_DRAFT_KEY, "stale screen must not reappear");
  assert.equal(f.data.has(keys.FEEDBACK_DRAFT_KEY), false);
  const restored = await f.service.restoreDeviceData(backup);
  assert.equal(restored.run, null);
  assert.equal(
    JSON.parse(f.data.get(keys.FEEDBACK_DRAFT_KEY)!).message,
    "Unsent QA draft",
  );
  assert.deepEqual(JSON.parse(f.data.get(keys.FAVORITES_KEY)!).favorites, [
    "multi-stopwatch",
  ]);
  assert.equal(f.data.get("firebase:auth:local"), "test-auth-sentinel");
  assert.equal(
    f.data.has("corptimer.board.multi-stopwatch.reservation"),
    false,
  );
});

test("device service rejects malformed input without writes and rolls partial restore back", async () => {
  const f = fixture(),
    original = [...f.data.entries()],
    sqlite = [...f.sqlite.entries()];
  await assert.rejects(() =>
    f.service.restoreDeviceData('{"format":"invalid"}'),
  );
  assert.deepEqual([...f.data.entries()], original);
  const backup = await f.service.exportDeviceData(emptyStore());
  f.failNextSet();
  await assert.rejects(
    () => f.service.restoreDeviceData(backup),
    /Simulated storage failure/,
  );
  assert.deepEqual([...f.data.entries()].sort(), original.sort());
  assert.deepEqual([...f.sqlite.entries()], sqlite);
});
