import { defaultConfig } from "./catalog.ts";
import { kinds, type Config, type Kind, type Program } from "./types.ts";

export function isKind(value: unknown): value is Kind {
  return kinds.includes(value as Kind);
}
const obj = (v: unknown): Record<string, unknown> => {
  if (!v || typeof v !== "object" || Array.isArray(v))
    throw Error("Expected a timer configuration.");
  return v as Record<string, unknown>;
};
const text = (v: unknown, max = 120) => {
  if (typeof v !== "string" || v.length > max)
    throw Error(`Text must be at most ${max} characters.`);
  return v.trim();
};
const num = (v: unknown, min: number, max: number) => {
  if (typeof v !== "number" || !Number.isFinite(v) || v < min || v > max)
    throw Error(`Enter a number between ${min} and ${max}.`);
  return v;
};
export function validateConfig(kind: Kind, value: unknown): Config {
  const raw = obj(value),
    c = defaultConfig(kind);
  for (const key of ["title", "zone"] as const)
    if (raw[key] !== undefined) c[key] = text(raw[key]);
  const ranges: Partial<Record<keyof Config, [number, number]>> = {
    duration: [1, 86400],
    rounds: [1, 99],
    work: [1, 86400],
    rest: [0, 86400],
    prepare: [0, 3600],
    cooldown: [0, 86400],
    sets: [1, 20],
    setRest: [0, 86400],
    longRest: [0, 10800],
    longEvery: [1, 99],
    warning: [0, 3600],
    finalCue: [0, 30],
    volume: [0, 100],
    increment: [0, 300],
    delay: [0, 300],
    first: [0, 1],
    minimum: [0, 1800],
    total: [0, 17280000],
  };
  for (const [key, range] of Object.entries(ranges))
    if (raw[key] !== undefined)
      (c as unknown as Record<string, unknown>)[key] = num(
        raw[key],
        range[0],
        range[1],
      );
  for (const key of ["rounds", "sets", "longEvery", "first"] as const)
    if (!Number.isInteger(c[key]))
      throw Error(
        "Rounds, sets, first player and break frequency must be whole numbers.",
      );
  for (const key of [
    "finalBreak",
    "automatic",
    "voice",
    "hideDigits",
    "customRounds",
    "autoSplit",
    "keepProp",
  ] as const)
    if (raw[key] !== undefined) {
      if (typeof raw[key] !== "boolean") throw Error("Invalid toggle value.");
      c[key] = raw[key];
    }
  if (raw.sound !== undefined) {
    if (!["gong", "bell", "beep", "off"].includes(raw.sound as string))
      throw Error("Unknown alarm sound.");
    c.sound = raw.sound as Config["sound"];
  }
  if (raw.agenda !== undefined) {
    if (
      !Array.isArray(raw.agenda) ||
      raw.agenda.length < 1 ||
      raw.agenda.length > 200
    )
      throw Error("Use 1–200 agenda items.");
    const ids = new Set<string>();
    c.agenda = raw.agenda.map((row, i) => {
      const a = obj(row),
        id =
          typeof a.id === "string" && /^[\w-]{1,100}$/.test(a.id)
            ? a.id
            : `slot-${i}`;
      if (ids.has(id)) throw Error("Agenda items need distinct IDs.");
      ids.add(id);
      return {
        id,
        name: text(a.name) || `Slot ${i + 1}`,
        seconds: num(a.seconds, 0, 86400),
        kind: a.kind === "topic" ? "topic" : "person",
        ...(a.pinned === true ? { pinned: true } : {}),
      };
    });
  }
  if (raw.overrides !== undefined) {
    if (!Array.isArray(raw.overrides) || raw.overrides.length > 99)
      throw Error("Use at most 99 custom rounds.");
    c.overrides = raw.overrides.map((row) => {
      const a = obj(row);
      return {
        name: text(a.name, 100),
        work: num(a.work, 1, 86400),
        rest: num(a.rest, 0, 86400),
      };
    });
  }
  if (c.zone !== "local")
    try {
      new Intl.DateTimeFormat("en", { timeZone: c.zone }).format();
    } catch {
      throw Error("Choose a valid time zone.");
    }
  if (!c.title) c.title = defaultConfig(kind).title;
  if (raw.total === undefined && raw.agenda !== undefined)
    c.total = c.agenda.reduce((n, a) => n + a.seconds, 0);
  return c;
}
export function readBackup(
  json: string,
  makeId: () => string,
  now = Date.now(),
): Program[] {
  if (json.length > 4_000_000)
    throw Error("Choose a JSON file smaller than 4 MB.");
  let raw;
  try {
    raw = JSON.parse(json);
  } catch {
    throw Error("This file is not valid JSON.");
  }
  const data = obj(raw);
  const convert = (value: unknown): Program => {
    const p = obj(value);
    if (!isKind(p.kind)) throw Error("Unknown timer type.");
    return {
      id: makeId(),
      kind: p.kind,
      name:
        typeof p.name === "string"
          ? text(p.name)
          : validateConfig(p.kind, p.config).title,
      config: validateConfig(p.kind, p.config),
      ...(typeof p.color === "string" &&
      ["citron", "peach", "lilac", "mint"].includes(p.color)
        ? { color: p.color as Program["color"] }
        : {}),
      ...(typeof p.icon === "string" &&
      ["people", "loop", "grid", "spark", "focus", "coffee"].includes(p.icon)
        ? { icon: p.icon as Program["icon"] }
        : {}),
      updatedAt: now,
    };
  };
  if (data.format === "corptimer-mobile" && data.version === 1) {
    if (!Array.isArray(data.programs) || data.programs.length > 200)
      throw Error("Use a backup with at most 200 programs.");
    return data.programs.map(convert);
  }
  if (data.version === 1 && isKind(data.kind) && data.config) {
    return [convert({ ...data, kind: data.kind })];
  }
  // Existing web meeting library: import plans only, keeping reports and private data out of templates.
  const records = Array.isArray(data.meetings) ? data.meetings : [data];
  if (records.length > 200)
    throw Error("Import at most 200 meetings at a time.");
  return records
    .filter((r) => !obj(r).deleted)
    .map((value) => {
      const row = obj(value),
        state = obj(row.state ?? row);
      if (!Array.isArray(state.agenda))
        throw Error("Choose a CorpTimer timer or meeting backup.");
      const c = defaultConfig("meeting");
      c.title =
        typeof row.title === "string" ? text(row.title) : "Imported meeting";
      c.agenda = state.agenda.map((v, i) => {
        const a = obj(v);
        return {
          id: `import-${i}`,
          name: text(a.name),
          seconds: num(a.min, 0.01, 1440) * 60,
          pinned: a.pin === true,
          kind: a.kind === "topic" ? ("topic" as const) : ("person" as const),
        };
      });
      c.automatic = state.endPolicy === "auto";
      c.minimum = typeof state.floor === "number" ? state.floor * 60 : 15;
      c.autoSplit = state.autoSplit !== false;
      c.keepProp = state.keepProp !== false;
      c.total =
        typeof state.total === "number"
          ? state.total * 60
          : c.agenda.reduce((n, a) => n + a.seconds, 0);
      c.warning = typeof state.warn === "number" ? state.warn * 60 : 60;
      c.sound = state.sound ? "beep" : "off";
      return {
        id: makeId(),
        kind: "meeting",
        name: c.title,
        config: validateConfig("meeting", c),
        updatedAt: now,
      };
    });
}
export function writeBackup(programs: Program[]) {
  return JSON.stringify(
    {
      format: "corptimer-mobile",
      version: 1,
      programs: programs.map(({ kind, name, config, color, icon }) => ({
        kind,
        name,
        config,
        color,
        icon,
      })),
    },
    null,
    2,
  );
}
export function csv(rows: (string | number)[][]) {
  return rows
    .map((row) =>
      row
        .map((cell) => {
          let s = String(cell);
          if (/^[=+@\-\t\r]/.test(s)) s = `'${s}`;
          return `"${s.replaceAll('"', '""')}"`;
        })
        .join(","),
    )
    .join("\r\n");
}
