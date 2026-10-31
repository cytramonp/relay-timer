import { kinds, type Report, type ParkingItem, type Slot } from "./types.ts";

function text(value: unknown, max = 120): string {
  if (typeof value !== "string" || value.length > max)
    throw Error("Invalid saved text.");
  return value;
}
function number(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0)
    throw Error("Invalid saved number.");
  return value;
}
function list(value: unknown, max: number): unknown[] {
  if (!Array.isArray(value) || value.length > max)
    throw Error("Invalid saved list.");
  return value;
}
function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw Error("Invalid saved record.");
  return value as Record<string, unknown>;
}
export function decodeParking(value: unknown): ParkingItem[] {
  return list(value ?? [], 2000).map((v) => {
    const x = record(v);
    return {
      id: text(x.id, 100),
      text: text(x.text, 5000),
      owner: text(x.owner, 120),
      done: x.done === true,
    };
  });
}
function agenda(value: unknown): Slot[] {
  return list(value, 200).map((v) => {
    const x = record(v);
    return {
      id: text(x.id, 100),
      name: text(x.name),
      seconds: number(x.seconds),
      pinned: x.pinned === true,
      kind: x.kind === "topic" ? "topic" : "person",
    };
  });
}
export function decodeReport(value: unknown): Report {
  const x = record(value);
  if (!kinds.includes(x.kind as Report["kind"]))
    throw Error("Unknown report kind.");
  const laps = list(x.laps, 500).map(number);
  if (laps.some((n, i) => i > 0 && n < laps[i - 1]))
    throw Error("Invalid lap order.");
  const lapOffset = number(x.lapOffset ?? 0),
    lapBase = number(x.lapBase ?? 0);
  if (
    !Number.isSafeInteger(lapOffset) ||
    (laps.length > 0 && lapBase > laps[0])
  )
    throw Error("Invalid lap history.");
  return {
    id: text(x.id, 100),
    kind: x.kind as Report["kind"],
    title: text(x.title),
    finishedAt: number(x.finishedAt),
    elapsed: number(x.elapsed),
    notes: text(x.notes, 1_000_000),
    laps,
    lapOffset,
    lapBase,
    entries: list(x.entries, 10000).map((v) => {
      const e = record(v);
      return {
        name: text(e.name),
        planned: number(e.planned),
        actual: number(e.actual),
        ...(e.id === undefined ? {} : { id: text(e.id, 100) }),
        ...(e.start === undefined ? {} : { start: number(e.start) }),
        ...(e.end === undefined ? {} : { end: number(e.end) }),
        ...(e.deadline === undefined ? {} : { deadline: number(e.deadline) }),
        ...(e.state === undefined ? {} : { state: text(e.state, 30) }),
      };
    }),
    ...(x.originalAgenda === undefined
      ? {}
      : { originalAgenda: agenda(x.originalAgenda) }),
    ...(x.parking === undefined ? {} : { parking: decodeParking(x.parking) }),
    ...(x.planChanges === undefined
      ? {}
      : {
          planChanges: list(x.planChanges, 5000).map((v) => {
            const p = record(v);
            return { at: number(p.at), agenda: agenda(p.agenda) };
          }),
        }),
  };
}
