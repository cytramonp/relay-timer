export type Stage = {
  name: string;
  seconds: number;
  cueEnd?: string;
  cueStart?: string;
  warning?: number;
  repeatCue?: number;
  note?: string;
};
export type Card = {
  name: string;
  stages: Stage[];
  index: number;
  elapsed: number;
  anchor: number | null;
  laps: number[];
  lapOffset?: number;
  lapBase?: number;
  done: boolean;
  waiting?: boolean;
  automatic?: boolean;
  scheduledAt?: number | null;
  score?: number;
  hasStarted?: boolean;
};
export type Profile = { count: number; mode: string; stages: Stage[] };
export function createBoard(profile: Profile): Card[];
export function elapsed(card: Card, now: number): number;
export function settle(card: Card, mode: string, now: number): Card;
export function act(
  board: Card[],
  index: number,
  action: string,
  mode: string,
  now: number,
): Card[];
export function display(card: Card, mode: string, now: number): string;
export function seekCard(card: Card, seconds: number, mode: string): Card;
