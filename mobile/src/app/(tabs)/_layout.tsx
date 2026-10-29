import React from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../theme";
import { Image, Platform, Text, View, useWindowDimensions } from "react-native";

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
          headerTitle: () => (
            <View
              style={{ flexDirection: "row", gap: 8, alignItems: "center" }}
            >
              <Image
                source={require("../../../assets/icon.png")}
                style={{ width: 30, height: 30, borderRadius: 4 }}
              />
              <Text
                style={{ color: t.ink, fontFamily: "Cantata", fontSize: 21 }}
              >
                Corp<Text style={{ color: t.red }}>Timer</Text>
              </Text>
            </View>
          ),
          tabBarLabel: "Meeting",
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="people-outline"
              color={color as string}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="timers"
        options={{
          title: "Other timers",
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
          tabBarLabel: "Library",
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
