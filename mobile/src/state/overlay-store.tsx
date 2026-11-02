import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { AppState, Platform } from "react-native";
import { timerNow, monotonicNow } from "../services/timer-clock";
import Overlay from "../../modules/corptimer-overlay";
import { useApp } from "./app-store";
import { meetingProjection, meetingView } from "../core/meeting";
type OverlayValue = {
  available: boolean;
  allowed: boolean;
  visible: boolean;
  request: () => void;
  show: () => Promise<void>;
  hide: () => void;
};
const Context = createContext<OverlayValue | null>(null);
export function OverlayProvider({ children }: { children: React.ReactNode }) {
  const available = Platform.OS === "android" && !!Overlay;
  const app = useApp(),
    current = useRef(app),
    [allowed, setAllowed] = useState(() =>
      available ? !!Overlay?.hasPermission() : false,
    ),
    [visible, setVisible] = useState(() =>
      available ? !!Overlay?.isVisible() : false,
    );
  useEffect(() => {
    current.current = app;
  }, [app]);
  function snapshot() {
    const s = current.current.snapshot(),
      r = s.run?.kind === "meeting" ? s.run : null,
      c = r?.config ?? s.drafts.meeting,
      now = timerNow(),
      view = meetingView(c, r, now);
    return {
      ...meetingProjection(c, r, now),
      publishedAt: Date.now(),
      publishedUptime: monotonicNow(),
      progress: view.progress,
      progressDuration: view.available,
      nextBudget: view.nextBudget,
      turn: r?.entries.length ?? -1,
      shape: s.settings.floatingShape ?? "wide",
    };
  }
  useEffect(() => {
    if (!available || !Overlay) return;
    const listener = Overlay.addListener("onCommand", ({ action }) => {
      const app = current.current,
        r = app.snapshot().run;
      if (action === "close" || action === "closed") {
        setVisible(false);
        return;
      }
      if (action === "tick") {
        app.refreshRun();
        return;
      }
      if (r && r.kind !== "meeting") return;
      if (action === "next" && !r) app.start("meeting");
      else if (["next", "pause", "undo", "extend"].includes(action))
        app.act(
          action === "pause"
            ? "toggle"
            : (action as "next" | "undo" | "extend"),
        );
      Overlay?.update(snapshot());
    });
    const state = AppState.addEventListener("change", (state) => {
      if (state === "active" && Overlay) {
        setAllowed(Overlay.hasPermission());
        setVisible(Overlay.isVisible());
      }
    });
    return () => {
      listener.remove();
      state.remove();
    };
    // Native event handlers read the current store; they do not capture a particular speaker.
  }, [available]);
  const r = app.store.run;
  const fingerprint = JSON.stringify([
    visible,
    Math.floor((r?.elapsed ?? 0) / 1000),
    r?.kind,
    r?.status,
    r?.index,
    r?.entries.length,
    r?.config ?? app.store.drafts.meeting,
    app.store.settings.floatingShape,
  ]);
  useEffect(() => {
    if (!visible || !Overlay) return;
    if (r && r.kind !== "meeting") {
      Overlay.hide();
      return;
    }
    Overlay.update(snapshot());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fingerprint]);
  return (
    <Context.Provider
      value={{
        available,
        allowed,
        visible,
        request() {
          Overlay?.requestPermission();
        },
        async show() {
          if (!Overlay || !available)
            throw Error("Install the Android build to use a floating timer.");
          if (!Overlay.hasPermission())
            throw Error("Allow floating timers in Android settings first.");
          const r = current.current.snapshot().run;
          if (r && r.kind !== "meeting" && r.status !== "done")
            throw Error(
              "Finish the other timer before opening a floating meeting.",
            );
          await Overlay.show(snapshot());
          setVisible(true);
        },
        hide() {
          Overlay?.hide();
          setVisible(false);
        },
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useOverlay() {
  const c = useContext(Context);
  if (!c) throw Error("OverlayProvider missing");
  return c;
}
