type Action = "next" | "pause" | "undo" | "extend";
type Dependencies = {
  now: () => number;
  current: () => boolean;
  execute: (action: Action) => boolean | Promise<boolean>;
  acknowledge: (id: string) => void | Promise<void>;
  rejected: () => void;
  clear: (id: string) => Promise<unknown>;
};
// Serialize commands across async access checks. A received command is not an
// accepted command: acknowledge only after its action has actually succeeded.
export function commandQueue(deps: Dependencies) {
  const seen = new Set<string>();
  let queue = Promise.resolve();
  return (id: string, action: string, at: number) => {
    if (seen.has(id)) return queue;
    seen.add(id);
    queue = queue
      .catch(() => {})
      .then(async () => {
        try {
          if (
            !deps.current() ||
            Math.abs(deps.now() - at) > 30000 ||
            !["next", "pause", "undo", "extend"].includes(action)
          )
            return;
          const accepted = await deps.execute(action as Action);
          if (!deps.current()) return;
          if (accepted) await deps.acknowledge(id);
          else deps.rejected();
        } catch {
          if (deps.current()) deps.rejected();
        } finally {
          await deps.clear(id).catch(() => {});
        }
      });
    return queue;
  };
}
