import { useTranslate } from "../state/language";
import React, { useState } from "react";
import { Platform, Text, View } from "react-native";
import { Stack, router } from "expo-router";
import { Action, Body, Heading, Page, Row } from "../components/ui";
import { useOverlay } from "../state/overlay-store";
import { useApp } from "../state/app-store";
export default function FloatingSettings() {
  const tr = useTranslate();
  const overlay = useOverlay(),
    { store, settings } = useApp(),
    [error, setError] = useState("");
  return (
    <Page>
      <Stack.Screen
        options={{ title: tr("Floating timer"), presentation: "formSheet" }}
      />
      <Heading>{tr("Keep time in sight.")}</Heading>
      {Platform.OS === "android" ? (
        <>
          <Body>
            {tr(
              "A small draggable clock can stay above your call or presentation. It has Next, Pause, Undo and Extend controls. Close it whenever you are done.",
            )}
          </Body>
          <Heading>{tr("Shape")}</Heading>
          <Row>
            {(["wide", "strip", "square"] as const).map((floatingShape) => (
              <Action
                key={floatingShape}
                label={tr(floatingShape)}
                tone={
                  (store.settings.floatingShape ?? "wide") === floatingShape
                    ? "primary"
                    : "outline"
                }
                onPress={() => settings({ floatingShape })}
              />
            ))}
          </Row>
          <View
            style={{
              backgroundColor: "#061a1e",
              padding: 16,
              borderRadius: 14,
              alignSelf: "center",
              width: store.settings.floatingShape === "square" ? 180 : "100%",
              maxWidth: 300,
              gap: 8,
            }}
          >
            <Text style={{ color: "#a8c2c1" }}>CorpTimer</Text>
            {store.settings.floatingShape !== "strip" && (
              <Text style={{ color: "#f5f2e9" }}>{tr("Meeting")}</Text>
            )}
            <Text
              style={{
                color: "#f5f2e9",
                fontSize: store.settings.floatingShape === "strip" ? 26 : 38,
              }}
            >
              05:00
            </Text>
            <Text style={{ color: "#64c9c4" }}>
              {tr("Next")} {tr("Pause")} +1
            </Text>
          </View>
          <Body>
            {tr(
              store.settings.floatingShape === "strip"
                ? "A shorter window that hides the speaker name."
                : store.settings.floatingShape === "square"
                  ? "A narrower window for keeping more of your other app visible."
                  : "Shows the current speaker, time and controls.",
            )}
          </Body>
          {!overlay.available ? (
            <Body>
              {tr(
                "This preview does not include the Android floating module. Install the CorpTimer APK to use it.",
              )}
            </Body>
          ) : !overlay.allowed ? (
            <>
              <Body>
                {tr(
                  "Android asks you to allow CorpTimer to display over other apps. Return here after enabling it.",
                )}
              </Body>
              <Action
                label={tr("Allow floating timer")}
                tone="primary"
                onPress={overlay.request}
              />
            </>
          ) : (
            <Action
              label={
                overlay.visible
                  ? tr("Floating timer is open")
                  : tr("Open floating timer")
              }
              tone="primary"
              onPress={() =>
                void overlay
                  .show()
                  .then(() => router.back())
                  .catch((e) => setError(e.message))
              }
            />
          )}
          {overlay.visible && (
            <Action
              label={tr("Close floating timer")}
              tone="danger"
              onPress={overlay.hide}
            />
          )}
        </>
      ) : (
        <Body>
          {tr(
            "iOS keeps app windows inside the app. Use the large focus view or share the live screen to another device.",
          )}
        </Body>
      )}
      <Action
        label={tr("Open focus view")}
        onPress={() => router.push("/focus")}
      />
      {error ? <Body>{error}</Body> : null}
    </Page>
  );
}
