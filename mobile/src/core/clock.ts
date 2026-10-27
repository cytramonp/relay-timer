import type { Config, Entry, Kind, Phase, Report, Run } from "./types";
import { clone } from "./clone.ts";

export function formatTime(ms: number, tenths = false): string {
  const negative = ms < 0,
    raw = Math.abs(ms) / 1000;
  const seconds = tenths ? Math.floor(raw) : Math.ceil(raw);
  const h = Math.floor(seconds / 3600),
    m = Math.floor(seconds / 60) % 60;
  return `${negative ? "+" : ""}${h ? `${h}:` : ""}${h ? String(m).padStart(2, "0") : m}:${String(seconds % 60).padStart(2, "0")}${tenths ? `.${Math.floor((raw % 1) * 10)}` : ""}`;
}
export function newYearTarget(now: number, zone: string): number {
  const timeZone =
    zone === "local" ? Intl.DateTimeFormat().resolvedOptions().timeZone : zone;
  const parts = (date: number) =>
    Object.fromEntries(
      new Intl.DateTimeFormat("en-US", {
        timeZone,
        year: "numeric",
        month: "numeric",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
        second: "numeric",
        hourCycle: "h23",
      })
        .formatToParts(date)
        .map((p) => [p.type, p.value]),
    );
  const desired = Date.UTC(Number(parts(now).year) + 1, 0, 1);
  let target = desired;
  for (let i = 0; i < 4; i++) {
    const p = parts(target);
    target +=
      desired -
      Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
  }
  return target;
}
export function sequence(kind: Kind, c: Config): Phase[] {
  const phases: Phase[] = [];
  const add = (name: string, s: number, type = "work", round = 0, set = 1) => {
    if (s > 0)
      phases.push({ name, ms: Math.round(s * 1000), type, round, set });
  };
  if (kind === "meeting")
    c.agenda.forEach((s, i) => add(s.name, s.seconds, "work", i + 1));
  else if (kind === "boxing" || kind === "fitness") {
    add("Get ready", c.prepare, "prepare");
    for (let s = 1; s <= (kind === "fitness" ? c.sets : 1); s++)
      for (let r = 1; r <= c.rounds; r++) {
        const custom = c.customRounds ? c.overrides[r - 1] : undefined;
        add(
          custom?.name || `${kind === "boxing" ? "Round" : "Work"} ${r}`,
          custom?.work ?? c.work,
          "work",
          r,
          s,
        );
        if (r < c.rounds) add("Rest", custom?.rest ?? c.rest, "rest", r, s);
        else if (s < (kind === "fitness" ? c.sets : 1))
          add("Set recovery", c.setRest, "rest", r, s);
      }
    add("Cool down", c.cooldown, "cooldown");
  } else if (kind === "pomodoro")
    for (let r = 1; r <= c.rounds; r++) {
      add(c.title || "Focus", c.work, "work", r);
      if (r < c.rounds || c.finalBreak)
        add(
          r % c.longEvery === 0 ? "Long break" : "Short break",
          r % c.longEvery === 0 ? c.longRest : c.rest,
          "rest",
          r,
        );
    }
  else if (!["stopwatch", "chess", "newyear"].includes(kind))
    add(c.title, c.duration);
  return phases;
}
export function createRun(
  kind: Kind,
  config: Config,
  id: string,
  now = Date.now(),
): Run {
  return {
    id,
    kind,
    config: clone(config),
    phases: sequence(kind, config),
    status: "ready",
    index: 0,
    elapsed: 0,
    anchor: null,
    startedAt: null,
    phaseStart: 0,
    entries: [],
    laps: [],
    sides: [config.duration * 1000, config.duration * 1000],
    moves: [0, 0],
    active: config.first,
    delayLeft: config.delay * 1000,
    target: kind === "newyear" ? newYearTarget(now, config.zone) : null,
    finishedAt: null,
    notes: "",
  };
}
export function elapsed(run: Run, now: number) {
  return (
    run.elapsed +
    (run.status === "running" && run.anchor !== null
      ? Math.max(0, now - run.anchor)
      : 0)
  );
}
export function phaseDeadline(run: Run) {
  if (run.kind === "meeting")
    return Math.max(
      run.phases.slice(0, run.index + 1).reduce((n, p) => n + p.ms, 0),
      run.phaseStart + run.config.minimum * 1000,
    );
  return run.phaseStart + (run.phases[run.index]?.ms ?? 0);
}
export function remaining(run: Run, now: number): number {
  if (run.kind === "newyear") return Math.max(0, (run.target ?? now) - now);
  if (run.kind === "stopwatch") return elapsed(run, now);
  if (run.kind === "chess") return advance(run, now).sides[run.active];
  return run.status === "done" ? 0 : phaseDeadline(run) - elapsed(run, now);
}
function logPhase(run: Run, end: number): Entry {
  return {
    name: run.phases[run.index]?.name ?? run.config.title,
    planned: sequence(run.kind, run.config)[run.index]?.ms ?? 0,
    actual: Math.max(0, end - run.phaseStart),
  };
}
export function advance(input: Run, now: number): Run {
  if (input.status !== "running") return input;
  let r: Run = {
    ...input,
    elapsed: elapsed(input, now),
    anchor: Math.max(now, input.anchor ?? now),
  };
  if (r.kind === "stopwatch") return r;
  if (r.kind === "newyear")
    return now >= (r.target ?? Infinity)
      ? { ...r, status: "done", anchor: null, finishedAt: now }
      : r;
  if (r.kind === "chess") {
    const delta = Math.max(0, now - (input.anchor ?? now));
    const charged = Math.max(0, delta - input.delayLeft);
    const sides: [number, number] = [...input.sides];
    sides[r.active] = Math.max(0, sides[r.active] - charged);
    return {
      ...r,
      sides,
      delayLeft: Math.max(0, input.delayLeft - delta),
      ...(sides[r.active] === 0
        ? { status: "done" as const, anchor: null, finishedAt: now }
        : {}),
    };
  }
  // Meeting handoffs use cumulative deadlines; individual interval clocks do not carry unused time.
  while (r.status === "running" && r.elapsed >= phaseDeadline(r)) {
    const end = phaseDeadline(r);
    if (!r.config.automatic && r.kind === "meeting") break;
    if (!r.config.automatic && r.index < r.phases.length - 1) {
      r = { ...r, status: "waiting", elapsed: end, anchor: null };
      break;
    }
    r = {
      ...r,
      entries: [...r.entries, logPhase(r, end)],
      phaseStart: end,
      index: r.index + 1,
    };
    if (r.index >= r.phases.length)
      r = {
        ...r,
        index: Math.max(0, r.phases.length - 1),
        elapsed: end,
        status: "done",
        anchor: null,
        finishedAt: now,
      };
  }
  return r;
}
export function toggleRun(input: Run, now: number): Run {
  const r = advance(input, now);
  if (r.status === "done" || r.status === "waiting") return r;
  return r.status === "running"
    ? { ...r, status: "paused", anchor: null }
    : { ...r, status: "running", anchor: now, startedAt: r.startedAt ?? now };
}
export function nextPhase(input: Run, now: number): Run {
  const r = advance(input, now);
  if (
    r.status === "done" ||
    r.kind === "chess" ||
    r.kind === "stopwatch" ||
    r.kind === "newyear"
  )
    return r;
  const end = elapsed(r, now),
    entries = [...r.entries, logPhase(r, end)];
  if (r.index === r.phases.length - 1)
    return {
      ...r,
      entries,
      status: "done",
      elapsed: end,
      anchor: null,
      finishedAt: now,
    };
  return {
    ...r,
    entries,
    index: r.index + 1,
    phaseStart: end,
    elapsed: end,
    status: r.status === "waiting" ? "running" : r.status,
    anchor: r.status === "running" || r.status === "waiting" ? now : null,
  };
}
export function switchSide(input: Run, side: number, now: number): Run {
  let r = advance(input, now);
  if (r.kind !== "chess" || r.status === "done") return r;
  if (r.status !== "running") return toggleRun(r, now);
  if (side !== r.active) return r;
  const sides: [number, number] = [...r.sides],
    moves: [number, number] = [...r.moves];
  sides[r.active] += r.config.increment * 1000;
  moves[r.active]++;
  return {
    ...r,
    sides,
    moves,
    active: 1 - r.active,
    delayLeft: r.config.delay * 1000,
  };
}
export function extendRun(input: Run, ms: number, now: number): Run {
  const r = advance(input, now);
  if (r.status === "done" || !r.phases[r.index]) return r;
  return {
    ...r,
    phases: r.phases.map((p, i) =>
      i === r.index ? { ...p, ms: Math.max(1000, p.ms + ms) } : p,
    ),
  };
}
export function finishRun(input: Run, now: number): Run {
  const r = advance(input, now);
  if (r.status === "done") return r;
  return {
    ...r,
    elapsed: elapsed(r, now),
    entries: r.phases.length
      ? [...r.entries, logPhase(r, elapsed(r, now))]
      : r.entries,
    status: "done",
    anchor: null,
    finishedAt: now,
  };
}
export function report(run: Run): Report {
  return {
    id: run.id,
    kind: run.kind,
    title: run.config.title,
    finishedAt: run.finishedAt ?? Date.now(),
    elapsed: run.elapsed,
    entries: run.entries,
    laps: run.laps,
    notes: run.notes,
  };
}
export type Alarm = { at: number; title: string; body: string };
export function alarmPlan(input: Run, now: number): Alarm[] {
  const r = advance(input, now);
  if (r.status !== "running" || r.kind === "stopwatch") return [];
  if (r.kind === "newyear")
    return r.target && r.target > now
      ? [{ at: r.target, title: "Happy New Year!", body: r.config.title }]
      : [];
  if (r.kind === "chess")
    return [
      {
        at: now + r.sides[r.active] + r.delayLeft,
        title: "Time is up",
        body: `${r.active === 0 ? "White" : "Black"} is out of time.`,
      },
    ];
  const out: Alarm[] = [];
  let deadline = phaseDeadline(r) - r.elapsed + now;
  for (let i = r.index; i < r.phases.length && out.length < 48; i++) {
    const p = r.phases[i];
    const warn = deadline - r.config.warning * 1000;
    if (p.type === "work" && r.config.warning > 0 && warn > now)
      out.push({
        at: warn,
        title: p.name,
        body: `${r.config.warning} seconds remaining`,
      });
    if (deadline > now)
      out.push({
        at: deadline,
        title:
          i === r.phases.length - 1 ? "Timer complete" : r.phases[i + 1].name,
        body: i === r.phases.length - 1 ? r.config.title : `${p.name} finished`,
      });
    if (!r.config.automatic) break;
    deadline += r.phases[i + 1]?.ms ?? 0;
  }
  return out.slice(0, 48);
}
