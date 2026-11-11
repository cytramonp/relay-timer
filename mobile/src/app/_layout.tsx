import { LanguageProvider, useTranslate } from "../state/language";
import React, { useEffect } from "react";
import { Stack } from "expo-router";
import { useFonts } from "expo-font";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { Platform, Linking, Text } from "react-native";
import { localDemo } from "../services/demo-mode";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { favoritesKey, openTimer } from "../components/timer-library";
import { NavigationBar } from "expo-navigation-bar";
import * as SystemUI from "expo-system-ui";
import {
  ThemeProvider as NavigationThemeProvider,
  DarkTheme,
  DefaultTheme,
} from "expo-router/react-navigation";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AppProvider, useApp } from "../state/app-store";
import { ThemeProvider, useTheme } from "../theme";
import { LiveProvider } from "../state/live-store";
import { OverlayProvider } from "../state/overlay-store";
import { initializeBilling } from "../services/billing";

export const unstable_settings = { initialRouteName: "(tabs)" };
void SplashScreen.preventAutoHideAsync();

function Navigation() {
  const tr = useTranslate();
  useEffect(initializeBilling, []);
  useEffect(() => {
    let live = true;
    void Promise.all([
      Linking.getInitialURL(),
      AsyncStorage.getItem(favoritesKey),
    ])
      .then(([url, saved]) => {
        if (!live || url || !saved) return;
        const preference = JSON.parse(saved);
        if (typeof preference.home === "string")
          openTimer(preference.home, true);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);
  const t = useTheme();
  const dark = t.isDark;
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
      {localDemo ? (
        <Text
          style={{
            backgroundColor: "#fff0b3",
            color: "#332500",
            textAlign: "center",
            padding: 4,
          }}
        >
          LOCAL DEMO · no purchases or account
        </Text>
      ) : null}
      {Platform.OS === "android" && (
        <NavigationBar style={dark ? "light" : "dark"} />
      )}
      <Stack
        screenOptions={{
          freezeOnBlur: true,
          headerStyle: { backgroundColor: t.bg },
          headerTintColor: t.ink,
          contentStyle: { backgroundColor: t.bg },
          headerShadowVisible: false,
          headerBackButtonDisplayMode: "minimal",
          statusBarStyle: dark ? "light" : "dark",
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="timer/[kind]" options={{ title: tr("Timer") }} />
        <Stack.Screen
          name="edit/[kind]"
          options={{ title: tr("Edit timer"), presentation: "modal" }}
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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppProvider>
          <LanguageProvider>
            <AppContents />
          </LanguageProvider>
        </AppProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function AppContents() {
  const { dataVersion } = useApp();
  return (
    <ThemeProvider key={dataVersion}>
      <OverlayProvider>
        <LiveProvider>
          <Navigation />
        </LiveProvider>
      </OverlayProvider>
    </ThemeProvider>
  );
}
