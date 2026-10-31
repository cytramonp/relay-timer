export const LIVE_HOST_KEY = "corptimer-live-host-v1";
export const FEEDBACK_DRAFT_KEY = "corptimer-feedback-draft-v1";
export const FAVORITES_KEY = "corptimer.library.v1";
// Explicit ownership boundary: never clear Firebase auth or other SDK keys.
export function isUserDataKey(key: string) {
  return (
    key === FEEDBACK_DRAFT_KEY ||
    key === FAVORITES_KEY ||
    /^corptimer\.board\.[a-z0-9-]+(?:\.(?:setup|reservation))?$/.test(key)
  );
}
export function isPortableDataKey(key: string) {
  return isUserDataKey(key) && !key.endsWith(".reservation");
}
export const MAX_BACKUP_BYTES = 32_000_000;
export function utf8Bytes(text: string) {
  let bytes = 0;
  for (const char of text) {
    const cp = char.codePointAt(0)!;
    bytes += cp < 128 ? 1 : cp < 2048 ? 2 : cp < 65536 ? 3 : 4;
  }
  return bytes;
}
export function checkBackupSize(text: string, maxBytes = MAX_BACKUP_BYTES) {
  if (text.length > maxBytes || utf8Bytes(text) > maxBytes)
    throw Error(
      `Choose a backup smaller than ${maxBytes / 1_000_000} MB. Export a smaller selection if needed.`,
    );
}
