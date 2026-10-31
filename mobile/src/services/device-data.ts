import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  isUserDataKey,
  isPortableDataKey,
  LIVE_HOST_KEY,
} from "../core/data-keys";
import { readDeviceBackup, writeDeviceBackup } from "../core/device-backup";
import type { Store } from "../core/types";
import { rawStore, saveStore } from "./storage";
import { runNow } from "./timer-clock";
import { userData } from "./user-data";

async function records() {
  await userData.flush();
  const keys = (await AsyncStorage.getAllKeys()).filter(isUserDataKey);
  return { keys, values: await AsyncStorage.multiGet(keys) };
}
export async function exportDeviceData(store: Store) {
  const { values } = await records();
  return writeDeviceBackup(store, values, runNow(store.run), Date.now());
}
export async function exportRecoveryData() {
  const { values } = await records();
  return JSON.stringify({
    format: "corptimer-recovery",
    version: 1,
    rawStore: rawStore(),
    data: Object.fromEntries(values.filter(([k]) => isPortableDataKey(k))),
  });
}
export async function clearUserData() {
  return userData.replace(async () => {
    const keys = (await AsyncStorage.getAllKeys()).filter(isUserDataKey);
    await AsyncStorage.multiRemove(keys);
    // Host removal is only allowed after successful live revocation by the UI.
    await AsyncStorage.removeItem(LIVE_HOST_KEY);
    localStorage.removeItem("corptimer-start-reservation-v1");
  });
}
export async function restoreDeviceData(json: string) {
  // Validate everything before changing any storage.
  const replacement = readDeviceBackup(json);
  return userData.replace(async () => {
    const before = await records();
    const originalStore = rawStore();
    try {
      await AsyncStorage.multiRemove(before.keys);
      await AsyncStorage.multiSet(replacement.data);
      saveStore(replacement.store);
    } catch (error) {
      // Best-effort rollback; callers must report failure and never claim success.
      try {
        const partial = (await AsyncStorage.getAllKeys()).filter(isUserDataKey);
        await AsyncStorage.multiRemove(partial);
        await AsyncStorage.multiSet(
          before.values.filter((x): x is [string, string] => x[1] !== null),
        );
        localStorage.setItem("corptimer-mobile-v1", originalStore);
      } catch {
        throw Error(
          "Restore failed and rollback could not finish. Keep your backup and retry before editing data.",
        );
      }
      throw error;
    }
    return replacement.store;
  });
}
