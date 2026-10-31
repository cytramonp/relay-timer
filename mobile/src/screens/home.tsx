import React from "react";
import { SpecialtyLibrary } from "../components/timer-library";
import { Image, Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { catalog } from "../core/catalog";
import { formatTime, remaining } from "../core/clock";
import { Action, Body, Heading, Page, Row, Rule } from "../components/ui";
import { useTimerNow } from "../hooks/use-timer-now";
import { useApp } from "../state/app-store";
import { useTheme } from "../theme";
import { PlanStatus } from "../components/plan-status";

const images = [
  require("../../assets/boxing.jpg"),
  require("../../assets/fitness.jpg"),
  require("../../assets/pomodoro.jpg"),
  require("../../assets/classroom.jpg"),
  require("../../assets/chess.jpg"),
  require("../../assets/stopwatch.jpg"),
  require("../../assets/simple.jpg"),
  require("../../assets/newyear.jpg"),
];
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
      <PlanStatus />
      <View style={{ gap: 8 }}>
        <Heading>Make time for it.</Heading>
        <Body muted>
          A meeting, a training session, a little focus. Find your rhythm.
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
      <View>
        {catalog.map((item) => (
          <Pressable
            key={item.kind}
            accessibilityRole="button"
            accessibilityLabel={`${item.title} timer`}
            onPress={() => router.push(`/timer/${item.kind}`)}
            style={({ pressed }) => ({
              flexDirection: "row",
              alignItems: "center",
              gap: 16,
              paddingVertical: 18,
              borderBottomWidth: 1,
              borderBottomColor: t.line,
              opacity: pressed ? 0.65 : 1,
            })}
          >
            {item.image !== undefined ? (
              <Image
                source={images[item.image]}
                accessibilityIgnoresInvertColors
                style={{ width: 76, height: 70, borderRadius: 8 }}
              />
            ) : (
              <View
                style={{
                  width: 76,
                  height: 70,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Image
                  source={require("../../assets/icon.png")}
                  style={{ width: 70, height: 70 }}
                />
              </View>
            )}
            <View style={{ flex: 1, gap: 5 }}>
              <Text
                style={{ fontFamily: "Cantata", fontSize: 23, color: t.ink }}
              >
                {item.title}
              </Text>
              <Body muted style={{ fontSize: 14, lineHeight: 20 }}>
                {item.description}
              </Body>
            </View>
            <Ionicons name="chevron-forward" size={20} color={t.teal} />
          </Pressable>
        ))}
      </View>
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
