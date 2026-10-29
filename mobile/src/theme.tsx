import React, { createContext, useContext, useEffect } from "react";
import { Appearance, Platform, useColorScheme } from "react-native";
import { useApp } from "./state/app-store";

const light = {
  bg: "#eeece5",
  field: "#f6f4ee",
  ink: "#20211e",
  muted: "#62635e",
  line: "#bbbcb4",
  red: "#b82933",
  teal: "#17676b",
  soft: "#d6e5e2",
  clock: "#061a1e",
  cream: "#f5f2e9",
  salmon: "#ff9b90",
  bright: "#64c9c4",
  panel: "#f6f4ee",
  clockMuted: "#a8c2c1",
  clockTrack: "#29464b",
  clockLine: "#355157",
  onSignal: "#112e31",
  success: "#246841",
  dangerText: "#8e2925",
  citron: "#e7e9b1",
  peach: "#f1d4c5",
  lilac: "#ded5e7",
  mint: "#d5e6db",
  isDark: false,
};
const dark = {
  ...light,
  bg: "#182225",
  field: "#233235",
  ink: "#f5f2e9",
  muted: "#b8c5c2",
  line: "#526663",
  red: "#ff9b90",
  teal: "#83d4ce",
  soft: "#28494a",
  clock: "#061a1e",
  panel: "#1c3033",
  success: "#9ed8ba",
  dangerText: "#ffb1a5",
  isDark: true,
};
const Context = createContext(light);
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { store } = useApp(),
    preference = store.settings.appearance ?? "light",
    system = useColorScheme();
  useEffect(() => {
    if (Platform.OS !== "web")
      Appearance.setColorScheme(
        preference === "system" ? "unspecified" : preference,
      );
  }, [preference]);
  const isDark =
    preference === "system" ? system === "dark" : preference === "dark";
  return (
    <Context.Provider value={isDark ? dark : light}>
      {children}
    </Context.Provider>
  );
}
export const useTheme = () => useContext(Context);
export const metrics = {
  page: 18,
  gap: 16,
  section: 28,
  radius: 16,
  control: 12,
  touch: 48,
  row: 100,
};
