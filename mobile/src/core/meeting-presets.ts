import { defaultConfig } from "./catalog.ts";
import type { Config, Program } from "./types.ts";
type Preset = {
  name: string;
  color: NonNullable<Program["color"]>;
  icon: NonNullable<Program["icon"]>;
  config: Config;
};
function preset(
  name: string,
  slots: [string, number][],
  color: Preset["color"],
  icon: Preset["icon"],
  automatic = false,
): Preset {
  const agenda = slots.map(([name, min], i) => ({
    id: `preset-${i}`,
    name,
    seconds: min * 60,
    kind: "topic" as const,
  }));
  return {
    name,
    color,
    icon,
    config: {
      ...defaultConfig("meeting"),
      title: name,
      agenda,
      total: agenda.reduce((n, a) => n + a.seconds, 0),
      minimum: 0,
      autoSplit: false,
      automatic,
    },
  };
}
export const meetingPresets: Preset[] = [
  {
    name: "Welcome & participants",
    color: "mint",
    icon: "people",
    config: defaultConfig("meeting"),
  },
  preset(
    "Daily standup",
    [
      ["Progress toward the goal", 4],
      ["Work in progress & blockers", 8],
      ["Plan & follow-ups", 3],
    ],
    "citron",
    "people",
  ),
  preset(
    "Sprint retrospective",
    [
      ["Check in", 5],
      ["Reflect", 10],
      ["Group & vote", 10],
      ["Discuss", 25],
      ["Actions & close", 10],
    ],
    "peach",
    "loop",
  ),
  preset(
    "Sprint planning",
    [
      ["Sprint goal", 10],
      ["Select work", 25],
      ["Plan delivery", 20],
      ["Commit & close", 5],
    ],
    "lilac",
    "grid",
  ),
  preset(
    "Workshop",
    [
      ["Welcome & outcome", 10],
      ["Explore", 20],
      ["Break", 5],
      ["Create", 30],
      ["Share", 20],
      ["Wrap up", 5],
    ],
    "mint",
    "spark",
  ),
  preset(
    "Focus session",
    [
      ["Focus", 25],
      ["Break", 5],
    ],
    "citron",
    "focus",
  ),
  preset(
    "Pomodoro",
    [
      ["Focus 1", 25],
      ["Short break", 5],
      ["Focus 2", 25],
      ["Short break", 5],
      ["Focus 3", 25],
      ["Short break", 5],
      ["Focus 4", 25],
      ["Long break", 15],
    ],
    "peach",
    "coffee",
    true,
  ),
  preset("Countdown", [["Countdown", 10]], "lilac", "focus", true),
];
