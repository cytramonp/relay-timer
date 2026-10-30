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
  ParkingItem,
  Store,
} from "../core/types";
import { emptyStore, loadStore, saveStore } from "../services/storage";
import { syncNotifications } from "../services/notifications";
import { playCue } from "../services/audio";
import { clone } from "../core/clone";
import { applyRun, recoverStore } from "../core/recovery";
import { editMeetingRun, nudgeMeeting, undoMeeting } from "../core/meeting";
import { validateConfig } from "../core/backup";
import { requireCustomization, reserveSession } from "../services/billing";

type Action =
  | "toggle"
  | "next"
  | "extend"
  | "finish"
  | "lap"
  | "undo"
  | "reset"
  | "clock-back"
  | "clock-forward";
type ContextValue = {
  store: Store;
  snapshot: () => Store;
  refreshRun: () => void;
  seekMeeting: (ms: number) => void;
  notice: string;
  notify: (text: string) => void;
  updateDraft: (kind: Kind, config: Config, preset?: boolean) => boolean;
  editMeeting: (config: Config, preset?: boolean) => void;
  parking: (items: ParkingItem[]) => void;
  duplicateProgram: (id: string) => void;
  reviseProgram: (program: Program) => boolean;
  start: (kind: Kind) => Promise<boolean>;
  act: (action: Action) => void;
  chess: (side: number) => void;
  notes: (text: string) => void;
  saveProgram: (
    kind: Kind,
    name: string,
    appearance?: Pick<Program, "color" | "icon">,
    config?: Config,
  ) => boolean;
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
    starting = useRef(false),
    pendingStart = useRef<{ kind: Kind; id: string } | null>(null),
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
    commit(applyRun(s, run));
  }
  function canCustomize() {
    try {
      requireCustomization();
      return true;
    } catch (e) {
      notify(
        e instanceof Error ? e.message : "Check your plan before editing.",
      );
      return false;
    }
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
        commit(recoverStore(s, Date.now()));
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
    snapshot: () => current.current,
    refreshRun: () => commit(recoverStore(current.current, Date.now())),
    seekMeeting(ms) {
      const r = current.current.run,
        now = Date.now();
      if (r?.kind === "meeting" && Number.isFinite(ms))
        setRun(nudgeMeeting(r, ms - elapsed(r, now), now));
    },
    notice,
    notify,
    canUndo:
      store.run?.kind === "meeting" ? store.run.entries.length > 0 : canUndo,
    editMeeting(config, preset = false) {
      if (!preset && !canCustomize()) return;
      const c = validateConfig("meeting", config),
        s = current.current;
      const run =
        s.run?.kind === "meeting" && s.run.status !== "done"
          ? editMeetingRun(advance(s.run, Date.now()), c, Date.now())
          : s.run;
      commit({ ...s, drafts: { ...s.drafts, meeting: c }, run });
    },
    parking(items) {
      const s = current.current;
      if (s.run?.kind === "meeting")
        commit(
          { ...s, run: { ...s.run, parking: items.slice(0, 2000) } },
          false,
        );
      else commit({ ...s, meetingParking: items.slice(0, 2000) }, false);
    },
    duplicateProgram(id) {
      if (!canCustomize()) return;
      const s = current.current,
        p = s.programs.find((p) => p.id === id);
      if (!p || s.programs.length >= 200) return;
      commit(
        {
          ...s,
          programs: [
            {
              ...clone(p),
              id: Crypto.randomUUID(),
              name: `${p.name.slice(0, 110)} copy`,
              updatedAt: Date.now(),
            },
            ...s.programs,
          ],
        },
        false,
      );
    },
    reviseProgram(program) {
      if (!canCustomize()) return false;
      const s = current.current;
      return commit(
        {
          ...s,
          programs: s.programs.map((p) =>
            p.id === program.id
              ? {
                  ...program,
                  updatedAt: Date.now(),
                  config: validateConfig(program.kind, program.config),
                }
              : p,
          ),
        },
        false,
      );
    },
    updateDraft(kind, config, preset = false) {
      if (!preset && !canCustomize()) return false;
      return commit(
        {
          ...current.current,
          drafts: { ...current.current.drafts, [kind]: config },
        },
        false,
      );
    },
    async start(kind) {
      if (starting.current) return false;
      starting.current = true;
      if (pendingStart.current?.kind !== kind)
        pendingStart.current = { kind, id: Crypto.randomUUID() };
      const id = pendingStart.current.id;
      try {
        await reserveSession(id);
      } catch (e) {
        notify(
          e instanceof Error
            ? e.message
            : "Reconnect to start a new timer. Your current timer can continue.",
        );
        starting.current = false;
        return false;
      }
      undo.current = [];
      const s = current.current;
      let history = s.history;
      if (s.run?.startedAt && s.run.status !== "done")
        history = [report(finishRun(s.run, Date.now())), ...history].slice(
          0,
          100,
        );
      const r = toggleRun(createRun(kind, s.drafts[kind], id), Date.now());
      if (kind === "meeting") r.parking = clone(s.meetingParking ?? []);
      commit({ ...s, run: r, history });
      pendingStart.current = null;
      starting.current = false;
      void playCue(
        r.config,
        r.kind === "chess" ? "" : r.phases[0]?.name,
        s.settings.haptics,
      ).catch(() => {});
      return true;
    },
    act(action) {
      const s = current.current;
      if (!s.run) return;
      const now = Date.now(),
        r = advance(s.run, now);
      if (action === "undo") {
        if (r.kind === "meeting") {
          const restored = undoMeeting(r, now);
          commit({
            ...s,
            run: restored,
            history: s.history.filter((h) => h.id !== r.id),
          });
          return;
        }
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
        commit({
          ...s,
          run: null,
          history,
          ...(r.kind === "meeting" ? { meetingParking: [] } : {}),
        });
        return;
      }
      if (action === "toggle") setRun(toggleRun(r, now));
      if (action === "next") setRun(nextPhase(r, now), true);
      if (action === "extend") setRun(extendRun(r, 60000, now), true);
      if (action === "finish") setRun(finishRun(r, now), true);
      if (action === "clock-back" || action === "clock-forward")
        setRun(nudgeMeeting(r, action === "clock-back" ? -60000 : 60000, now));
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
    saveProgram(kind, name, appearance, config) {
      if (!canCustomize()) return false;
      const s = current.current;
      if (s.programs.length >= 200) {
        notify("You have 200 saved programs. Export or remove one first.");
        return false;
      }
      const program = {
        id: Crypto.randomUUID(),
        kind,
        name: name.trim().slice(0, 120) || s.drafts[kind].title,
        config: clone(
          config ??
            (kind === "meeting" && s.run?.kind === "meeting"
              ? s.run.config
              : s.drafts[kind]),
        ),
        ...appearance,
        updatedAt: Date.now(),
      };
      const saved = commit({ ...s, programs: [program, ...s.programs] }, false);
      if (saved) notify(`Saved “${program.name}” on this device.`);
      return saved;
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
      if (!canCustomize()) return;
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
