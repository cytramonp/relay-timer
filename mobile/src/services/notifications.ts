import * as Notifications from "expo-notifications";
import { AndroidImportance } from "expo-notifications";
import { Platform } from "react-native";
import { alarmPlan } from "../core/clock";
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
let queue = Promise.resolve();
export function syncNotifications(
  run: Run | null,
  enabled: boolean,
): Promise<void> {
  if (Platform.OS === "web") return Promise.resolve();
  queue = queue
    .catch(() => {})
    .then(async () => {
      const pending = await Notifications.getAllScheduledNotificationsAsync();
      await Promise.all(
        pending
          .filter((n) => n.content.data?.source === "corptimer")
          .map((n) =>
            Notifications.cancelScheduledNotificationAsync(n.identifier),
          ),
      );
      if (
        !enabled ||
        !run ||
        !(await Notifications.getPermissionsAsync()).granted
      )
        return;
      const now = Date.now();
      for (const [i, item] of alarmPlan(run, now).entries()) {
        if (item.at <= Date.now()) continue;
        await Notifications.scheduleNotificationAsync({
          identifier: `corptimer-${run.id}-${i}`,
          content: {
            title: item.title,
            body: item.body,
            data: { source: "corptimer", kind: run.kind },
            sound:
              run.config.sound === "off" || run.config.volume === 0
                ? false
                : `${run.config.sound}.wav`,
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: new Date(item.at),
            ...(Platform.OS === "android"
              ? {
                  channelId: `corptimer-${run.config.volume === 0 ? "off" : run.config.sound}`,
                }
              : {}),
          },
        });
      }
    });
  return queue;
}
