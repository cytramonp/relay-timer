import "expo-sqlite/localStorage/install";
import NativeClock from "../../modules/corptimer-clock";
import {
  timebase,
  type ClockCheckpoint,
  type ClockSample,
} from "../core/timebase";
const KEY = "corptimer-clock-checkpoint-v1";
const processId = `js-${Date.now()}-${Math.random()}`;
function sample(): ClockSample {
  return NativeClock
    ? NativeClock.sample()
    : { wall: Date.now(), monotonic: performance.now(), boot: processId };
}
let previous: ClockCheckpoint | null = null;
try {
  const raw = JSON.parse(localStorage.getItem(KEY) ?? "null");
  if (
    raw &&
    typeof raw.boot === "string" &&
    [raw.wall, raw.monotonic, raw.logical].every(Number.isFinite)
  )
    previous = raw;
} catch {
  /* Unavailable clock metadata must not hide timer data. */
}
const clock = timebase(sample(), previous);
export const monotonicNow = () => sample().monotonic;
export const timerNow = () => clock.now(sample());
export const runNow = (run: { kind: string } | string | null) =>
  (typeof run === "string" ? run : run?.kind) === "newyear"
    ? Date.now()
    : timerNow();
export const wallTime = (logical: number) => Date.now() + logical - timerNow();
export function saveClockCheckpoint() {
  localStorage.setItem(KEY, JSON.stringify(clock.checkpoint(sample())));
}
