import * as DocumentPicker from "expo-document-picker";
import { File } from "expo-file-system";
import { Platform } from "react-native";
import {
  MAX_MEDIA_BYTES,
  validMedia,
  type CustomMedia,
} from "../core/custom-media";

/** Embed small user assets so saved setups and backups remain portable. */
export async function pickCustomMedia(
  kind: "audio" | "image",
): Promise<CustomMedia | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type:
      kind === "image" ? ["image/png", "image/jpeg", "image/webp"] : "audio/*",
    multiple: false,
    copyToCacheDirectory: true,
  });
  if (result.canceled) return null;
  const asset = result.assets[0];
  if ((asset.size ?? 0) > MAX_MEDIA_BYTES)
    throw Error("Choose a file smaller than 2 MB.");
  const mime =
    asset.mimeType || (kind === "image" ? "image/png" : "audio/mpeg");
  let uri: string;
  if (Platform.OS === "web") {
    const blob = asset.file ?? (await (await fetch(asset.uri)).blob());
    if (blob.size > MAX_MEDIA_BYTES)
      throw Error("Choose a file smaller than 2 MB.");
    uri = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(Error("Could not read this file."));
      reader.readAsDataURL(blob);
    });
  } else {
    const file = new File(asset.uri);
    if (file.size > MAX_MEDIA_BYTES)
      throw Error("Choose a file smaller than 2 MB.");
    uri = `data:${mime};base64,${await file.base64()}`;
  }
  const media = { name: asset.name.slice(0, 120), uri };
  if (!validMedia(media, kind))
    throw Error(
      kind === "image"
        ? "Choose PNG, JPEG or WebP."
        : "Choose MP3, WAV, M4A, AAC or OGG audio under 2 MB.",
    );
  return media;
}
