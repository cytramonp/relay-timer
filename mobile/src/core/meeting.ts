import type { Config, Entry, Run, Slot } from "./types.ts";
import { clone } from "./clone.ts";

export const totalSeconds = (agenda: Slot[]) =>
  agenda.reduce((sum, a) => sum + a.seconds, 0);
export const meetingElapsed = (r: Run, now: number) =>
  r.elapsed +
  (r.status === "running" && r.anchor !== null
    ? Math.max(0, now - r.anchor)
    : 0);
export const slotId = (r: Run, i = r.index) =>
  r.phases[i]?.id ?? r.config.agenda[i]?.id;
export function completedIds(r: Run | null) {
  return new Set(
    (r?.entries ?? []).map(
      (entry, i) =>
        entry.id ?? r?.originalAgenda?.[i]?.id ?? r?.config.agenda[i]?.id,
    ),
  );
}
export function deadlineFor(
  agenda: Slot[],
  id: string,
  start: number,
  minimum: number,
) {
  let sum = 0;
  for (const a of agenda) {
    sum += a.seconds * 1000;
    if (a.id === id) break;
  }
  return Math.max(sum, start + minimum * 1000);
}
// Match the web's 15-second largest-remainder allocation, including zero-weight plans.
export function splitSeconds(target: number, weights: number[]): number[] {
  if (!weights.length) return [];
  const units = Math.round(Math.max(0, target) / 15),
    sum = weights.reduce((n, w) => n + Math.max(0, w), 0);
  const raw = weights.map(
      (w) => (sum ? Math.max(0, w) / sum : 1 / weights.length) * units,
    ),
    result = raw.map(Math.floor);
  let left = units - result.reduce((n, v) => n + v, 0);
  raw
    .map((v, i) => ({ i, remainder: v - result[i] }))
    .sort((a, b) => b.remainder - a.remainder)
    .forEach(({ i }) => {
      if (left-- > 0) result[i]++;
    });
  return result.map((v) => v * 15);
}
export function allocate(
  c: Config,
  run: Run | null,
  target = c.total,
  equal = false,
): Config {
  const done =
    run && run.status !== "done"
      ? completedIds(run)
      : new Set<string | undefined>();
  const agenda = c.agenda.map((a) => ({ ...a }));
  const free = agenda.filter(
    (a) =>
      !done.has(a.id) &&
      (equal || !c.autoSplit || (a.kind !== "topic" && !a.pinned)),
  );
  const fixed = agenda
    .filter((a) => !free.includes(a))
    .reduce((n, a) => n + a.seconds, 0);
  const values = splitSeconds(
    target - fixed,
    free.map((a) => (equal || c.autoSplit ? 1 : a.seconds)),
  );
  free.forEach((a, i) => {
    a.seconds = values[i];
    if (equal) delete a.pinned;
  });
  return { ...c, total: target, agenda };
}
export function editDuration(
  c: Config,
  run: Run | null,
  id: string,
  seconds: number,
): Config {
  if (!Number.isFinite(seconds) || seconds < 0 || seconds > 86400)
    throw Error("Use a duration from 0 to 1,440 minutes.");
  const done =
    run && run.status !== "done"
      ? completedIds(run)
      : new Set<string | undefined>();
  if (done.has(id)) return c;
  const agenda = c.agenda.map((a) => ({ ...a })),
    item = agenda.find((a) => a.id === id);
  if (!item) return c;
  if (c.keepProp) {
    const others = agenda.filter((a) => a.id !== id && !done.has(a.id));
    if (others.length) {
      const pool = item.seconds + totalSeconds(others);
      item.seconds = Math.max(
        15,
        Math.min(Math.round(seconds / 15) * 15, pool - 15 * others.length),
      );
      const values = splitSeconds(
        pool - item.seconds,
        others.map((a) => a.seconds),
      );
      others.forEach((a, i) => {
        a.seconds = values[i];
      });
      ensureMinimum(others);
    } else item.seconds = seconds;
  } else item.seconds = seconds;
  if (c.autoSplit && item.kind !== "topic") item.pinned = true;
  let result = { ...c, agenda };
  if (!c.keepProp && c.autoSplit) result = allocate(result, run);
  if (!c.autoSplit) result.total = totalSeconds(result.agenda);
  return result;
}
function ensureMinimum(items: Slot[]) {
  for (const a of items)
    if (a.seconds < 15) {
      const big = items.reduce(
        (m, x) => (x.seconds > m.seconds ? x : m),
        items[0],
      );
      if (big !== a && big.seconds >= 15 + (15 - a.seconds)) {
        big.seconds -= 15 - a.seconds;
        a.seconds = 15;
      }
    }
}
// A boundary is an absolute position on the planned track, not just the left slot's width.
export function moveBoundary(
  c: Config,
  run: Run | null,
  index: number,
  position: number,
): Config {
  if (index < 0 || index >= c.agenda.length - 1) return c;
  const done =
    run && run.status !== "done"
      ? completedIds(run)
      : new Set<string | undefined>();
  const left = c.agenda[index],
    right = c.agenda[index + 1];
  if (done.has(left.id) || done.has(right.id)) return c;
  const agenda = c.agenda.map((a) => ({ ...a }));
  const beforeBoundary = totalSeconds(agenda.slice(0, index + 1));
  if (!c.keepProp) {
    const pool = left.seconds + right.seconds;
    if (pool < 30) return c;
    const seconds = Math.max(
      15,
      Math.min(
        pool - 15,
        Math.round((left.seconds + position - beforeBoundary) / 15) * 15,
      ),
    );
    agenda[index].seconds = seconds;
    agenda[index + 1].seconds = pool - seconds;
    if (c.autoSplit) {
      agenda[index].pinned = true;
      agenda[index + 1].pinned = true;
    }
  } else {
    const grow = position >= beforeBoundary ? agenda[index] : agenda[index + 1];
    const others = agenda.filter((a) => a !== grow && !done.has(a.id));
    const pool = totalSeconds(others) + grow.seconds,
      rest = totalSeconds(others);
    const locked = totalSeconds(
      agenda.slice(0, index + 1).filter((a) => done.has(a.id)),
    );
    const before = totalSeconds(
      agenda.slice(0, index + 1).filter((a) => a !== grow && !done.has(a.id)),
    );
    if (!rest || pool < (others.length + 1) * 15) return c;
    const ratio = before / rest;
    const desired =
      grow.id === left.id
        ? (position - locked - pool * ratio) / Math.max(0.0001, 1 - ratio)
        : pool - (position - locked) / Math.max(0.0001, ratio);
    grow.seconds = Math.max(
      15,
      Math.min(pool - 15 * others.length, Math.round(desired / 15) * 15),
    );
    const values = splitSeconds(
      pool - grow.seconds,
      others.map((a) => a.seconds),
    );
    others.forEach((a, i) => {
      a.seconds = values[i];
    });
    ensureMinimum(others);
    if (c.autoSplit && grow.kind !== "topic") grow.pinned = true;
  }
  return { ...c, agenda };
}
export function editMeetingRun(r: Run, config: Config, now: number): Run {
  const id = slotId(r),
    at = meetingElapsed(r, now);
  if (!config.agenda.some((a) => a.id === id) && r.status !== "done")
    throw Error("Finish the current turn before removing it.");
  const originalAgenda = r.originalAgenda ?? clone(r.config.agenda);
  const changed =
    JSON.stringify(config.agenda) !== JSON.stringify(r.config.agenda);
  return {
    ...r,
    config: clone(config),
    originalAgenda,
    phases: config.agenda.map((a, i) => ({
      id: a.id,
      name: a.name,
      ms: a.seconds * 1000,
      type: "work",
      round: i + 1,
      set: 1,
    })),
    index: Math.max(
      0,
      config.agenda.findIndex((a) => a.id === id),
    ),
    planChanges: changed
      ? [...(r.planChanges ?? []), { at, agenda: clone(config.agenda) }].slice(
          -1000,
        )
      : r.planChanges,
  };
}
function closeTurn(r: Run, end: number): Entry {
  const id = slotId(r),
    a = r.config.agenda.find((a) => a.id === id);
  return {
    id,
    name: a?.name ?? "Speaker",
    planned:
      (r.originalAgenda?.find((a) => a.id === id)?.seconds ?? a?.seconds ?? 0) *
      1000,
    actual: Math.max(0, end - r.phaseStart),
    start: r.phaseStart,
    end,
    deadline: deadlineFor(r.config.agenda, id!, r.phaseStart, r.config.minimum),
  };
}
export function handoffMeeting(
  r: Run,
  now: number,
  end = meetingElapsed(r, now),
): Run {
  if (r.status === "done") return r;
  const entries = [...r.entries, closeTurn(r, end)],
    seen = new Set(entries.map((e) => e.id));
  const next = r.config.agenda.find((a) => !seen.has(a.id));
  return {
    ...r,
    entries,
    elapsed: end,
    phaseStart: end,
    index: next ? r.config.agenda.findIndex((a) => a.id === next.id) : r.index,
    status: next ? "running" : "done",
    anchor: next ? now : null,
    finishedAt: next ? null : now,
  };
}
export function advanceMeeting(r: Run, now: number): Run {
  if (r.status !== "running") return r;
  const at = meetingElapsed(r, now);
  if (!r.config.automatic) return { ...r, elapsed: at, anchor: now };
  let next = r,
    guard = r.phases.length + 1;
  while (next.status === "running" && guard-- > 0) {
    const due = deadlineFor(
      next.config.agenda,
      slotId(next)!,
      next.phaseStart,
      next.config.minimum,
    );
    if (at < due) break;
    next = handoffMeeting(next, now, due);
  }
  return {
    ...next,
    elapsed: next.status === "done" ? next.elapsed : at,
    anchor: next.status === "done" ? null : now,
  };
}
export function undoMeeting(r: Run, now: number): Run {
  const last = r.entries.at(-1);
  if (!last) return r;
  const index = r.config.agenda.findIndex((a) => a.id === last.id);
  if (index < 0) return r;
  return {
    ...r,
    entries: r.entries.slice(0, -1),
    index,
    phaseStart: last.start ?? Math.max(0, r.phaseStart - last.actual),
    elapsed: meetingElapsed(r, now),
    anchor: r.status === "paused" ? null : now,
    status: r.status === "paused" ? "paused" : "running",
    finishedAt: null,
  };
}
export function nudgeMeeting(r: Run, delta: number, now: number): Run {
  if (r.status === "done") return r;
  return {
    ...r,
    elapsed: Math.max(r.phaseStart, meetingElapsed(r, now) + delta),
    anchor: r.status === "running" ? now : null,
  };
}
export function meetingView(config: Config, run: Run | null, now: number) {
  const current =
    run?.status === "done"
      ? undefined
      : config.agenda.find(
          (a) => a.id === (run ? slotId(run) : config.agenda[0]?.id),
        );
  const done = completedIds(run),
    at = run ? meetingElapsed(run, now) : 0;
  const pending = config.agenda.filter(
    (a) => a.id !== current?.id && !done.has(a.id),
  );
  const available = current
    ? run
      ? deadlineFor(config.agenda, current.id, run.phaseStart, config.minimum) -
        run.phaseStart
      : current.seconds * 1000
    : 0;
  const remaining = current
    ? run
      ? deadlineFor(config.agenda, current.id, run.phaseStart, config.minimum) -
        at
      : current.seconds * 1000
    : 0;
  const next = pending[0],
    nextBudget = next
      ? run
        ? deadlineFor(config.agenda, next.id, at, config.minimum) - at
        : next.seconds * 1000
      : 0;
  return {
    current,
    next,
    nextBudget,
    available,
    remaining,
    elapsed: at,
    pending,
    done,
    progress:
      current && run
        ? Math.max(
            0,
            Math.min(1, (at - run.phaseStart) / Math.max(1, available)),
          )
        : 0,
    total: totalSeconds(config.agenda) * 1000,
    rows: config.agenda.map((a) => {
      const entry = run?.entries.find((e) => e.id === a.id);
      return {
        ...a,
        state:
          run && a.id === current?.id
            ? "current"
            : done.has(a.id)
              ? "done"
              : "next",
        available: entry
          ? entry.actual
          : a.id === current?.id && run
            ? at - run.phaseStart
            : a.id === next?.id
              ? nextBudget
              : a.seconds * 1000,
        entry,
      };
    }),
  };
}
export function meetingProjection(
  config: Config,
  run: Run | null,
  now: number,
) {
  const view = meetingView(config, run, now);
  return {
    title: config.title,
    name: view.current?.name ?? "Meeting complete",
    next: view.next?.name ?? "",
    status:
      run?.status === "done"
        ? "done"
        : run?.status === "paused"
          ? "paused"
          : run
            ? "running"
            : "ready",
    baseRemaining: view.remaining,
    baseElapsed: view.elapsed,
    publishedAt: now,
    plannedTotal: view.total,
    policy: config.automatic ? "auto" : "manual",
    agenda: view.rows.map((a) => ({
      name: a.name,
      min: a.seconds / 60,
      status: a.state,
    })),
  };
}
