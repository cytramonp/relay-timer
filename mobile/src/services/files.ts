import { checkBackupSize, MAX_BACKUP_BYTES } from "../core/data-keys";
import * as DocumentPicker from "expo-document-picker";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";

export async function importFile(): Promise<string | null> {
  const pick = await DocumentPicker.getDocumentAsync({
    type: ["application/json", "text/plain"],
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (pick.canceled) return null;
  const asset = pick.assets[0];
  if ((asset.size ?? 0) > MAX_BACKUP_BYTES)
    throw Error("Choose a file smaller than 32 MB.");
  const text =
    Platform.OS === "web"
      ? asset.file
        ? await asset.file.text()
        : await (await fetch(asset.uri)).text()
      : await new File(asset.uri).text();
  checkBackupSize(text);
  return text;
}
export async function exportFile(
  name: string,
  text: string,
  mime = "application/json",
) {
  if (Platform.OS === "web") {
    const url = URL.createObjectURL(new Blob([text], { type: mime }));
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return;
  }
  const file = new File(Paths.cache, name);
  file.write(text);
  if (!(await Sharing.isAvailableAsync()))
    throw Error("File sharing is unavailable on this device.");
  await Sharing.shareAsync(file.uri, {
    mimeType: mime,
    dialogTitle: "Export CorpTimer",
    UTI:
      mime === "text/csv"
        ? "public.comma-separated-values-text"
        : "public.json",
  });
}
