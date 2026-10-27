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
    settings: { notifications: false, keepAwake: true, haptics: true },
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
    initial.settings = {
      notifications: saved.settings?.notifications === true,
      keepAwake: saved.settings?.keepAwake !== false,
      haptics: saved.settings?.haptics !== false,
    };
    if (saved.run) {
      const r = saved.run;
      if (
        !kinds.includes(r.kind) ||
        !["ready", "running", "paused", "waiting", "done"].includes(r.status) ||
        !Number.isFinite(r.elapsed) ||
        !Array.isArray(r.phases) ||
        r.phases.some((p) => !Number.isFinite(p.ms) || p.ms <= 0) ||
        !Number.isInteger(r.index) ||
        r.index < 0 ||
        r.index >= Math.max(1, r.phases.length) ||
        !(r.anchor === null || Number.isFinite(r.anchor))
      )
        throw Error("Invalid saved timer.");
      initial.run = { ...r, config: validateConfig(r.kind, r.config) };
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
