import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApps, initializeApp } from "firebase/app";
import * as Auth from "firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  initializeFirestore,
  onSnapshot,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import config from "../config/firebase-public.json";
import type { meetingProjection } from "../core/meeting";
type Projection = ReturnType<typeof meetingProjection>;
let client: ReturnType<typeof init> | undefined;
function init() {
  const app =
    getApps().find((a) => a.name === "corptimer-mobile") ??
    initializeApp(config, "corptimer-mobile");
  const sdk = Auth as typeof Auth & {
    getReactNativePersistence: (
      storage: typeof AsyncStorage,
    ) => Auth.Persistence;
  };
  const auth =
    Platform.OS === "web"
      ? Auth.getAuth(app)
      : Auth.initializeAuth(app, {
          persistence: sdk.getReactNativePersistence(AsyncStorage),
        });
  const db = initializeFirestore(app, {
    experimentalForceLongPolling: Platform.OS !== "web",
  });
  return { auth, db };
}
function api() {
  return (client ??= init());
}
export async function createRoom(
  id: string,
  controlToken: string,
  projection: Projection,
) {
  const { auth, db } = api();
  await auth.authStateReady();
  if (!auth.currentUser) await Auth.signInAnonymously(auth);
  const uid = auth.currentUser!.uid,
    expiresAt = Date.now() + 86400000;
  const batch = writeBatch(db);
  batch.set(doc(db, "roomOwners", id), { uid, controlToken, expiresAt });
  batch.set(doc(db, "liveRooms", id), { ...projection, expiresAt });
  await batch.commit();
  return { expiresAt, uid };
}
export async function publishRoom(
  id: string,
  projection: Projection,
  lastCommand = "",
) {
  await updateDoc(doc(api().db, "liveRooms", id), {
    ...projection,
    lastCommand,
  });
}
export function watchCommands(
  id: string,
  onCommand: (id: string, action: string, at: number) => void,
  onError: () => void,
) {
  const { db } = api();
  return onSnapshot(
    collection(db, "liveRooms", id, "commands"),
    (snapshot) => {
      for (const change of snapshot.docChanges())
        if (change.type === "added") {
          const data = change.doc.data();
          onCommand(change.doc.id, data.action, data.at);
        }
    },
    onError,
  );
}
export async function clearCommand(id: string, commandId: string) {
  await deleteDoc(doc(api().db, "liveRooms", id, "commands", commandId));
}
export async function endRoom(id: string) {
  const { db } = api();
  // Revoke the public projection first. Commands fail closed after it disappears.
  await deleteDoc(doc(db, "liveRooms", id));
  const commands = await getDocs(collection(db, "liveRooms", id, "commands"));
  for (let i = 0; i < commands.docs.length; i += 450) {
    const batch = writeBatch(db);
    commands.docs.slice(i, i + 450).forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }
  await deleteDoc(doc(db, "roomOwners", id));
}
export async function sameOwner(uid: string) {
  const { auth } = api();
  await auth.authStateReady();
  return auth.currentUser?.uid === uid;
}
