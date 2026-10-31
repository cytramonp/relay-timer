import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import { latestEffect } from "../src/core/latest-effect.ts";

const source = fs.readFileSync(
  new URL("../src/services/notifications.ts", import.meta.url),
  "utf8",
);
const body = source
  .slice(
    source.indexOf("type Schedule ="),
    source.indexOf("export function syncNotifications("),
  )
  .replaceAll("export function", "function");
const js = ts.transpileModule(body, {
  compilerOptions: { target: ts.ScriptTarget.ES2022 },
}).outputText;
type Pending = {
  identifier: string;
  content: { data: { source: string; scope: string } };
};
function scheduler() {
  const scheduled = new Map<string, Pending>();
  const events: string[] = [];
  let delay: Promise<void> | undefined;
  let onRead = () => {};
  const native = {
    async getAllScheduledNotificationsAsync() {
      onRead();
      if (delay) await delay;
      return [...scheduled.values()];
    },
    async cancelScheduledNotificationAsync(id: string) {
      events.push(`cancel:${id}`);
      scheduled.delete(id);
    },
    async scheduleNotificationAsync(value: Pending) {
      events.push(`schedule:${value.identifier}`);
      scheduled.set(value.identifier, value);
      return value.identifier;
    },
    SchedulableTriggerInputTypes: { DATE: "date" },
  };
  const adapter = new Function(
    "Notifications",
    "Platform",
    "alertReadiness",
    "latestEffect",
    `${js};return {syncAlarmScope,cancelTimerAlerts};`,
  )(
    native,
    { OS: "android" },
    async () => ({ allowed: true, exact: true }),
    latestEffect,
  );
  return {
    ...adapter,
    scheduled,
    events,
    delay: (promise: Promise<void>) => {
      delay = promise;
    },
    read: (callback: () => void) => {
      onRead = callback;
    },
  };
}
test("global disable survives coalescing by paused-board updates and removes restored unknown scopes", async () => {
  const a = scheduler();
  a.scheduled.set("restored", {
    identifier: "restored",
    content: { data: { source: "corptimer", scope: "board.unmounted" } },
  });
  let release!: () => void, began!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const read = new Promise<void>((resolve) => {
    began = resolve;
  });
  a.delay(gate);
  a.read(began);
  const start = a.syncAlarmScope(
    "primary",
    [{ at: Date.now() + 60000, title: "Old", body: "" }],
    "bell",
    "simple",
  );
  await read;
  const disable = a.cancelTimerAlerts();
  const pausedBoard = a.syncAlarmScope("board.current", [], "off", "custom");
  release();
  await Promise.all([start, disable, pausedBoard]);
  assert.equal(a.scheduled.size, 0);
  assert.equal(
    a.events.some((e: string) => e.startsWith("schedule:")),
    false,
  );
});
test("all known scopes share a 48-alert horizon and one scope pause preserves another", async () => {
  const a = scheduler();
  const plan = Array.from({ length: 40 }, (_, i) => ({
    at: Date.now() + 60000 + i * 1000,
    title: "Stage",
    body: "",
  }));
  await a.syncAlarmScope("primary", plan, "bell", "boxing");
  await a.syncAlarmScope("board.other", plan, "bell", "kitchen");
  assert.equal(a.scheduled.size, 48);
  await a.syncAlarmScope("primary", [], "off", "boxing");
  assert.equal(a.scheduled.size, 40);
  assert(
    [...a.scheduled.values()].every(
      (n: Pending) => n.content.data.scope === "board.other",
    ),
  );
});
