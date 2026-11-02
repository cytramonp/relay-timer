import { useCallback, useState } from "react";
import { AppState } from "react-native";
import { timerNow } from "../services/timer-clock";
import { useFocusEffect } from "expo-router";

// Presentation updates belong to the visible screen, never the global store.
export function useTimerNow(active: boolean, cadence = 250, calendar = false) {
  const [now, setNow] = useState(() => (calendar ? Date.now() : timerNow()));
  useFocusEffect(
    useCallback(() => {
      let timer: ReturnType<typeof setInterval> | undefined;
      const stop = () => {
        if (timer) clearInterval(timer);
        timer = undefined;
      };
      const refresh = () => {
        stop();
        setNow(calendar ? Date.now() : timerNow());
        if (
          active &&
          AppState.currentState !== "background" &&
          AppState.currentState !== "inactive"
        )
          timer = setInterval(
            () => setNow(calendar ? Date.now() : timerNow()),
            cadence,
          );
      };
      refresh();
      const subscription = AppState.addEventListener("change", refresh);
      return () => {
        stop();
        subscription.remove();
      };
    }, [active, cadence, calendar]),
  );
  return now;
}
