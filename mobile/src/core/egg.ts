import type { Card } from "./board-engine.js";

export const eggStages = [
  ["Heating · not ready", "Translucent white · liquid yolk"],
  ["Runny yolk", "Set white · flowing centre"],
  ["Soft yolk", "Set white · thick, soft centre"],
  ["Sticky yolk", "Firm white · jam-like centre"],
  ["Soft-set yolk", "Mostly set · a small soft centre"],
  ["Hard-boiled", "Firm white · fully set yolk"],
] as const;

export function eggMilestones(
  card: Pick<Card, "index" | "done" | "stages">,
  names: readonly string[],
) {
  if (
    names.length !== eggStages.length - 1 ||
    card.stages.length !== names.length ||
    card.stages.some((stage, i) => stage.name !== names[i])
  )
    return null;
  let elapsed = 0;
  return {
    selected: card.done
      ? eggStages.length - 1
      : Math.min(4, Math.max(0, card.index)),
    seconds: [0, ...card.stages.map((stage) => (elapsed += stage.seconds))],
  };
}
