import { createBoard, type Stage } from "./board-engine.js";
const stage = (name: string, seconds: number, cueEnd = "bell"): Stage => ({
  name,
  seconds,
  cueEnd,
});
export const customRecipes = [
  {
    id: "boxing",
    title: "Boxing · 3 rounds",
    stages: [
      stage("Warm up", 60),
      ...Array.from({ length: 3 }, (_, i) => [
        stage(`Round ${i + 1}`, 180, "gong"),
        ...(i < 2 ? [stage("Rest", 60, "beep")] : []),
      ]).flat(),
    ],
    accent: "#F69A90",
  },
  {
    id: "egg",
    title: "Egg · 7-minute demo",
    stages: [stage("Cook", 420), stage("Cool in cold water", 120)],
    accent: "#F6BD70",
  },
  {
    id: "focus",
    title: "Focus · 25 + 5",
    stages: [stage("Focus", 1500), stage("Break", 300)],
    accent: "#66D6BE",
  },
  {
    id: "tea",
    title: "Tea · steep & enjoy",
    stages: [stage("Steep", 180), stage("Cool", 60)],
    accent: "#91C8F6",
  },
  {
    id: "stretch",
    title: "Stretch · four sides",
    stages: ["Left shoulder", "Right shoulder", "Left calf", "Right calf"].map(
      (n) => stage(n, 30),
    ),
    accent: "#AFA6ED",
  },
  {
    id: "presentation",
    title: "Presentation · 10 minutes",
    stages: [
      stage("Introduction", 60),
      stage("Main idea", 420),
      stage("Questions", 120),
    ],
    accent: "#66D6BE",
  },
  {
    id: "hiit",
    title: "HIIT · 8 intervals",
    stages: Array.from({ length: 8 }, (_, i) => [
      stage(`Work ${i + 1}`, 20, "beep"),
      stage("Recover", 10, "beep"),
    ]).flat(),
    accent: "#F69A90",
  },
  {
    id: "breathing",
    title: "Breathing · four cycles",
    stages: Array.from({ length: 4 }, () => [
      stage("Inhale", 4, "off"),
      stage("Hold", 4, "off"),
      stage("Exhale", 4, "off"),
      stage("Rest", 4, "off"),
    ]).flat(),
    accent: "#91C8F6",
  },
  {
    id: "workshop",
    title: "Workshop · brainstorm",
    stages: [
      stage("Brief", 120),
      stage("Ideas", 480),
      stage("Vote", 180),
      stage("Decide", 120),
    ],
    accent: "#F6BD70",
  },
  {
    id: "cleanup",
    title: "Cleanup · three rooms",
    stages: [
      stage("Desk", 300),
      stage("Kitchen", 300),
      stage("Living room", 300),
    ],
    accent: "#AFA6ED",
  },
];
export function recipeSetup(id: string) {
  const recipe = customRecipes.find((r) => r.id === id);
  if (!recipe) throw Error("Unknown recipe.");
  const board = createBoard({
    mode: "sequence",
    count: 1,
    stages: recipe.stages,
  });
  board[0].name = recipe.title;
  return {
    version: 1,
    mode: "sequence",
    board,
    options: { sound: true, accent: recipe.accent },
  };
}
