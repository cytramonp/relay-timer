import React, { useEffect } from "react";
import { ScrollView, Text } from "react-native";
import { Stack, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";
import { useTimerNow } from "../hooks/use-timer-now";
import { useApp } from "../state/app-store";
import { useTheme } from "../theme";
import { MeetingClock } from "../components/meeting-clock";
export default function FocusScreen() {
  const { store, start, act } = useApp(),
    t = useTheme(),
    inset = useSafeAreaInsets();
  const run = store.run?.kind === "meeting" ? store.run : null,
    config = run?.config ?? store.drafts.meeting;
  const now = useTimerNow(run?.status === "running");
  useEffect(() => {
    void activateKeepAwakeAsync("focus").catch(() => {});
    return () => {
      void deactivateKeepAwake("focus");
    };
  }, []);
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="never"
      style={{ flex: 1, backgroundColor: t.clock }}
      contentContainerStyle={{
        paddingTop: inset.top + 16,
        paddingBottom: inset.bottom + 20,
        justifyContent: "center",
        flexGrow: 1,
        maxWidth: 900,
        alignSelf: "center",
        width: "100%",
      }}
    >
      <Stack.Screen
        options={{
          headerShown: false,
          presentation: "fullScreenModal",
          statusBarStyle: "light",
        }}
      />
      <StatusBar style="light" />
      <MeetingClock
        config={config}
        run={run}
        now={now}
        focus
        onFocus={() => router.back()}
        onNext={() => (run ? act("next") : start("meeting"))}
        onToggle={() => act("toggle")}
        onUndo={() => act("undo")}
        onReset={() => {
          act("reset");
          router.back();
        }}
        onExtend={() => act("extend")}
      />
      <Text
        style={{
          color: t.clockMuted,
          fontSize: 12,
          textAlign: "center",
          padding: 16,
        }}
      >
        Focus view stays in CorpTimer. Your screen stays awake.
      </Text>
    </ScrollView>
  );
}
