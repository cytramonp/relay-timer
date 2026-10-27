export const kinds = [
  "meeting",
  "boxing",
  "fitness",
  "pomodoro",
  "classroom",
  "chess",
  "stopwatch",
  "simple",
  "newyear",
] as const;
export type Kind = (typeof kinds)[number];
export type Slot = {
  id: string;
  name: string;
  seconds: number;
  pinned?: boolean;
};
export type Config = {
  title: string;
  duration: number;
  rounds: number;
  work: number;
  rest: number;
  prepare: number;
  cooldown: number;
  sets: number;
  setRest: number;
  longRest: number;
  longEvery: number;
  finalBreak: boolean;
  automatic: boolean;
  warning: number;
  finalCue: number;
  sound: "gong" | "bell" | "beep" | "off";
  volume: number;
  voice: boolean;
  hideDigits: boolean;
  increment: number;
  delay: number;
  first: number;
  zone: string;
  agenda: Slot[];
  minimum: number;
  customRounds: boolean;
  overrides: { name: string; work: number; rest: number }[];
};
export type Phase = {
  name: string;
  ms: number;
  type: string;
  round: number;
  set: number;
};
export type Entry = { name: string; planned: number; actual: number };
export type Run = {
  id: string;
  kind: Kind;
  config: Config;
  phases: Phase[];
  status: "ready" | "running" | "paused" | "waiting" | "done";
  index: number;
  elapsed: number;
  anchor: number | null;
  startedAt: number | null;
  phaseStart: number;
  entries: Entry[];
  laps: number[];
  sides: [number, number];
  moves: [number, number];
  active: number;
  delayLeft: number;
  target: number | null;
  finishedAt: number | null;
  notes: string;
};
export type Program = {
  id: string;
  kind: Kind;
  name: string;
  config: Config;
  updatedAt: number;
};
export type Report = {
  id: string;
  kind: Kind;
  title: string;
  finishedAt: number;
  elapsed: number;
  entries: Entry[];
  laps: number[];
  notes: string;
};
export type Settings = {
  notifications: boolean;
  keepAwake: boolean;
  haptics: boolean;
};
export type Store = {
  version: 1;
  drafts: Record<Kind, Config>;
  run: Run | null;
  programs: Program[];
  history: Report[];
  settings: Settings;
};
