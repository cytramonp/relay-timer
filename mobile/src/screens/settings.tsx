import React, { useState, useCallback } from "react";
import { Linking, Platform } from "react-native";
import { router, useFocusEffect } from "expo-router";
import Constants from "expo-constants";
import {
  Action,
  Body,
  confirm,
  Heading,
  Page,
  Row,
  Rule,
  Toggle,
} from "../components/ui";
import { useApp } from "../state/app-store";
import {
  requestNotifications,
  alertReadiness,
  requestExactAlerts,
} from "../services/notifications";
import { useOverlay } from "../state/overlay-store";
import { useLive } from "../state/live-store";
import {
  exportDeviceData,
  exportRecoveryData,
  revokeStoredLiveHost,
} from "../services/device-data";
import { readDeviceBackup } from "../core/device-backup";
import { importFile, exportFile } from "../services/files";

export function SettingsScreen() {
  const live = useLive(),
    overlay = useOverlay();
  const [recoveryNeeded, setRecoveryNeeded] = useState(false);
  const [readiness, setReadiness] = useState<{
    allowed: boolean;
    exact: boolean;
  } | null>(null);
  useFocusEffect(
    useCallback(() => {
      let live = true;
      void alertReadiness()
        .then((r) => {
          if (live) setReadiness(r);
        })
        .catch(() => {});
      return () => {
        live = false;
      };
    }, []),
  );
  const {
      store,
      snapshot,
      settings,
      notify,
      resetDevice,
      restoreDevice,
      unreadableData,
    } = useApp(),
    [busy, setBusy] = useState(false);
  async function alerts(enabled: boolean) {
    if (!enabled) {
      settings({ notifications: false });
      return;
    }
    setBusy(true);
    try {
      if (await requestNotifications()) {
        const ready = await alertReadiness();
        setReadiness(ready);
        settings({ notifications: true });
        notify(
          ready.exact
            ? "Timer alerts enabled. Test delivery once with the screen locked."
            : "Approximate alerts enabled. Allow precise alarms below for time-critical timers.",
        );
      } else
        notify(
          Platform.OS === "web"
            ? "Background alerts are available in the iOS and Android apps."
            : "Notifications were not allowed. Enable them in your phone settings, then try again.",
        );
    } catch {
      notify(
        "Could not enable alerts. Check notification settings on your phone.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <Page>
      <Heading>Your timer, your rhythm.</Heading>
      <Action
        label="Your plan · Trial, Free & Pro"
        onPress={() => router.push("/pro")}
      />
      <Body muted>Appearance</Body>
      <Row>
        {(["light", "dark", "system"] as const).map((appearance) => (
          <Action
            key={appearance}
            label={
              appearance === "system"
                ? "Use device"
                : appearance === "light"
                  ? "Light"
                  : "Dark"
            }
            tone={
              (store.settings.appearance ?? "light") === appearance
                ? "primary"
                : "outline"
            }
            onPress={() => settings({ appearance })}
          />
        ))}
      </Row>
      <Toggle
        label="Keep screen awake while a timer is running"
        value={store.settings.keepAwake}
        onChange={(keepAwake) => settings({ keepAwake })}
      />
      <Toggle
        label="Haptic feedback"
        value={store.settings.haptics}
        onChange={(haptics) => settings({ haptics })}
      />
      <Toggle
        label="Dial click sounds"
        value={store.settings.dialSound !== false}
        onChange={(dialSound) => settings({ dialSound })}
      />
      <Toggle
        label={busy ? "Enabling alerts…" : "Background alerts"}
        value={store.settings.notifications}
        onChange={(v) => {
          if (!busy) void alerts(v);
        }}
      />
      {Platform.OS === "android" && store.settings.notifications && (
        <>
          <Body muted>
            {readiness?.exact
              ? "Precise alarm access is allowed."
              : "Precise alarm access is not allowed. Background alerts may arrive late."}
          </Body>
          <Action
            label="Allow precise timer alarms"
            disabled={busy}
            onPress={() =>
              void (async () => {
                setBusy(true);
                try {
                  setReadiness(await requestExactAlerts());
                  settings({ notifications: true });
                } catch {
                  notify(
                    "Could not open precise alarm settings. Try your phone Settings.",
                  );
                } finally {
                  setBusy(false);
                }
              })()
            }
          />
        </>
      )}
      <Body muted>
        Up to 48 upcoming alerts across timers are scheduled. Keep long programs
        open to replenish the schedule. Repeated cues and voice play in the app.
        Alerts are scheduled locally. No notification tokens or timer content
        are sent to a push service. Focus mode, battery restrictions and system
        notification settings can affect delivery. Voice cues and the final
        spoken countdown play while the app is open.
      </Body>
      {Platform.OS !== "web" && (
        <Action
          label="Open phone settings"
          onPress={() =>
            void Linking.openSettings().catch(() =>
              notify("Open your phone Settings and find CorpTimer."),
            )
          }
        />
      )}
      <Rule />
      <Heading>Your data</Heading>
      <Action label="Privacy & data" onPress={() => router.push("/privacy")} />
      <Body>
        Programs, notes and session history are stored on this device. Export
        programs from My programs to move them to another device. This native
        version does not yet sign in to the website or synchronize your private
        library.
      </Body>
      <Body muted>
        Device backups include saved plans, history, notes, specialty clocks,
        favorites and unsent feedback. Account credentials and live control
        links are excluded. Restored specialty clocks are paused; an active
        primary timer is archived to History. Starting again checks your plan.
      </Body>
      <Action
        label="Export device backup"
        disabled={busy || unreadableData}
        onPress={() =>
          void (async () => {
            setBusy(true);
            try {
              await exportFile(
                "corptimer-device-backup.json",
                await exportDeviceData(snapshot()),
              );
            } catch (e) {
              setRecoveryNeeded(true);
              notify(
                e instanceof Error ? e.message : "Could not export backup.",
              );
            } finally {
              setBusy(false);
            }
          })()
        }
      />
      {(unreadableData || recoveryNeeded) && (
        <Action
          label="Export original data for recovery"
          onPress={() =>
            void (async () => {
              try {
                await exportFile(
                  "corptimer-recovery.json",
                  await exportRecoveryData(),
                );
              } catch (e) {
                notify(
                  e instanceof Error
                    ? e.message
                    : "Could not export recovery data.",
                );
              }
            })()
          }
        />
      )}
      <Action
        label="Restore device backup"
        disabled={busy || live.busy}
        onPress={() =>
          void (async () => {
            setBusy(true);
            try {
              const json = await importFile();
              if (json === null) return;
              readDeviceBackup(json);
              if (
                !(await confirm(
                  "Replace local timer data?",
                  "The chosen backup will replace plans, history, notes, specialty clocks, favorites and feedback drafts. Export your current backup first. Account access stays on this device.",
                ))
              )
                return;
              if (live.host) await live.stop();
              await revokeStoredLiveHost();
              overlay.hide();
              await restoreDevice(json);
            } catch (e) {
              notify(
                e instanceof Error
                  ? e.message
                  : "Restore did not finish. Keep your backup and retry.",
              );
            } finally {
              setBusy(false);
            }
          })()
        }
      />
      <Action
        label="Delete local timer data"
        disabled={busy || live.busy}
        onPress={() =>
          void (async () => {
            if (
              !(await confirm(
                "Delete local timer data?",
                "This deletes plans, history, private notes, active timers, specialty setups, favorites and unsent feedback. Account sign-in and server usage are kept. Export a backup first.",
              ))
            )
              return;
            setBusy(true);
            try {
              if (live.host) await live.stop();
              await revokeStoredLiveHost();
              overlay.hide();
              await resetDevice();
            } catch (e) {
              notify(
                e instanceof Error
                  ? e.message
                  : "Could not finish deleting local data. Retry before continuing.",
              );
            } finally {
              setBusy(false);
            }
          })()
        }
      />
      <Rule />
      <Heading>About CorpTimer</Heading>
      <Body>Version {Constants.expoConfig?.version}</Body>
      <Body>
        Meeting, Boxing, Fitness, Pomodoro, Classroom, Chess, Stopwatch,
        Countdown, New Year and 27 specialty timers. No advertising. Trial, Free
        and optional Pro access.
      </Body>
      <Action
        label="Open corptimer.com"
        onPress={() =>
          void Linking.openURL("https://corptimer.com/").catch(() =>
            notify("Could not open your browser."),
          )
        }
      />
      <Body muted>
        Send a message to the team without leaving the app. Your meeting notes
        and history are never attached.
      </Body>
      <Action
        label="Support & feedback"
        onPress={() => router.push("/feedback")}
      />
    </Page>
  );
}
