import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { AppState } from "react-native";
import * as Crypto from "expo-crypto";
import {
  advance,
  createRun,
  elapsed,
  extendRun,
  finishRun,
  nextPhase,
  remaining,
  report,
  switchSide,
  toggleRun,
} from "../core/clock";
import type {
  Config,
  Kind,
  Program,
  Run,
  Settings,
  Store,
} from "../core/types";
import { emptyStore, loadStore, saveStore } from "../services/storage";
import { syncNotifications } from "../services/notifications";
import { playCue } from "../services/audio";
import { clone } from "../core/clone";

type Action =
  "toggle" | "next" | "extend" | "finish" | "lap" | "undo" | "reset";
type ContextValue = {
  store: Store;
  notice: string;
  notify: (text: string) => void;
  updateDraft: (kind: Kind, config: Config) => boolean;
  start: (kind: Kind) => void;
  act: (action: Action) => void;
  chess: (side: number) => void;
  notes: (text: string) => void;
  saveProgram: (kind: Kind, name: string) => void;
  deleteProgram: (id: string) => void;
  importPrograms: (programs: Program[]) => void;
  removeReport: (id: string) => void;
  settings: (values: Partial<Settings>) => void;
  canUndo: boolean;
  resetDevice: () => void;
};
const Context = createContext<ContextValue | null>(null);
export function AppProvider({ children }: { children: React.ReactNode }) {
  const [loaded] = useState(loadStore),
    [store, setStore] = useState(loaded.store),
    [notice, notify] = useState(loaded.error),
    [canUndo, setCanUndo] = useState(false);
  const current = useRef(store),
    undo = useRef<Run[]>([]),
    protectedData = useRef(!!loaded.error);
  function commit(next: Store, schedule = true) {
    current.current = next;
    setStore(next);
    setCanUndo(undo.current.length > 0);
    let saved = false;
    if (!protectedData.current) {
      try {
        saveStore(next);
        saved = true;
      } catch {
        notify(
          "Could not save on this device. Export your programs from My programs.",
        );
      }
    } else
      notify(
        "Local saving is paused to preserve unreadable data. Export device data in Settings, then reset the local library.",
      );
    if (schedule)
      void syncNotifications(next.run, next.settings.notifications).catch(() =>
        notify(
          "Timer is running, but alerts could not be scheduled. Keep the app open.",
        ),
      );
    return saved;
  }
  function setRun(run: Run | null, remember = false) {
    const s = current.current;
    if (remember && s.run) {
      undo.current.push(advance(s.run, Date.now()));
      undo.current = undo.current.slice(-20);
    }
    let history = s.history;
    if (run?.status === "done")
      history = [report(run), ...history.filter((h) => h.id !== run.id)].slice(
        0,
        100,
      );
    commit({ ...s, run, history });
  }
  useEffect(() => {
    let lastSecond = -1;
    const timer = setInterval(() => {
      const s = current.current;
      if (!s.run || s.run.status !== "running") return;
      const now = Date.now(),
        before = s.run,
        r = advance(before, now);
      const changed = r.status !== before.status || r.index !== before.index;
      const count = Math.ceil(remaining(r, now) / 1000),
        isWork = r.phases[r.index]?.type === "work";
      if (
        AppState.currentState === "active" ||
        AppState.currentState === null
      ) {
        if (changed)
          void playCue(
            r.config,
            r.status === "done" ? "Timer complete" : r.phases[r.index]?.name,
            s.settings.haptics,
          ).catch(() =>
            notify("Sound could not play. Check your device volume."),
          );
        else if (
          count !== lastSecond &&
          ((isWork && count === r.config.warning && count > 0) ||
            (count > 0 && count <= r.config.finalCue))
        )
          void playCue(
            r.config,
            count <= r.config.finalCue
              ? String(count)
              : `${count} seconds remaining`,
            s.settings.haptics,
          ).catch(() => {});
      }
      lastSecond = count;
      if (changed) setRun(r);
      else {
        current.current = { ...s, run: r };
        setStore(current.current);
      }
    }, 200);
    const subscription = AppState.addEventListener("change", (state) => {
      const s = current.current;
      if (s.run) {
        const r = advance(s.run, Date.now());
        commit({ ...s, run: r });
      }
      if (state === "active") lastSecond = -1;
    });
    return () => {
      clearInterval(timer);
      subscription.remove();
    };
    // All callbacks read current.current; subscribing once avoids restarting the clock on every tick.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const value: ContextValue = {
    store,
    notice,
    notify,
    canUndo,
    updateDraft(kind, config) {
      return commit(
        {
          ...current.current,
          drafts: { ...current.current.drafts, [kind]: config },
        },
        false,
      );
    },
    start(kind) {
      undo.current = [];
      const s = current.current;
      let history = s.history;
      if (s.run?.startedAt && s.run.status !== "done")
        history = [report(finishRun(s.run, Date.now())), ...history].slice(
          0,
          100,
        );
      const r = toggleRun(
        createRun(kind, s.drafts[kind], Crypto.randomUUID()),
        Date.now(),
      );
      commit({ ...s, run: r, history });
      void playCue(
        r.config,
        r.kind === "chess" ? "" : r.phases[0]?.name,
        s.settings.haptics,
      ).catch(() => {});
    },
    act(action) {
      const s = current.current;
      if (!s.run) return;
      const now = Date.now(),
        r = advance(s.run, now);
      if (action === "undo") {
        const old = undo.current.pop();
        if (old) {
          const restored = {
            ...old,
            status:
              old.status === "running" ? ("running" as const) : old.status,
            anchor: old.status === "running" ? now : null,
          };
          commit({
            ...s,
            run: restored,
            history: s.history.filter((h) => h.id !== old.id),
          });
        }
        return;
      }
      if (action === "reset") {
        undo.current = [];
        const history =
          r.startedAt && r.status !== "done"
            ? [
                report(finishRun(r, now)),
                ...s.history.filter((h) => h.id !== r.id),
              ].slice(0, 100)
            : s.history;
        commit({ ...s, run: null, history });
        return;
      }
      if (action === "toggle") setRun(toggleRun(r, now));
      if (action === "next") setRun(nextPhase(r, now), true);
      if (action === "extend") setRun(extendRun(r, 60000, now), true);
      if (action === "finish") setRun(finishRun(r, now), true);
      if (action === "lap" && r.kind === "stopwatch" && r.status === "running")
        setRun({ ...r, laps: [...r.laps, elapsed(r, now)].slice(-500) }, false);
    },
    chess(side) {
      const s = current.current;
      if (s.run) setRun(switchSide(s.run, side, Date.now()));
    },
    notes(text) {
      const s = current.current;
      if (s.run)
        commit({ ...s, run: { ...s.run, notes: text.slice(0, 10000) } }, false);
    },
    saveProgram(kind, name) {
      const s = current.current;
      if (s.programs.length >= 200) {
        notify("You have 200 saved programs. Export or remove one first.");
        return;
      }
      const program = {
        id: Crypto.randomUUID(),
        kind,
        name: name.trim().slice(0, 120) || s.drafts[kind].title,
        config: clone(s.drafts[kind]),
        updatedAt: Date.now(),
      };
      if (commit({ ...s, programs: [program, ...s.programs] }, false))
        notify(`Saved “${program.name}” on this device.`);
    },
    deleteProgram(id) {
      commit(
        {
          ...current.current,
          programs: current.current.programs.filter((p) => p.id !== id),
        },
        false,
      );
    },
    importPrograms(programs) {
      const s = current.current;
      if (s.programs.length + programs.length > 200)
        throw Error(
          "The library can hold 200 programs. Export or remove some first.",
        );
      if (!commit({ ...s, programs: [...programs, ...s.programs] }, false))
        return;
      notify(
        `Imported ${programs.length} program${programs.length === 1 ? "" : "s"}.`,
      );
    },
    removeReport(id) {
      commit(
        {
          ...current.current,
          history: current.current.history.filter((r) => r.id !== id),
        },
        false,
      );
    },
    settings(values) {
      commit({
        ...current.current,
        settings: { ...current.current.settings, ...values },
      });
    },
    resetDevice() {
      protectedData.current = false;
      undo.current = [];
      commit(emptyStore());
      notify("Local library reset.");
    },
  };
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useApp() {
  const context = useContext(Context);
  if (!context) throw Error("AppProvider is missing.");
  return context;
}
