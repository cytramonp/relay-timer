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
  kind?: "person" | "topic";
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
  total: number;
  autoSplit: boolean;
  keepProp: boolean;
  customRounds: boolean;
  overrides: { name: string; work: number; rest: number }[];
};
export type Phase = {
  id?: string;
  name: string;
  ms: number;
  type: string;
  round: number;
  set: number;
};
export type Entry = {
  id?: string;
  name: string;
  planned: number;
  actual: number;
  start?: number;
  end?: number;
  deadline?: number;
  state?: string;
};
export type ParkingItem = {
  id: string;
  text: string;
  owner: string;
  done: boolean;
};
export type PlanChange = { at: number; agenda: Slot[] };
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
  lapOffset?: number;
  lapBase?: number;
  sides: [number, number];
  moves: [number, number];
  active: number;
  delayLeft: number;
  target: number | null;
  finishedAt: number | null;
  notes: string;
  originalAgenda?: Slot[];
  planChanges?: PlanChange[];
  parking?: ParkingItem[];
};
export type Program = {
  id: string;
  kind: Kind;
  name: string;
  config: Config;
  updatedAt: number;
  color?: "citron" | "peach" | "lilac" | "mint";
  icon?: "people" | "loop" | "grid" | "spark" | "focus" | "coffee";
};
export type Report = {
  id: string;
  kind: Kind;
  title: string;
  finishedAt: number;
  elapsed: number;
  entries: Entry[];
  laps: number[];
  lapOffset?: number;
  lapBase?: number;
  notes: string;
  originalAgenda?: Slot[];
  planChanges?: PlanChange[];
  parking?: ParkingItem[];
};
export type Settings = {
  notifications: boolean;
  keepAwake: boolean;
  haptics: boolean;
  dialSound?: boolean;
  companyLogo?: string;
  appearance?: "light" | "dark" | "system";
  floatingShape?: "wide" | "strip" | "square";
};
export type Store = {
  version: 1;
  drafts: Record<Kind, Config>;
  run: Run | null;
  programs: Program[];
  history: Report[];
  settings: Settings;
  meetingParking?: ParkingItem[];
};
