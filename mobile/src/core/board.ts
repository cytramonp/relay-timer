import { createBoard, settle, type Card, type Stage } from "./board-engine.js";

export type BoardProfile = {
  slug: string;
  title: string;
  description: string;
  category: string;
  mode: string;
  count: number;
  stages: Stage[];
  use: string;
  tip: string;
  cards?: Card[];
  automatic?: boolean;
  sound?: boolean;
  hideDigits?: boolean;
  kidsView?: boolean;
  green?: number;
  amber?: number;
  red?: number;
};
export type BoardOptions = {
  sound: boolean;
  hideDigits: boolean;
  kidsView: boolean;
  green: number;
  amber: number;
  red: number;
};
export function validateSignals(green: number, amber: number, red: number) {
  if (
    ![green, amber, red].every(Number.isFinite) ||
    green < 1 ||
    !(green < amber && amber < red) ||
    red > 86400
  )
    throw Error(
      "Use positive times with Green < Amber < Red, up to 86400 seconds.",
    );
  return { green, amber, red };
}
export function boardOptions(
  value: unknown,
  profile: BoardProfile,
): BoardOptions {
  const v =
    value && typeof value === "object" ? (value as Partial<BoardOptions>) : {};
  let signals = {
    green: profile.green ?? 120,
    amber: profile.amber ?? 150,
    red: profile.red ?? 180,
  };
  try {
    signals = validateSignals(v.green!, v.amber!, v.red!);
  } catch {
    /* Keep the published defaults for corrupt or older option records. */
  }
  return {
    sound: typeof v.sound === "boolean" ? v.sound : profile.sound !== false,
    hideDigits:
      typeof v.hideDigits === "boolean" ? v.hideDigits : !!profile.hideDigits,
    kidsView:
      typeof v.kidsView === "boolean" ? v.kidsView : profile.kidsView !== false,
    ...signals,
  };
}
export function speechSignal(
  seconds: number,
  options: Pick<BoardOptions, "green" | "amber" | "red">,
) {
  return seconds >= options.red
    ? "Red"
    : seconds >= options.amber
      ? "Amber"
      : seconds >= options.green
        ? "Green"
        : "Ready";
}
export const customProfile: BoardProfile = {
  slug: "custom-timer",
  title: "Custom timer",
  description: "Build a sequence for your own routine.",
  category: "Everyday",
  mode: "sequence",
  count: 1,
  stages: [
    { name: "Focus", seconds: 300 },
    { name: "Break", seconds: 60 },
  ],
  use: "Pause to edit a clock, add stages and arrange them in order. Save the setup or export it as JSON.",
  tip: "The example timings are a starting point. Choose durations that fit your routine.",
};
export function freshBoard(p: BoardProfile): Card[] {
  return (
    p.cards ? (JSON.parse(JSON.stringify(p.cards)) as Card[]) : createBoard(p)
  ).map((c) => ({ ...c, automatic: p.automatic }));
}
export function restoreBoard(
  input: unknown,
  mode: string,
  now: number,
): Card[] {
  if (!Array.isArray(input) || !input.length || input.length > 12)
    throw Error("Invalid board.");
  return input.map((c) => {
    if (
      !c ||
      typeof c.name !== "string" ||
      c.name.length > 80 ||
      !Array.isArray(c.stages) ||
      !c.stages.length ||
      c.stages.length > 100 ||
      !c.stages.every(
        (s: Stage) =>
          typeof s.name === "string" &&
          s.name.length <= 80 &&
          Number.isFinite(s.seconds) &&
          s.seconds >= (mode === "up" ? 0 : 1) &&
          s.seconds <= 86400,
      ) ||
      !Number.isInteger(c.index) ||
      c.index < 0 ||
      c.index >= c.stages.length ||
      !Number.isFinite(c.elapsed) ||
      c.elapsed < 0 ||
      (c.anchor !== null && (!Number.isFinite(c.anchor) || c.anchor < 0)) ||
      !Array.isArray(c.laps) ||
      c.laps.some((n: number) => !Number.isFinite(n) || n < 0) ||
      c.laps.length > 500 ||
      (c.lapOffset !== undefined &&
        (!Number.isSafeInteger(c.lapOffset) || c.lapOffset < 0)) ||
      (c.lapBase !== undefined &&
        (!Number.isFinite(c.lapBase) || c.lapBase < 0)) ||
      (c.scheduledAt != null &&
        (!Number.isFinite(c.scheduledAt) || c.scheduledAt < 0))
    )
      throw Error("Invalid saved clock.");
    return settle(
      {
        ...c,
        name: c.name.slice(0, 80),
        stages: c.stages.map((s: Stage) => ({ ...s })),
        laps: c.laps.slice(),
      },
      mode,
      now,
    );
  });
}
export function boardCsv(board: Card[], now: number) {
  const quote = (v: unknown) => {
    const text = String(v);
    return `"${(/^[=+@\-\t\r]/.test(text) ? "'" + text : text).replace(/"/g, '""')}"`;
  };
  return [
    "Clock,Stage,Planned seconds,Elapsed seconds,Status,Lap,Split seconds,Score",
    ...board.flatMap((c) =>
      c.stages.map((s, j) =>
        [
          c.name,
          s.name,
          s.seconds,
          j < c.index
            ? s.seconds
            : j === c.index
              ? (
                  (c.elapsed +
                    (c.anchor === null ? 0 : Math.max(0, now - c.anchor))) /
                  1000
                ).toFixed(2)
              : 0,
          c.done ? "Finished" : c.anchor === null ? "Paused" : "Running",
          "",
          "",
          Number.isFinite(c.score) ? c.score : "",
        ]
          .map(quote)
          .join(","),
      ),
    ),
    ...board.flatMap((c) =>
      c.laps.map((ms, i) =>
        [
          c.name,
          "Lap record",
          "",
          (ms / 1000).toFixed(2),
          "Recorded",
          (c.lapOffset ?? 0) + i + 1,
          ((ms - (c.laps[i - 1] ?? c.lapBase ?? 0)) / 1000).toFixed(2),
          "",
        ]
          .map(quote)
          .join(","),
      ),
    ),
  ].join("\r\n");
}
export function servingBoard(
  board: Card[],
  target: number,
  now: number,
): Card[] {
  const starts = board.map(
    (c) => target - c.stages.reduce((n, s) => n + s.seconds, 0) * 1000,
  );
  if (!Number.isFinite(target) || starts.some((at) => at < now))
    throw Error(
      "Choose a later serving time so every dish can finish together.",
    );
  return board.map((c, i) => ({
    ...c,
    index: 0,
    elapsed: 0,
    anchor: null,
    done: false,
    waiting: false,
    scheduledAt: starts[i],
  }));
}
