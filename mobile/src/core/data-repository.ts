type Storage = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<unknown>;
  removeItem: (key: string) => Promise<unknown>;
};
// Old mounted screens cannot re-create deleted data after reset/restore. Writes
// already in flight finish before replacement; later writes from old scopes stop.
export function scopedRepository(storage: Storage) {
  let generation = 0;
  let replacing = false;
  let writes = Promise.resolve();
  return {
    flush: () => writes.catch(() => {}),
    scope() {
      const own = replacing ? -1 : generation;
      const enqueue = (fn: () => Promise<unknown>) => {
        const result = writes
          .catch(() => {})
          .then(async () => {
            if (own === generation) await fn();
          });
        writes = result;
        return result;
      };
      return {
        current: () => own === generation,
        getItem: (key: string) => storage.getItem(key),
        setItem: (key: string, value: string) =>
          enqueue(() => storage.setItem(key, value)),
        removeItem: (key: string) => enqueue(() => storage.removeItem(key)),
      };
    },
    async replace<T>(work: () => Promise<T>): Promise<T> {
      if (replacing) throw Error("Another data replacement is still running.");
      replacing = true;
      generation++;
      try {
        await writes.catch(() => {});
        return await work();
      } finally {
        replacing = false;
      }
    },
  };
}
