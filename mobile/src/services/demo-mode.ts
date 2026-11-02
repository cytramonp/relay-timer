import { Platform } from "react-native";
// Local development only. Metro removes this branch from release bundles.
// Never use this mode as evidence of billing or native device behavior.
export const localDemo =
  __DEV__ &&
  Platform.OS === "web" &&
  process.env.EXPO_PUBLIC_LOCAL_DEMO === "1";
