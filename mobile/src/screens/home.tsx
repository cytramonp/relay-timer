import React from "react";
import { SpecialtyLibrary } from "../components/timer-library";
import { Text, View } from "react-native";
import { router } from "expo-router";
import { formatTime, remaining } from "../core/clock";
import { Action, Body, Heading, Page, Row, Rule } from "../components/ui";
import { useTimerNow } from "../hooks/use-timer-now";
import { useApp } from "../state/app-store";
import { useTheme } from "../theme";

export function HomeScreen() {
  const t = useTheme(),
    { store } = useApp(),
    active = store.run;
  const now = useTimerNow(
    active?.status === "running",
    250,
    active?.kind === "newyear",
  );
  return (
    <Page>
      <View style={{ gap: 8 }}>
        <Heading>Every timer. One place.</Heading>
        <Body muted>
          Browse the full collection, group by activity, or star the timers you
          use most.
        </Body>
        <Row>
          <View style={{ height: 3, width: 48, backgroundColor: t.red }} />
          <View style={{ height: 3, width: 48, backgroundColor: t.teal }} />
        </Row>
      </View>
      {active && active.status !== "done" && (
        <View
          style={{
            padding: 18,
            gap: 12,
            backgroundColor: t.clock,
            borderRadius: 14,
          }}
        >
          <Text style={{ color: t.cream, fontSize: 16 }}>
            {active.config.title} · {active.status}
          </Text>
          <Text
            style={{
              color: t.cream,
              fontSize: 38,
              fontFamily: "Manrope",
              fontVariant: ["tabular-nums"],
            }}
          >
            {formatTime(remaining(active, now))}
          </Text>
          <Action
            label="Return to active timer"
            tone="cream"
            onPress={() => router.push(`/timer/${active.kind}`)}
          />
        </View>
      )}
      <SpecialtyLibrary />
      <Heading>Just a few minutes?</Heading>
      <Row>
        {[5, 10, 15, 20, 25, 30].map((m) => (
          <QuickMinute key={m} minutes={m} />
        ))}
      </Row>
      <Rule />
      <Body muted>Programs stay on this device. No account needed.</Body>
    </Page>
  );
}
function QuickMinute({ minutes }: { minutes: number }) {
  const { store, updateDraft } = useApp();
  return (
    <Action
      label={`${minutes} min`}
      onPress={() => {
        updateDraft(
          "simple",
          {
            ...store.drafts.simple,
            duration: minutes * 60,
          },
          true,
        );
        router.push("/timer/simple");
      }}
    />
  );
}
