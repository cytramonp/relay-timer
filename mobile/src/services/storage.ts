import "expo-sqlite/localStorage/install";
import { defaultConfig } from "../core/catalog";
import { validateConfig } from "../core/backup";
import { kinds, type Store } from "../core/types";

const KEY = "corptimer-mobile-v1";
export function emptyStore(): Store {
  return {
    version: 1,
    drafts: Object.fromEntries(
      kinds.map((k) => [k, defaultConfig(k)]),
    ) as Store["drafts"],
    run: null,
    programs: [],
    history: [],
    settings: {
      notifications: false,
      keepAwake: true,
      haptics: true,
      appearance: "light",
    },
  };
}
export function loadStore(): { store: Store; error: string } {
  const initial = emptyStore();
  try {
    const json = localStorage.getItem(KEY);
    if (!json) return { store: initial, error: "" };
    const saved = JSON.parse(json) as Store;
    if (
      saved.version !== 1 ||
      !Array.isArray(saved.programs) ||
      !Array.isArray(saved.history) ||
      saved.programs.length > 200 ||
      saved.history.length > 100
    )
      throw Error("Unsupported saved data.");
    for (const k of kinds)
      initial.drafts[k] = validateConfig(k, saved.drafts[k]);
    // Upgrade only the untouched beta starter. Preserve every custom plan and active session.
    const old = initial.drafts.meeting;
    if (old.title === "Daily relay") old.title = "Meeting";
    if (
      !saved.run &&
      old.title === "Team meeting" &&
      old.agenda.length === 3 &&
      old.agenda.every(
        (a, i) =>
          a.name === ["Welcome", "Updates", "Next steps"][i] &&
          a.seconds === [120, 480, 300][i],
      )
    )
      initial.drafts.meeting = defaultConfig("meeting");
    initial.programs = saved.programs.map((p) => {
      if (
        !kinds.includes(p.kind) ||
        typeof p.id !== "string" ||
        typeof p.name !== "string"
      )
        throw Error("Invalid saved program.");
      return { ...p, config: validateConfig(p.kind, p.config) };
    });
    initial.history = saved.history;
    initial.meetingParking = saved.meetingParking ?? [];
    initial.settings = {
      notifications: saved.settings?.notifications === true,
      keepAwake: saved.settings?.keepAwake !== false,
      haptics: saved.settings?.haptics !== false,
      appearance:
        saved.settings?.appearance === "dark" ||
        saved.settings?.appearance === "system"
          ? saved.settings.appearance
          : "light",
      floatingShape:
        saved.settings?.floatingShape === "strip" ||
        saved.settings?.floatingShape === "square"
          ? saved.settings.floatingShape
          : "wide",
    };
    if (saved.run) {
      const r = saved.run;
      if (
        !kinds.includes(r.kind) ||
        !["ready", "running", "paused", "waiting", "done"].includes(r.status) ||
        !Number.isFinite(r.elapsed) ||
        !Array.isArray(r.phases) ||
        r.phases.some(
          (p) =>
            !Number.isFinite(p.ms) ||
            (r.kind === "meeting" ? p.ms < 0 : p.ms <= 0),
        ) ||
        !Number.isInteger(r.index) ||
        r.index < 0 ||
        r.index >= Math.max(1, r.phases.length) ||
        !(r.anchor === null || Number.isFinite(r.anchor))
      )
        throw Error("Invalid saved timer.");
      initial.run = { ...r, config: validateConfig(r.kind, r.config) };
      if (r.kind === "meeting" && initial.run.config.title === "Daily relay")
        initial.run.config.title = "Meeting";
      if (r.kind === "meeting") {
        initial.run.phases = initial.run.phases.map((p, i) => ({
          ...p,
          id: p.id ?? r.config.agenda[i]?.id,
        }));
        initial.run.entries = initial.run.entries.map((e, i) => ({
          ...e,
          id: e.id ?? r.config.agenda[i]?.id,
        }));
        initial.run.originalAgenda ??= r.config.agenda;
      }
    }
    return { store: initial, error: "" };
  } catch {
    return {
      store: initial,
      error:
        "Saved data could not be read. Your original data is preserved. Export it from Settings before replacing it.",
    };
  }
}
export function saveStore(store: Store) {
  localStorage.setItem(KEY, JSON.stringify(store));
}
export function rawStore() {
  return localStorage.getItem(KEY) ?? "{}";
}
