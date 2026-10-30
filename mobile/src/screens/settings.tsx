import React, { useState } from "react";
import { Linking, Platform } from "react-native";
import { router } from "expo-router";
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
      <Action label="Privacy & data" onPress={() => router.push("/privacy")} />
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
