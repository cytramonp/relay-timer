import React, { useEffect } from "react";
import { Stack } from "expo-router";
import { useFonts } from "expo-font";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AppProvider } from "../state/app-store";
import { ThemeProvider, useTheme } from "../theme";

export const unstable_settings = { initialRouteName: "(tabs)" };
void SplashScreen.preventAutoHideAsync();

function Navigation() {
  const t = useTheme();
  return (
    <>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: t.bg },
          headerTintColor: t.ink,
          contentStyle: { backgroundColor: t.bg },
          headerShadowVisible: false,
          headerBackButtonDisplayMode: "minimal",
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="timer/[kind]" options={{ title: "Timer" }} />
        <Stack.Screen
          name="edit/[kind]"
          options={{ title: "Edit timer", presentation: "modal" }}
        />
      </Stack>
    </>
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
