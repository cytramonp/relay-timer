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
  report as coreReport,
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
import {
  syncNotifications,
  cancelTimerAlerts,
} from "../services/notifications";
import { playCue } from "../services/audio";
import { runNow, timerNow } from "../services/timer-clock";
import { clearUserData, restoreDeviceData } from "../services/device-data";
import { bufferedWriter } from "../core/buffered-writer";
import { appendLap } from "../core/session";
import { clone } from "../core/clone";
import { applyRun, recoverStore } from "../core/recovery";
import { editMeetingRun, nudgeMeeting, undoMeeting } from "../core/meeting";
import { validateConfig } from "../core/backup";
import { requireCustomization, reserveSession } from "../services/billing";

function report(run: Run) {
  return { ...coreReport(run), finishedAt: Date.now() };
}

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
  dataVersion: number;
  unreadableData: boolean;
  resetDevice: () => Promise<void>;
  restoreDevice: (json: string) => Promise<void>;
};
const Context = createContext<ContextValue | null>(null);
export function AppProvider({ children }: { children: React.ReactNode }) {
  const [loaded] = useState(loadStore),
    [store, setStore] = useState(loaded.store),
    [notice, notify] = useState(loaded.error),
    [canUndo, setCanUndo] = useState(false),
    [dataVersion, setDataVersion] = useState(0),
    [unreadableData, setUnreadableData] = useState(!!loaded.error);
  const current = useRef(store),
    starting = useRef(false),
    pendingStart = useRef<{ kind: Kind; id: string } | null>(null),
    undo = useRef<Run[]>([]),
    protectedData = useRef(!!loaded.error);
  const [writer] = useState(() =>
    bufferedWriter(({ next, schedule }: { next: Store; schedule: boolean }) => {
      let saved = false;
      try {
        saveStore(next);
        saved = true;
      } catch {
        notify(
          "Could not save on this device. Export your programs from My programs.",
        );
      }
      if (schedule)
        void syncNotifications(next.run, next.settings.notifications).catch(
          () =>
            notify(
              "Timer is running, but alerts could not be scheduled. Keep the app open.",
            ),
        );
      return saved;
    }),
  );
  function commit(next: Store, schedule = true, immediate = true) {
    if (
      next.run?.status === "done" &&
      !current.current.history.some((h) => h.id === next.run!.id)
    )
      next = {
        ...next,
        history: next.history.map((h) =>
          h.id === next.run!.id ? { ...h, finishedAt: Date.now() } : h,
        ),
      };
    current.current = next;
    setStore(next);
    setCanUndo(undo.current.length > 0);
    if (protectedData.current) {
      notify(
        "Local saving is paused to preserve unreadable data. Export recovery data in Settings before replacing it.",
      );
      return false;
    }
    if (!immediate) {
      writer.schedule({ next, schedule });
      return true;
    }
    return writer.write({ next, schedule });
  }
  function setRun(run: Run | null, remember = false) {
    const s = current.current;
    if (remember && s.run) {
      undo.current.push(advance(s.run, runNow(s.run)));
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
    const timer =
      store.run?.status === "running"
        ? setInterval(() => {
            const s = current.current;
            if (
              !s.run ||
              s.run.status !== "running" ||
              AppState.currentState === "background" ||
              AppState.currentState === "inactive"
            )
              return;
            const now = runNow(s.run),
              before = s.run,
              r = advance(before, now);
            const changed =
              r.status !== before.status || r.index !== before.index;
            const count = Math.ceil(remaining(r, now) / 1000),
              isWork = r.phases[r.index]?.type === "work";
            if (
              AppState.currentState === "active" ||
              AppState.currentState === null
            ) {
              if (changed)
                void playCue(
                  r.config,
                  r.status === "done"
                    ? "Timer complete"
                    : r.phases[r.index]?.name,
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
              // Presentation clocks subscribe locally; do not broadcast every tick.
            }
          }, 200)
        : undefined;
    const subscription = AppState.addEventListener("change", (state) => {
      const s = current.current;
      writer.flush();
      if (s.run) {
        commit(recoverStore(s, runNow(s.run)));
      }
      if (state === "active") lastSecond = -1;
    });
    return () => {
      if (timer) clearInterval(timer);
      subscription.remove();
    };
    // All callbacks read current.current; subscribing once avoids restarting the clock on every tick.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.run?.status]);
  const value: ContextValue = {
    store,
    dataVersion,
    unreadableData,
    snapshot: () => current.current,
    refreshRun: () =>
      commit(recoverStore(current.current, runNow(current.current.run))),
    seekMeeting(ms) {
      const r = current.current.run,
        now = timerNow();
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
          ? editMeetingRun(advance(s.run, runNow(s.run)), c, timerNow())
          : s.run;
      commit({ ...s, drafts: { ...s.drafts, meeting: c }, run }, true, false);
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
      if (!pendingStart.current) {
        try {
          const saved = JSON.parse(
            localStorage.getItem("corptimer-start-reservation-v1") || "null",
          );
          if (
            saved?.kind === kind &&
            typeof saved.id === "string" &&
            /^[a-zA-Z0-9_-]{8,100}$/.test(saved.id)
          )
            pendingStart.current = saved;
        } catch {
          /* A malformed pending ID is not timer data. */
        }
      }
      if (pendingStart.current?.kind !== kind)
        pendingStart.current = { kind, id: Crypto.randomUUID() };
      try {
        localStorage.setItem(
          "corptimer-start-reservation-v1",
          JSON.stringify(pendingStart.current),
        );
      } catch {
        notify(
          "Could not reserve this start safely. Free up device storage and try again.",
        );
        starting.current = false;
        return false;
      }
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
        history = [report(finishRun(s.run, runNow(s.run))), ...history].slice(
          0,
          100,
        );
      const now = runNow(kind);
      const r = toggleRun(createRun(kind, s.drafts[kind], id, now), now);
      if (kind === "meeting") r.parking = clone(s.meetingParking ?? []);
      commit({ ...s, run: r, history });
      pendingStart.current = null;
      try {
        localStorage.removeItem("corptimer-start-reservation-v1");
      } catch {
        /* The committed run already keeps the reserved ID. */
      }
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
      const now = runNow(s.run),
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
        setRun({ ...r, ...appendLap(r, elapsed(r, now)) }, false);
    },
    chess(side) {
      const s = current.current;
      if (s.run) setRun(switchSide(s.run, side, runNow(s.run)));
    },
    notes(text) {
      const s = current.current;
      if (s.run)
        commit(
          { ...s, run: { ...s.run, notes: text.slice(0, 10000) } },
          false,
          false,
        );
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
    async restoreDevice(json) {
      if (starting.current)
        throw Error("Wait for the current start to finish, then restore.");
      starting.current = true;
      writer.discard();
      try {
        const restored = await restoreDeviceData(json);
        await cancelTimerAlerts();
        protectedData.current = false;
        setUnreadableData(false);
        pendingStart.current = null;
        localStorage.removeItem("corptimer-start-reservation-v1");
        undo.current = [];
        commit(restored);
        notify(
          "Device data restored. Specialty clocks are paused; the active primary run was saved to History.",
        );
      } finally {
        starting.current = false;
        setDataVersion((v) => v + 1);
      }
    },
    async resetDevice() {
      if (starting.current)
        throw Error("Wait for the current start to finish, then reset.");
      starting.current = true;
      writer.discard();
      try {
        await clearUserData();
        protectedData.current = false;
        setUnreadableData(false);
        pendingStart.current = null;
        undo.current = [];
        if (!commit(emptyStore()))
          throw Error(
            "Could not reset the main timer storage. Retry before continuing.",
          );
        notify(
          "Local timer data deleted. Account access and server usage were kept.",
        );
      } finally {
        starting.current = false;
        setDataVersion((v) => v + 1);
      }
    },
  };
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useApp() {
  const context = useContext(Context);
  if (!context) throw Error("AppProvider is missing.");
  return context;
}
