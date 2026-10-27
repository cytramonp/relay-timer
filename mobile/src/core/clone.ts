// Configurations and run snapshots are JSON data. Hermes does not provide structuredClone.
export function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
