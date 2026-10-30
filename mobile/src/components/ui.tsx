import React, { useCallback } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useColorScheme,
  type TextInputProps,
  type ViewStyle,
} from "react-native";
import { Host, Switch } from "@expo/ui";
import { useFocusEffect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useTheme } from "../theme";
import { useApp } from "../state/app-store";

export async function confirm(
  title: string,
  message: string,
  destructive = false,
): Promise<boolean> {
  if (Platform.OS === "web") return window.confirm(`${title}\n\n${message}`);
  return new Promise((resolve) =>
    Alert.alert(
      title,
      message,
      [
        { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
        {
          text: destructive ? "Reset" : "Continue",
          style: destructive ? "destructive" : "default",
          onPress: () => resolve(true),
        },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    ),
  );
}
export function Body({
  children,
  muted = false,
  style,
}: {
  children: React.ReactNode;
  muted?: boolean;
  style?: ViewStyle | object;
}) {
  const t = useTheme();
  return (
    <Text
      selectable
      style={[
        { fontSize: 16, lineHeight: 24, color: muted ? t.muted : t.ink },
        style,
      ]}
    >
      {children}
    </Text>
  );
}
export function Heading({ children }: { children: React.ReactNode }) {
  const t = useTheme();
  return (
    <Text
      accessibilityRole="header"
      style={{
        fontFamily: "Cantata",
        fontSize: 25,
        lineHeight: 34,
        color: t.ink,
        marginTop: 8,
      }}
    >
      {children}
    </Text>
  );
}
export function Page({ children }: { children: React.ReactNode }) {
  const t = useTheme();
  const scheme = useColorScheme();
  useFocusEffect(
    useCallback(() => {
      if (Platform.OS === "web") return;
      // Apply after the focused native screen updates its window flags.
      const timer = setTimeout(
        () => StatusBar.setStyle(scheme === "dark" ? "light" : "dark"),
        100,
      );
      return () => clearTimeout(timer);
    }, [scheme]),
  );
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      style={{ flex: 1, backgroundColor: t.bg }}
      contentContainerStyle={{
        padding: 20,
        paddingBottom: 48,
        gap: 20,
        width: "100%",
        maxWidth: 850,
        alignSelf: "center",
      }}
    >
      <Notice />
      {children}
    </ScrollView>
  );
}
export function Row({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  return (
    <View
      style={[
        {
          flexDirection: "row",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 10,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
export function Action({
  label,
  onPress,
  tone = "outline",
  disabled = false,
  testID,
}: {
  label: string;
  onPress: () => void;
  tone?: "outline" | "primary" | "danger" | "cream";
  disabled?: boolean;
  testID?: string;
}) {
  const t = useTheme(),
    bg =
      tone === "primary"
        ? t.teal
        : tone === "danger"
          ? t.salmon
          : tone === "cream"
            ? t.cream
            : "transparent",
    fg =
      tone === "primary"
        ? t.bg
        : tone === "danger"
          ? "#431612"
          : tone === "cream"
            ? "#132c30"
            : t.teal;
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: 48,
        paddingHorizontal: 17,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor:
          tone === "danger" ? t.salmon : tone === "cream" ? t.cream : t.teal,
        backgroundColor: bg,
        opacity: disabled ? 0.45 : pressed ? 0.7 : 1,
        justifyContent: "center",
        alignItems: "center",
      })}
    >
      <Text
        style={{
          fontSize: 15,
          fontWeight: "600",
          color: fg,
          textAlign: "center",
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
export function Field({ label, ...props }: TextInputProps & { label: string }) {
  const t = useTheme();
  return (
    <View style={{ gap: 7, flexGrow: 1, flexBasis: 140 }}>
      <Text style={{ color: t.ink, fontSize: 15, fontWeight: "600" }}>
        {label}
      </Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={t.muted}
        maxLength={120}
        {...props}
        style={[
          {
            color: t.ink,
            backgroundColor: t.field,
            borderColor: t.line,
            borderWidth: 1,
            borderRadius: 6,
            minHeight: 48,
            padding: 12,
            fontSize: 17,
          },
          props.style,
        ]}
      />
    </View>
  );
}
export function Toggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  const t = useTheme();
  return (
    <Host matchContents seedColor={t.teal} style={{ minHeight: 48 }}>
      <Switch label={label} value={value} onValueChange={onChange} />
    </Host>
  );
}
export function Notice() {
  const { notice, notify } = useApp(),
    t = useTheme();
  return notice ? (
    <View
      accessibilityRole="alert"
      style={{
        backgroundColor: t.soft,
        padding: 14,
        gap: 8,
        borderBottomColor: t.line,
        borderBottomWidth: StyleSheet.hairlineWidth,
      }}
    >
      <Text selectable style={{ color: t.ink, fontSize: 15, lineHeight: 22 }}>
        {notice}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Dismiss message"
        onPress={() => notify("")}
        style={{ minHeight: 48, justifyContent: "center" }}
      >
        <Text style={{ color: t.teal, fontWeight: "600" }}>Dismiss</Text>
      </Pressable>
    </View>
  ) : null;
}
export function Rule() {
  const t = useTheme();
  return <View style={{ height: 1, backgroundColor: t.line }} />;
}
