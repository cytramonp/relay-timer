export const MAX_MEDIA_BYTES = 2_000_000;
export type CustomMedia = { name: string; uri: string };
export function validMedia(
  value: unknown,
  kind: "audio" | "image",
): value is CustomMedia {
  if (!value || typeof value !== "object") return false;
  const v = value as CustomMedia;
  const mime =
    kind === "audio"
      ? "(?:mpeg|mp3|wav|x-wav|mp4|aac|ogg)"
      : "(?:png|jpeg|webp)";
  return (
    typeof v.name === "string" &&
    v.name.length <= 120 &&
    typeof v.uri === "string" &&
    v.uri.length <= 2_800_000 &&
    new RegExp(`^data:${kind}/${mime};base64,[A-Za-z0-9+/]+=*$`).test(v.uri)
  );
}
export function validAccent(value: unknown): value is string {
  return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value);
}
