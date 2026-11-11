import { useTranslate } from "../state/language";
import React, { useState } from "react";
import { Modal, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { IconAction } from "./meeting-clock";
import { useTheme } from "../theme";
/** One mounted timer surface: fullscreen never creates a second running clock. */
export function TimerSurface({
  children,
  identity,
}: {
  children: React.ReactNode;
  identity?: React.ReactNode;
}) {
  const tr = useTranslate();
  const [full, setFull] = useState(false),
    inset = useSafeAreaInsets(),
    t = useTheme();
  const content = (
    <View
      style={{
        backgroundColor: t.clock,
        borderRadius: full ? 0 : 14,
        padding: 22,
        gap: 20,
      }}
    >
      <View style={{ alignItems: "flex-end" }}>
        <IconAction
          dark
          icon={full ? "contract-outline" : "expand-outline"}
          label={full ? tr("Close full screen") : tr("Full screen")}
          onPress={() => setFull(!full)}
        />
      </View>
      {full ? identity : null}
      {children}
    </View>
  );
  return full ? (
    <Modal
      visible
      animationType="fade"
      presentationStyle="fullScreen"
      onRequestClose={() => setFull(false)}
    >
      <StatusBar style="light" />
      <ScrollView
        style={{ backgroundColor: t.clock, flex: 1 }}
        contentContainerStyle={{
          paddingTop: inset.top,
          paddingBottom: inset.bottom,
          flexGrow: 1,
          justifyContent: "center",
          width: "100%",
          maxWidth: 1000,
          alignSelf: "center",
        }}
      >
        {content}
      </ScrollView>
    </Modal>
  ) : (
    content
  );
}
