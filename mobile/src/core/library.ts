import { isPortableDataKey, utf8Bytes, MAX_BACKUP_BYTES } from "./data-keys.ts";
export type Preferences = { favorites: string[]; home: string | null };
export const CUSTOM_INSTANCE_PATTERN =
  /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
export function customInstance(slug: string): string | null {
  const value = slug.startsWith("custom-timer-")
    ? slug.slice("custom-timer-".length)
    : "";
  return CUSTOM_INSTANCE_PATTERN.test(value) ? value : null;
}
export function readPreferences(raw: string | null): Preferences {
  let value: unknown;
  try {
    value = raw ? JSON.parse(raw) : null;
  } catch {
    return { favorites: [], home: null };
  }
  const p =
    value && typeof value === "object"
      ? (value as Record<string, unknown>)
      : {};
  const valid = (id: unknown): id is string =>
    typeof id === "string" && /^[a-z0-9-]{1,80}$/.test(id);
  return {
    favorites: Array.isArray(p.favorites)
      ? [...new Set(p.favorites.filter(valid))].slice(0, 100)
      : [],
    home: valid(p.home) ? p.home : null,
  };
}
export type SavedBoardSummary = {
  key: string;
  slug: string;
  instance: string | null;
  title: string;
  count: number;
};
export function savedBoardSummary(
  key: string,
  raw: string | null,
  knownSlugs: readonly string[],
): SavedBoardSummary | null {
  const match = /^corptimer\.board\.([a-z0-9-]+)\.setup$/.exec(key);
  if (!match || !raw) return null;
  const slug = match[1],
    instance = customInstance(slug);
  if (!knownSlugs.includes(slug) && slug !== "custom-timer" && !instance)
    return null;
  try {
    const value = JSON.parse(raw),
      board = Array.isArray(value) ? value : value.board;
    if (
      !Array.isArray(board) ||
      !board.length ||
      typeof board[0]?.name !== "string"
    )
      return null;
    return {
      key,
      slug,
      instance,
      title: board[0].name.slice(0, 120) || "Saved timer",
      count: board.length,
    };
  } catch {
    return null;
  }
}

export function assertLibraryCapacity(
  records: readonly (readonly [string, string | null])[],
  changes: readonly (readonly [string, string])[],
  primaryStore = "{}",
) {
  const projected = new Map(
    records.filter(
      ([key, value]) => value !== null && isPortableDataKey(key),
    ) as [string, string][],
  );
  for (const [key, value] of changes) projected.set(key, value);
  if (projected.size > 100)
    throw Error(
      "Your saved timer library is full. Export a device backup, then remove unused saved setups before saving another.",
    );
  const bytes =
    utf8Bytes(
      JSON.stringify({
        data: Object.fromEntries(projected),
        store: JSON.parse(primaryStore),
      }),
    ) + 1024;
  if (bytes > MAX_BACKUP_BYTES)
    throw Error(
      "These sounds and images would make your device backup larger than 32 MB. Remove unused media first, or export your individual setups before using Reset device in Settings.",
    );
}
