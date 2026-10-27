import React, { useEffect } from "react";
import { Stack } from "expo-router";
import { useFonts } from "expo-font";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { Platform, useColorScheme } from "react-native";
import { NavigationBar } from "expo-navigation-bar";
import * as SystemUI from "expo-system-ui";
import {
  ThemeProvider as NavigationThemeProvider,
  DarkTheme,
  DefaultTheme,
} from "expo-router/react-navigation";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AppProvider } from "../state/app-store";
import { ThemeProvider, useTheme } from "../theme";

export const unstable_settings = { initialRouteName: "(tabs)" };
void SplashScreen.preventAutoHideAsync();

function Navigation() {
  const t = useTheme();
  const dark = useColorScheme() === "dark";
  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(t.bg).catch(() => {});
  }, [t.bg]);
  return (
    <NavigationThemeProvider
      value={{
        ...(dark ? DarkTheme : DefaultTheme),
        colors: {
          ...(dark ? DarkTheme : DefaultTheme).colors,
          primary: t.red,
          background: t.bg,
          card: t.bg,
          text: t.ink,
          border: t.line,
          notification: t.red,
        },
      }}
    >
      <StatusBar style={dark ? "light" : "dark"} />
      {Platform.OS === "android" && (
        <NavigationBar style={dark ? "light" : "dark"} />
      )}
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: t.bg },
          headerTintColor: t.ink,
          contentStyle: { backgroundColor: t.bg },
          headerShadowVisible: false,
          headerBackButtonDisplayMode: "minimal",
          statusBarStyle: dark ? "light" : "dark",
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="timer/[kind]" options={{ title: "Timer" }} />
        <Stack.Screen
          name="edit/[kind]"
          options={{ title: "Edit timer", presentation: "modal" }}
        />
      </Stack>
    </NavigationThemeProvider>
  );
}
export default function RootLayout() {
  const [fontsReady, fontError] = useFonts({
    Cantata: require("../../assets/CantataOne-Regular.ttf"),
    Manrope: require("../../assets/Manrope.ttf"),
  });
  useEffect(() => {
    if (fontsReady || fontError) void SplashScreen.hideAsync();
  }, [fontsReady, fontError]);
  if (!fontsReady && !fontError) return null;
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppProvider>
          <Navigation />
        </AppProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
