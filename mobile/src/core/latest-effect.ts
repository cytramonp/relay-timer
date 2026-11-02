// Coalesce pending snapshots, and let an in-flight adapter test obsolescence
// after every await. A stale partial effect must clean up its own output.
export function latestEffect<T>(
  apply: (value: T, current: () => boolean) => Promise<void>,
) {
  let generation = 0;
  let queue = Promise.resolve();
  return (value: T) => {
    const own = ++generation;
    const current = () => own === generation;
    const result = queue
      .catch(() => {})
      .then(async () => {
        if (current()) await apply(value, current);
      });
    queue = result;
    return result;
  };
}
