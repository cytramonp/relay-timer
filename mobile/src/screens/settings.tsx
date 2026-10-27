import React, { useState } from "react";
import { Linking, Platform } from "react-native";
import {
  Action,
  Body,
  confirm,
  Heading,
  Page,
  Rule,
  Toggle,
} from "../components/ui";
import { useApp } from "../state/app-store";
import { requestNotifications } from "../services/notifications";
import { exportFile } from "../services/files";
import { rawStore } from "../services/storage";

export function SettingsScreen() {
  const { store, settings, notify, resetDevice } = useApp(),
    [busy, setBusy] = useState(false);
  async function alerts(enabled: boolean) {
    if (!enabled) {
      settings({ notifications: false });
      return;
    }
    setBusy(true);
    try {
      if (await requestNotifications()) {
        settings({ notifications: true });
        notify(
          "Background alerts are enabled. Try a short timer with the screen locked.",
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
        label={busy ? "Enabling alerts…" : "Background alerts"}
        value={store.settings.notifications}
        onChange={(v) => {
          if (!busy) void alerts(v);
        }}
      />
      <Body muted>
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
      <Body>
        Programs, notes and session history are stored on this device. Export
        programs from My programs to move them to another device. This native
        version does not yet sign in to the website or synchronize your private
        library.
      </Body>
      <Action
        label="Export device data"
        onPress={() =>
          void exportFile("corptimer-device-data.json", rawStore()).catch((e) =>
            notify(e.message),
          )
        }
      />
      <Action
        label="Reset local library"
        onPress={() =>
          void confirm(
            "Delete all local data?",
            "This removes programs, history, notes and the active timer from this device. Export a backup first. This cannot be undone.",
          ).then((ok) => {
            if (ok) resetDevice();
          })
        }
      />
      <Rule />
      <Heading>About CorpTimer</Heading>
      <Body>Version 0.1.0 · mobile beta</Body>
      <Body>
        Meeting, Boxing, Fitness, Pomodoro, Classroom, Chess, Stopwatch,
        Countdown and New Year. No account, advertising or subscription.
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
        For support, use this project’s GitHub Issues. Do not include private
        meeting notes or personal data.
      </Body>
      <Action
        label="Support & feedback"
        onPress={() =>
          void Linking.openURL(
            "https://github.com/cytramonp/relay-timer/issues",
          ).catch(() => notify("Could not open your browser."))
        }
      />
    </Page>
  );
}
