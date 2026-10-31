import * as Notifications from "expo-notifications";
import { AndroidImportance, IosAuthorizationStatus } from "expo-notifications";
import { Platform } from "react-native";
import { alarmPlan, type Alarm } from "../core/clock";
import { runNow, wallTime } from "./timer-clock";
import { latestEffect } from "../core/latest-effect";
import type { Run } from "../core/types";

// Foreground sounds are handled by audio.ts. Do not double-play an OS notification sound.
if (Platform.OS !== "web")
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: false,
      shouldShowList: false,
    }),
  });
export async function requestNotifications() {
  if (Platform.OS === "web") return false;
  if (Platform.OS === "android")
    for (const sound of ["bell", "gong", "beep", "off"]) {
      await Notifications.setNotificationChannelAsync(`corptimer-${sound}`, {
        name: sound === "off" ? "Silent timer alerts" : `Timer ${sound}`,
        importance: AndroidImportance.HIGH,
        sound: sound === "off" ? null : `${sound}.wav`,
        vibrationPattern: [0, 200, 100, 200],
      });
    }
  const permission = await Notifications.requestPermissionsAsync();
  return permission.granted;
}
export async function alertReadiness() {
  if (Platform.OS === "web") return { allowed: false, exact: false };
  const permission = await Notifications.getPermissionsAsync();
  const allowed =
    permission.granted ||
    permission.ios?.status === IosAuthorizationStatus.PROVISIONAL;
  const exact =
    Platform.OS !== "android" ||
    (await Notifications.getExactAlarmPermissionsAsync()).granted;
  return { allowed, exact };
}
export async function requestExactAlerts() {
  if (Platform.OS === "android")
    await Notifications.requestExactAlarmPermissionsAsync();
  return alertReadiness();
}
type Schedule = { plan: Alarm[]; sound: string; kind: string };
const desired = new Map<string, Schedule>();
let clearVersion = 0,
  clearedVersion = 0;
const reconcile = latestEffect(
  async (
    snapshot: {
      scopes: Map<string, Schedule>;
      clear: boolean;
      clearVersion: number;
    },
    current,
  ) => {
    const pending = await Notifications.getAllScheduledNotificationsAsync();
    if (!current()) return;
    const scopeOf = (n: (typeof pending)[number]) =>
      String(n.content.data?.scope ?? "primary");
    const own = pending.filter((n) => n.content.data?.source === "corptimer");
    const remove = own.filter(
      (n) =>
        snapshot.clear ||
        snapshot.clearVersion > clearedVersion ||
        snapshot.scopes.has(scopeOf(n)),
    );
    await Promise.all(
      remove.map((n) =>
        Notifications.cancelScheduledNotificationAsync(n.identifier),
      ),
    );
    clearedVersion = Math.max(clearedVersion, snapshot.clearVersion);
    if (!current() || snapshot.clear) return;
    const readiness = await alertReadiness();
    if (!current() || !readiness.allowed) return;
    const existing = own.length - remove.length;
    const items = [...snapshot.scopes]
      .flatMap(([scope, config]) =>
        config.plan.map((alarm, i) => ({
          ...alarm,
          scope,
          config,
          id: `corptimer-${scope}-${i}`,
        })),
      )
      .filter((a) => a.at > Date.now())
      .sort((a, b) => a.at - b.at)
      .slice(0, Math.max(0, 48 - existing));
    for (const item of items) {
      if (!current()) return;
      if (item.at <= Date.now()) continue;
      const identifier = await Notifications.scheduleNotificationAsync({
        identifier: item.id,
        content: {
          title: item.title,
          body: item.body,
          data: {
            source: "corptimer",
            scope: item.scope,
            kind: item.config.kind,
          },
          sound:
            item.config.sound === "off" ? false : `${item.config.sound}.wav`,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: new Date(item.at),
          ...(Platform.OS === "android"
            ? {
                channelId: `corptimer-${item.config.sound}`,
                // The user explicitly enables timer alerts and precise alarm access.
                delivery: readiness.exact
                  ? ("alarmClock" as const)
                  : ("bestEffort" as const),
              }
            : {}),
        },
      });
      if (!current()) {
        await Notifications.cancelScheduledNotificationAsync(identifier);
        return;
      }
    }
  },
);
export function syncAlarmScope(
  scope: string,
  plan: Alarm[],
  sound: string,
  kind: string,
) {
  if (Platform.OS === "web") return Promise.resolve();
  desired.set(scope, { plan, sound, kind });
  return reconcile({ scopes: new Map(desired), clear: false, clearVersion });
}
export function cancelTimerAlerts() {
  desired.clear();
  clearVersion++;
  if (Platform.OS === "web") return Promise.resolve();
  return reconcile({ scopes: new Map(), clear: true, clearVersion });
}
export function syncNotifications(
  run: Run | null,
  enabled: boolean,
): Promise<void> {
  if (!enabled) return cancelTimerAlerts();
  return syncAlarmScope(
    "primary",
    enabled && run
      ? alarmPlan(run, runNow(run), Infinity).map((a) => ({
          ...a,
          at: run.kind === "newyear" ? a.at : wallTime(a.at),
        }))
      : [],
    !run || run.config.volume === 0 ? "off" : run.config.sound,
    run?.kind ?? "",
  );
}
