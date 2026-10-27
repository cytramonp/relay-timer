import { advance, report } from "./clock.ts";
import type { Run, Store } from "./types.ts";

// Foreground ticks and lifecycle recovery must archive completion the same way.
export function applyRun(store: Store, run: Run | null): Store {
  const history =
    run?.status === "done"
      ? [
          report(run),
          ...store.history.filter((item) => item.id !== run.id),
        ].slice(0, 100)
      : store.history;
  return { ...store, run, history };
}
export function recoverStore(store: Store, now: number): Store {
  return store.run ? applyRun(store, advance(store.run, now)) : store;
}
