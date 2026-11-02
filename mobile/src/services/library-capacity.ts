import AsyncStorage from "@react-native-async-storage/async-storage";
import { assertLibraryCapacity } from "../core/library";
import { isPortableDataKey } from "../core/data-keys";
import { rawStore } from "./storage";
import { userData } from "./user-data";
export async function checkLibraryCapacity(
  changes: readonly (readonly [string, string])[],
) {
  await userData.flush();
  const keys = (await AsyncStorage.getAllKeys()).filter(isPortableDataKey);
  assertLibraryCapacity(await AsyncStorage.multiGet(keys), changes, rawStore());
}
