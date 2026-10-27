import React, { createContext, useContext } from "react";
import { useColorScheme } from "react-native";

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
};
const Context = createContext(light);
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <Context.Provider value={useColorScheme() === "dark" ? dark : light}>
      {children}
    </Context.Provider>
  );
}
export const useTheme = () => useContext(Context);
