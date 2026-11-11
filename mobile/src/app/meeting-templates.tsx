import { useTranslate } from "../state/language";
import React from "react";
import { Pressable, Text, View } from "react-native";
import { Stack, router } from "expo-router";
import * as Crypto from "expo-crypto";
import { Ionicons } from "@expo/vector-icons";
import { Action, Body, useConfirm, Heading, Page } from "../components/ui";
import { meetingPresets } from "../core/meeting-presets";
import { totalSeconds } from "../core/meeting";
import { useApp } from "../state/app-store";
import { useTheme } from "../theme";
import type { Config } from "../core/types";
import { useLive } from "../state/live-store";
export default function TemplatesSheet() {
  const tr = useTranslate();
  const confirm = useConfirm();
  const live = useLive();
  const { store, editMeeting, act } = useApp(),
    t = useTheme();
  async function apply(c: Config) {
    if (live.host) {
      try {
        await live.stop();
      } catch {
        return;
      }
    }
    if (store.run?.kind === "meeting") {
      if (
        store.run.status !== "done" &&
        !(await confirm(
          tr("Use this template?"),
          tr("Your current session will be kept in History."),
        ))
      )
        return;
      act("reset");
    }
    editMeeting(
      {
        ...c,
        agenda: c.agenda.map((a) => ({ ...a, id: Crypto.randomUUID() })),
      },
      true,
    );
    router.back();
  }
  return (
    <Page>
      <Stack.Screen
        options={{ title: tr("Templates"), presentation: "formSheet" }}
      />
      <Heading>{tr("A good meeting starts here.")}</Heading>
      <Body muted>{tr("A repeatable plan, with your own rhythm.")}</Body>
      <Action
        label={tr("Save current agenda as template")}
        tone="primary"
        onPress={() => router.push("/save-meeting")}
      />
      {store.programs.some((p) => p.kind === "meeting") && (
        <>
          <Heading>{tr("Your templates")}</Heading>
          {store.programs
            .filter((p) => p.kind === "meeting")
            .map((p) => (
              <Pressable
                key={p.id}
                accessibilityRole="button"
                accessibilityLabel={tr("Use {0}", String(p.name))}
                onPress={() => void apply(p.config)}
                style={{
                  paddingVertical: 16,
                  gap: 5,
                  borderBottomWidth: 1,
                  borderColor: t.line,
                }}
              >
                <Text
                  style={{ fontFamily: "Cantata", color: t.ink, fontSize: 20 }}
                >
                  {p.name}
                </Text>
                <Text style={{ color: t.muted, fontSize: 13 }}>
                  {p.config.agenda.length}
                  {tr(" slots ·")} {totalSeconds(p.config.agenda) / 60}
                  {tr(" min")}
                </Text>
              </Pressable>
            ))}
        </>
      )}
      <Heading>{tr("Start with a little structure.")}</Heading>
      {meetingPresets.map((p) => (
        <Pressable
          key={p.name}
          accessibilityRole="button"
          accessibilityLabel={tr("Use {0}", String(p.name))}
          onPress={() => void apply(p.config)}
          style={({ pressed }) => ({
            flexDirection: "row",
            alignItems: "center",
            gap: 16,
            paddingVertical: 16,
            borderBottomWidth: 1,
            borderColor: t.line,
            opacity: pressed ? 0.6 : 1,
          })}
        >
          <View
            style={{
              width: 54,
              height: 54,
              borderRadius: 12,
              backgroundColor: t[p.color],
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons
              name={
                p.icon === "coffee"
                  ? "cafe-outline"
                  : p.icon === "loop"
                    ? "repeat-outline"
                    : p.icon === "focus"
                      ? "scan-outline"
                      : p.icon === "spark"
                        ? "sparkles-outline"
                        : p.icon === "grid"
                          ? "grid-outline"
                          : "people-outline"
              }
              size={26}
              color={t.onSignal}
            />
          </View>
          <View style={{ flex: 1, gap: 5 }}>
            <Text style={{ fontFamily: "Cantata", fontSize: 20, color: t.ink }}>
              {p.name}
            </Text>
            <Text style={{ fontSize: 13, color: t.muted }}>
              {totalSeconds(p.config.agenda) / 60}
              {tr(" min ·")} {p.config.agenda.length}
              {tr(" slots")}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={t.teal} />
        </Pressable>
      ))}
      <Action
        label={tr("Manage saved templates")}
        onPress={() => {
          router.back();
          router.push("/(tabs)/programs");
        }}
      />
    </Page>
  );
}
