import React from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../theme";
import { Platform, useWindowDimensions } from "react-native";

export default function TabLayout() {
  const t = useTheme();
  const { width } = useWindowDimensions();
  const expanded = Platform.OS === "android" && width >= 768;
  return (
    <Tabs
      screenOptions={{
        tabBarPosition: expanded ? "left" : "bottom",
        tabBarActiveTintColor: t.red,
        tabBarInactiveTintColor: t.muted,
        tabBarActiveBackgroundColor: t.soft,
        tabBarInactiveBackgroundColor: "transparent",
        tabBarLabelStyle: { fontSize: 13, fontWeight: "600" },
        tabBarStyle: {
          backgroundColor: t.bg,
          borderTopColor: t.line,
          ...(expanded ? { width: 156, minWidth: 156, maxWidth: 156 } : {}),
        },
        headerStyle: { backgroundColor: t.bg },
        headerTintColor: t.ink,
        headerTitleStyle: { fontFamily: "Cantata" },
        headerShadowVisible: false,
        sceneStyle: { backgroundColor: t.bg },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "CorpTimer",
          tabBarLabel: "Timers",
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="timer-outline"
              color={color as string}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="programs"
        options={{
          title: "My programs",
          tabBarLabel: "Programs",
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="bookmarks-outline"
              color={color as string}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "History",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="time-outline" color={color as string} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="options-outline"
              color={color as string}
              size={size}
            />
          ),
        }}
      />
    </Tabs>
  );
}
