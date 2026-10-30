import type { Config, Kind } from "./types";

export const catalog: {
  kind: Kind;
  title: string;
  description: string;
  icon: string;
  image?: number;
}[] = [
  {
    kind: "meeting",
    title: "Meeting",
    description: "Every speaker. One shared finish.",
    icon: "people-outline",
  },
  {
    kind: "boxing",
    title: "Boxing",
    description: "Your rounds, your corner.",
    icon: "fitness-outline",
    image: 0,
  },
  {
    kind: "fitness",
    title: "Fitness",
    description: "HIIT, Tabata, EMOM & AMRAP.",
    icon: "barbell-outline",
    image: 1,
  },
  {
    kind: "pomodoro",
    title: "Pomodoro",
    description: "A little focus. A proper break.",
    icon: "leaf-outline",
    image: 2,
  },
  {
    kind: "classroom",
    title: "Classroom",
    description: "A clear rhythm for the whole room.",
    icon: "school-outline",
    image: 3,
  },
  {
    kind: "chess",
    title: "Chess",
    description: "Two sides. Make your move.",
    icon: "grid-outline",
    image: 4,
  },
  {
    kind: "stopwatch",
    title: "Stopwatch",
    description: "Start counting. Catch every lap.",
    icon: "stopwatch-outline",
    image: 5,
  },
  {
    kind: "simple",
    title: "Countdown",
    description: "From the next egg to the next idea.",
    icon: "timer-outline",
    image: 6,
  },
  {
    kind: "newyear",
    title: "New Year",
    description: "Midnight, wherever you celebrate.",
    icon: "sparkles-outline",
    image: 7,
  },
];
export function defaultConfig(kind: Kind): Config {
  const base: Config = {
    title: catalog.find((t) => t.kind === kind)!.title,
    duration: 300,
    rounds: 3,
    work: 180,
    rest: 60,
    prepare: 10,
    cooldown: 0,
    sets: 1,
    setRest: 60,
    longRest: 900,
    longEvery: 4,
    finalBreak: true,
    automatic: true,
    warning: 0,
    finalCue: 0,
    sound: "bell",
    volume: 65,
    voice: false,
    hideDigits: false,
    increment: 3,
    delay: 0,
    first: 0,
    zone: "local",
    agenda: [
      { id: "welcome", name: "Welcome", seconds: 300, kind: "topic" },
      ...["Alex", "Morgan", "Jordan", "Sam", "Taylor"].map((name, i) => ({
        id: `person-${i}`,
        name,
        seconds: 660,
        kind: "person" as const,
      })),
    ],
    minimum: 15,
    total: 3600,
    autoSplit: true,
    keepProp: true,
    customRounds: false,
    overrides: [],
  };
  if (kind === "meeting")
    return {
      ...base,
      title: "Meeting",
      automatic: false,
      warning: 60,
      minimum: 60,
      sound: "off",
    };
  if (kind === "boxing")
    return { ...base, warning: 60, finalCue: 10, sound: "gong" };
  if (kind === "fitness")
    return {
      ...base,
      rounds: 8,
      work: 20,
      rest: 10,
      finalCue: 3,
      sound: "beep",
    };
  if (kind === "pomodoro")
    return {
      ...base,
      title: "Time to focus",
      rounds: 4,
      work: 1500,
      rest: 300,
      prepare: 0,
      warning: 60,
    };
  if (kind === "classroom")
    return {
      ...base,
      title: "Independent work",
      duration: 600,
      sound: "off",
      warning: 60,
    };
  return base;
}
export const presets: Partial<
  Record<Kind, { name: string; values: Partial<Config> }[]>
> = {
  meeting: [
    {
      name: "Standup",
      values: {
        title: "Daily standup",
        agenda: [
          { id: "a", name: "Yesterday", seconds: 300 },
          { id: "b", name: "Today", seconds: 300 },
          { id: "c", name: "Blockers", seconds: 300 },
        ],
      },
    },
    {
      name: "Workshop",
      values: {
        title: "Workshop",
        agenda: [
          { id: "a", name: "Welcome", seconds: 300 },
          { id: "b", name: "Explore", seconds: 1200 },
          { id: "c", name: "Discuss", seconds: 600 },
          { id: "d", name: "Next steps", seconds: 300 },
        ],
      },
    },
  ],
  boxing: [
    { name: "3 × 3 min", values: { rounds: 3, work: 180, rest: 60 } },
    { name: "3 × 2 min", values: { rounds: 3, work: 120, rest: 60 } },
    { name: "12 rounds", values: { rounds: 12, work: 180, rest: 60 } },
  ],
  fitness: [
    { name: "Tabata", values: { rounds: 8, work: 20, rest: 10, sets: 1 } },
    { name: "HIIT", values: { rounds: 10, work: 40, rest: 20, sets: 1 } },
    { name: "EMOM", values: { rounds: 10, work: 60, rest: 0, sets: 1 } },
    { name: "AMRAP", values: { rounds: 1, work: 1200, rest: 0, sets: 1 } },
  ],
  chess: [
    { name: "1 + 0", values: { duration: 60, increment: 0, delay: 0 } },
    { name: "3 + 2", values: { duration: 180, increment: 2, delay: 0 } },
    { name: "10 + 0", values: { duration: 600, increment: 0, delay: 0 } },
    { name: "15 + 10", values: { duration: 900, increment: 10, delay: 0 } },
  ],
};
