import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { AppState } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";
import { useApp } from "./app-store";
import { timerNow } from "../services/timer-clock";
import { commandQueue } from "../core/remote-commands";
import { meetingProjection } from "../core/meeting";
type Host = { id: string; token: string; uid: string; expiresAt: number };
type LiveValue = {
  host: Host | null;
  busy: boolean;
  error: string;
  viewer: string;
  controller: string;
  create: () => Promise<void>;
  stop: () => Promise<void>;
};
const Context = createContext<LiveValue | null>(null),
  KEY = "corptimer-live-host-v1";
export function LiveProvider({ children }: { children: React.ReactNode }) {
  const app = useApp(),
    current = useRef(app);
  useEffect(() => {
    current.current = app;
  }, [app]);
  const [host, setHost] = useState<Host | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const owner = useRef<Host | null>(null),
    handled = useRef(new Set<string>()),
    lastCommand = useRef("");
  const projection = () => {
    const s = current.current.snapshot(),
      r = s.run?.kind === "meeting" ? s.run : null;
    return {
      ...meetingProjection(r?.config ?? s.drafts.meeting, r, timerNow()),
      publishedAt: Date.now(),
    };
  };
  async function publish() {
    const h = owner.current;
    if (!h) return;
    if (h.expiresAt <= Date.now()) {
      setError("This live link expired. Create a new one.");
      owner.current = null;
      setHost(null);
      await AsyncStorage.removeItem(KEY);
      return;
    }
    try {
      await (
        await import("../services/live")
      ).publishRoom(h.id, projection(), lastCommand.current);
      if (owner.current?.id === h.id) setError("");
    } catch {
      if (owner.current?.id === h.id)
        setError(
          "Live sharing is disconnected. Keep this app open and reconnect; your local timer still works.",
        );
    }
  }
  useEffect(() => {
    let cancelled = false;
    void AsyncStorage.getItem(KEY)
      .then(async (json) => {
        if (!json) return;
        const saved = JSON.parse(json) as Host;
        if (
          saved.expiresAt > Date.now() &&
          (await (await import("../services/live")).sameOwner(saved.uid)) &&
          !cancelled
        ) {
          owner.current = saved;
          setHost(saved);
        }
      })
      .catch(() => {
        if (!cancelled)
          setError(
            "The previous live link could not reconnect. It expires within 24 hours.",
          );
      });
    return () => {
      cancelled = true;
    };
  }, []);
  useEffect(() => {
    if (!host) return;
    let dispose: (() => void) | undefined,
      cancelled = false;
    void import("../services/live").then((service) => {
      if (cancelled) return;
      const consume = commandQueue({
        now: Date.now,
        current: () => !cancelled && owner.current?.id === host.id,
        async execute(action) {
          const app = current.current,
            s = app.snapshot();
          if (s.run && s.run.kind !== "meeting") return false;
          if (action === "next" && !s.run) return app.start("meeting");
          if (!s.run) return false;
          app.act(action === "pause" ? "toggle" : action);
          return true;
        },
        async acknowledge(id) {
          lastCommand.current = id;
          await publish();
        },
        rejected: () =>
          setError(
            "Remote action was not accepted. Check the current timer, connection and plan, then try again.",
          ),
        clear: (id) => service.clearCommand(host.id, id),
      });
      dispose = service.watchCommands(
        host.id,
        (id, action, at) => {
          void consume(id, action, at);
        },
        () =>
          setError(
            "Remote control disconnected. Reconnect before sharing a control link.",
          ),
      );
      void publish();
    });
    const timer = setInterval(() => {
      void publish();
    }, 15000);
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") void publish();
    });
    return () => {
      cancelled = true;
      dispose?.();
      clearInterval(timer);
      subscription.remove();
    };
    // Publishing and command handlers read the current app snapshot, never a captured countdown.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [host?.id]);
  const r = app.store.run?.kind === "meeting" ? app.store.run : null;
  const fingerprint = JSON.stringify([
    r?.id,
    r?.status,
    r?.index,
    r?.entries.length,
    r?.config ?? app.store.drafts.meeting,
  ]);
  useEffect(() => {
    if (!owner.current) return;
    const id = setTimeout(() => {
      void publish();
    }, 350);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fingerprint]);
  const viewer = host ? `https://corptimer.com/live.html#room=${host.id}` : "",
    controller = host ? `${viewer}&control=${host.token}` : "";
  return (
    <Context.Provider
      value={{
        host,
        busy,
        error,
        viewer,
        controller,
        async create() {
          if (busy || owner.current) return;
          const run = current.current.snapshot().run;
          if (run && run.kind !== "meeting") {
            setError("Finish the active timer before sharing a meeting.");
            return;
          }
          setBusy(true);
          setError("");
          try {
            const id = Crypto.randomUUID().replaceAll("-", ""),
              token = (Crypto.randomUUID() + Crypto.randomUUID()).replaceAll(
                "-",
                "",
              );
            const identity = await (
              await import("../services/live")
            ).createRoom(id, token, projection());
            const next = { id, token, ...identity };
            owner.current = next;
            setHost(next);
            await AsyncStorage.setItem(KEY, JSON.stringify(next));
          } catch {
            setError(
              "Could not create a live link. Check your internet connection and try again.",
            );
          } finally {
            setBusy(false);
          }
        },
        async stop() {
          const h = owner.current;
          if (!h || busy) return;
          setBusy(true);
          try {
            await (await import("../services/live")).endRoom(h.id);
            owner.current = null;
            setHost(null);
            setError("");
            handled.current.clear();
            await AsyncStorage.removeItem(KEY);
          } catch {
            setError(
              "Could not revoke this link. Reconnect and try Stop sharing again.",
            );
            throw Error(
              "Could not stop live sharing. Reconnect before switching meetings.",
            );
          } finally {
            setBusy(false);
          }
        },
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useLive() {
  const value = useContext(Context);
  if (!value) throw Error("LiveProvider missing");
  return value;
}
