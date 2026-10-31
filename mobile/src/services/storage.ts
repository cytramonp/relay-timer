import "expo-sqlite/localStorage/install";
import { saveClockCheckpoint } from "./timer-clock";
import { decodeStore, emptyStore } from "../core/store-codec";
import type { Store } from "../core/types";
export { emptyStore };
export const STORE_KEY = "corptimer-mobile-v1";
export function loadStore() {
  try {
    return decodeStore(localStorage.getItem(STORE_KEY));
  } catch {
    return {
      store: emptyStore(),
      error: "Could not read local storage. Export your data before resetting.",
    };
  }
}
export function saveStore(store: Store) {
  saveClockCheckpoint();
  localStorage.setItem(STORE_KEY, JSON.stringify(store));
}
export function rawStore() {
  return localStorage.getItem(STORE_KEY) ?? "{}";
}
