export type ClockSample = { wall: number; monotonic: number; boot: string };
export type ClockCheckpoint = ClockSample & { logical: number };
// A logical epoch lets existing pure engines retain their timestamp contract.
// Never reuse an uptime anchor from another boot. A reboot falls back to the
// wall-clock gap; a backwards correction cannot rewind recorded duration.
export function timebase(
  sample: ClockSample,
  previous?: ClockCheckpoint | null,
) {
  const sameBoot =
    previous &&
    previous.boot === sample.boot &&
    sample.monotonic >= previous.monotonic;
  const logical = sameBoot
    ? previous.logical + sample.monotonic - previous.monotonic
    : previous
      ? previous.logical + Math.max(0, sample.wall - previous.wall)
      : sample.wall;
  const origin = logical - sample.monotonic;
  return {
    now: (next: ClockSample) => origin + next.monotonic,
    checkpoint: (next: ClockSample): ClockCheckpoint => ({
      ...next,
      logical: origin + next.monotonic,
    }),
  };
}
