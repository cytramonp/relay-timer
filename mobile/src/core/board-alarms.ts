import { settle, type Card } from "./board-engine.js";
import type { Alarm } from "./clock.ts";
import type { BoardOptions } from "./board.ts";

export function boardAlarmPlan(
  board: Card[],
  mode: string,
  now: number,
  speech?: BoardOptions,
): Alarm[] {
  const plan: Alarm[] = [];
  for (const input of board) {
    const card = settle(input, mode, now);
    if (
      card.done ||
      card.waiting ||
      (card.anchor === null && !card.scheduledAt)
    )
      continue;
    const anchor = card.scheduledAt ?? card.anchor!;
    if (mode === "up") {
      if (speech)
        for (const [color, seconds] of [
          ["Green", speech.green],
          ["Amber", speech.amber],
          ["Red", speech.red],
        ] as const) {
          const at = anchor + seconds * 1000 - card.elapsed;
          if (at > now)
            plan.push({
              at,
              title: `${card.name}: ${color}`,
              body: "Speech timing signal",
            });
        }
      continue;
    }
    let at = anchor - card.elapsed;
    for (let i = card.index; i < card.stages.length; i++) {
      at += card.stages[i].seconds * 1000;
      if (at > now)
        plan.push({
          at,
          title: card.name,
          body: `${card.stages[i].name} finished`,
        });
      if (card.automatic === false) break;
    }
  }
  return plan.sort((a, b) => a.at - b.at);
}
