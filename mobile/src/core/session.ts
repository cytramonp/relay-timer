import type { Card } from "./board-engine.js";

// Resetting the last used clock ends this execution. Other paused/running
// clocks keep their board session, including a zero-elapsed paused clock.
export function boardSessionContinues(board: Card[], resetIndex: number) {
  return board.some(
    (c, i) =>
      i !== resetIndex &&
      !c.done &&
      (c.anchor !== null ||
        !!c.scheduledAt ||
        !!c.waiting ||
        c.elapsed > 0 ||
        c.laps.length > 0 ||
        c.hasStarted === true),
  );
}
export function appendLap(
  run: { laps: number[]; lapOffset?: number; lapBase?: number },
  value: number,
) {
  const laps = [...run.laps, value];
  const removed = laps.length > 500 ? laps.splice(0, laps.length - 500) : [];
  return {
    laps,
    lapOffset: (run.lapOffset ?? 0) + removed.length,
    lapBase: removed.at(-1) ?? run.lapBase ?? 0,
  };
}
