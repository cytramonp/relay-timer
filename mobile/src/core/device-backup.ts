import { checkBackupSize, isPortableDataKey } from "./data-keys.ts";
import { decodeStore } from "./store-codec.ts";
import { elapsed } from "./board-engine.js";
import { restoreBoard } from "./board.ts";
import profiles from "./specialty-catalog.json" with { type: "json" };
import { finishRun, report } from "./clock.ts";
import type { Store } from "./types.ts";

function portableValue(key: string, text: string, now = 0): string {
  if (!isPortableDataKey(key)) throw Error("Unsupported data in backup.");
  const value = JSON.parse(text);
  if (key.startsWith("corptimer.board.")) {
    const slug = key.slice("corptimer.board.".length).replace(/\.setup$/, "");
    const mode =
      slug === "custom-timer"
        ? "sequence"
        : profiles.find((p) => p.slug === slug)?.mode;
    if (!mode) throw Error("Unknown board in backup.");
    const input = Array.isArray(value) ? value : value.board;
    const board = restoreBoard(input, mode, now).map((c) => ({
      ...c,
      elapsed: elapsed(c, now),
      anchor: null,
      scheduledAt: null,
    }));
    // Transfer data, never transfer a paid/free reservation or auto-start clocks.
    return JSON.stringify({
      board,
      options: value.options,
      session: null,
      sessionOwner: null,
    });
  }
  if (key === "corptimer.library.v1") {
    if (
      !Array.isArray(value.favorites) ||
      value.favorites.length > 100 ||
      !value.favorites.every(
        (x: unknown) => typeof x === "string" && /^[a-z0-9-]{1,80}$/.test(x),
      ) ||
      !(
        value.home == null ||
        (typeof value.home === "string" && /^[a-z0-9-]{1,80}$/.test(value.home))
      )
    )
      throw Error("Invalid favorites.");
    return JSON.stringify({
      favorites: value.favorites,
      home: value.home ?? null,
    });
  }
  if (
    typeof value.message !== "string" ||
    value.message.length > 5000 ||
    typeof value.email !== "string" ||
    value.email.length > 320 ||
    typeof value.category !== "string" ||
    value.category.length > 120
  )
    throw Error("Invalid feedback draft.");
  return JSON.stringify({
    message: value.message,
    email: value.email,
    category: value.category,
  });
}
export function writeDeviceBackup(
  store: Store,
  data: readonly (readonly [string, string | null])[],
  now = Date.now(),
  wallNow = now,
) {
  const extras = Object.fromEntries(
    data
      .filter(([k, v]) => isPortableDataKey(k) && v !== null)
      .map(([k, v]) => [k, portableValue(k, v!, now)]),
  );
  const history =
    store.run && !store.history.some((h) => h.id === store.run!.id)
      ? [
          { ...report(finishRun(store.run, now)), finishedAt: wallNow },
          ...store.history.filter((r) => r.id !== store.run!.id),
        ].slice(0, 100)
      : store.history;
  const json = JSON.stringify({
    format: "corptimer-device",
    version: 1,
    // The reusable plan remains, but a foreign active run must never bypass access.
    store: { ...store, run: null, history },
    data: extras,
  });
  readDeviceBackup(json);
  return json;
}
export function readDeviceBackup(json: string): {
  store: Store;
  data: [string, string][];
} {
  checkBackupSize(json);
  const raw = JSON.parse(json);
  if (
    raw.format !== "corptimer-device" ||
    raw.version !== 1 ||
    !raw.store ||
    !raw.data ||
    typeof raw.data !== "object" ||
    Array.isArray(raw.data)
  )
    throw Error("Choose a CorpTimer device backup.");
  const result = decodeStore(JSON.stringify({ ...raw.store, run: null }));
  if (result.error)
    throw Error(
      "The backup contains invalid timer data. Nothing was replaced.",
    );
  const entries = Object.entries(raw.data);
  if (entries.length > 100) throw Error("Too many data records in backup.");
  const data = entries.map(([k, v]): [string, string] => {
    if (typeof v !== "string") throw Error("Invalid backup record.");
    return [k, portableValue(k, v)];
  });
  return { store: result.store, data };
}
