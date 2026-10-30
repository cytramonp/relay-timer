import { useSyncExternalStore } from "react";
import { AppState, Platform } from "react-native";
import {
  GoogleAuthProvider,
  linkWithCredential,
  onAuthStateChanged,
  signInAnonymously,
  signInWithCredential,
  signOut,
} from "firebase/auth";
import * as Crypto from "expo-crypto";
import { getFirebaseClient } from "./live";
import Play, {
  type PlayProduct,
  type PlayPurchase,
} from "../../modules/corptimer-billing";
import config from "../config/billing-public.json";

export type Access = {
  tier: "trial" | "free" | "pro";
  customize: boolean;
  canStart: boolean;
  remaining: number;
  resetAt?: number;
};
type Status = {
  access: Access | null;
  loading: boolean;
  error: string;
  product: PlayProduct | null;
  account: { email: string | null; name: string | null } | null;
};
let status: Status = {
  access: null,
  loading: true,
  error: "",
  product: null,
  account: null,
};
const listeners = new Set<() => void>();
let refresh: Promise<Access> | null = null;
let initialized = false;
let checkingPurchases: Promise<void> | null = null;
function publish(patch: Partial<Status>) {
  status = { ...status, ...patch };
  listeners.forEach((fn) => fn());
}
export function useBilling() {
  return useSyncExternalStore(
    (fn) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    () => status,
    () => status,
  );
}
export function billingAccess() {
  return status.access;
}
export function purchasesEnabled() {
  return Platform.OS === "android" && config.purchasesEnabled && !!Play;
}
export function googleSignInEnabled() {
  return Platform.OS === "android" && !!config.googleWebClientId && !!Play;
}
export async function signInGoogle() {
  if (!googleSignInEnabled())
    throw Error(
      "Google account sign-in needs the publisher's Android OAuth configuration.",
    );
  const user = await identity();
  const token = await Play!.signIn(config.googleWebClientId);
  const credential = GoogleAuthProvider.credential(token);
  if (user.isAnonymous) {
    try {
      await linkWithCredential(user, credential);
    } catch (e) {
      if ((e as { code?: string }).code !== "auth/credential-already-in-use")
        throw e;
      await signInWithCredential(getFirebaseClient().auth, credential);
    }
  } else await signInWithCredential(getFirebaseClient().auth, credential);
  const signedIn = getFirebaseClient().auth.currentUser;
  refresh = null;
  publish({
    account:
      signedIn && !signedIn.isAnonymous
        ? { email: signedIn.email, name: signedIn.displayName }
        : null,
  });
  await refreshBilling();
  if (purchasesEnabled()) await restorePurchases();
}
export async function signOutAccount() {
  await signOut(getFirebaseClient().auth);
  await refreshBilling();
}
async function identity() {
  const { auth } = getFirebaseClient();
  await auth.authStateReady();
  if (!auth.currentUser) await signInAnonymously(auth);
  return auth.currentUser!;
}
async function request(path: string, body: object = {}) {
  const user = await identity();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(config.apiBase + path, {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${await user.getIdToken()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    if (getFirebaseClient().auth.currentUser?.uid !== user.uid)
      throw Error("The account changed. Refresh your plan and try again.");
    if (data.access && ["trial", "free", "pro"].includes(data.access.tier))
      publish({ access: data.access, error: "", loading: false });
    if (!response.ok)
      throw Error(
        data.error ||
          "Your two free sessions are used for today. Try again tomorrow or choose Pro.",
      );
    return data;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError")
      throw Error(
        "The access check timed out. Reconnect and try again; your running timer can continue.",
      );
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
export function refreshBilling(): Promise<Access> {
  if (refresh) return refresh;
  refresh = request("/access/status")
    .then(() => {
      if (!status.access)
        throw Error("The access service returned an invalid response.");
      return status.access;
    })
    .catch((e: Error) => {
      publish({ error: e.message, loading: false });
      throw e;
    })
    .finally(() => {
      refresh = null;
    });
  return refresh;
}
export async function reserveSession(id: string) {
  await request("/access/start", { sessionId: id });
}
export function requireCustomization() {
  if (!status.access)
    throw Error("Connect to check your trial or Pro access, then try again.");
  if (!status.access.customize)
    throw Error("Editing and custom timers are part of CorpTimer Pro.");
}
async function verifyPurchases(purchases: PlayPurchase[]) {
  for (const purchase of purchases) {
    if (purchase.state === 2) {
      publish({
        error:
          "Payment is pending. Pro will unlock after Google Play confirms it.",
      });
      continue;
    }
    if (purchase.state !== 1 || !purchase.products.includes(config.productId))
      continue;
    // Server reads Google's current receipt and acknowledges it before granting access.
    await request("/billing/google/verify", { token: purchase.token });
  }
  await refreshBilling();
}
export async function restorePurchases() {
  if (!purchasesEnabled())
    throw Error("Google Play purchases are not connected in this build yet.");
  if (checkingPurchases) return checkingPurchases;
  checkingPurchases = Play!
    .restore()
    .then(verifyPurchases)
    .finally(() => {
      checkingPurchases = null;
    });
  return checkingPurchases;
}
export async function buyPro() {
  if (!purchasesEnabled())
    throw Error("Google Play purchases are not connected in this build yet.");
  const user = await identity();
  if (user.isAnonymous)
    throw Error(
      "Sign in with Google before subscribing so your Pro access can follow your account.",
    );
  const account = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    user.uid,
  );
  await Play!.buy(config.productId, config.basePlanId, account);
}
export function initializeBilling() {
  if (initialized) return;
  initialized = true;
  onAuthStateChanged(getFirebaseClient().auth, (user) => {
    refresh = null;
    publish({
      account:
        user && !user.isAnonymous
          ? { email: user.email, name: user.displayName }
          : null,
      access: null,
      loading: true,
    });
  });
  const check = () => {
    void refreshBilling().catch(() => {});
    if (purchasesEnabled())
      void restorePurchases().catch((e: Error) =>
        publish({ error: e.message }),
      );
  };
  check();
  if (purchasesEnabled()) {
    void Play!
      .product(config.productId, config.basePlanId)
      .then((product) => publish({ product }))
      .catch((e: Error) => publish({ error: e.message }));
    Play!.addListener("onPurchases", ({ code, purchases }) => {
      if (code === 1) {
        publish({
          error:
            "Purchase cancelled. You have not been charged by this action.",
        });
        return;
      }
      if (code !== 0) {
        publish({
          error:
            "Google Play could not complete the purchase. Restore purchases to check an existing subscription.",
        });
        return;
      }
      void verifyPurchases(purchases).catch((e: Error) =>
        publish({ error: e.message }),
      );
    });
  }
  AppState.addEventListener("change", (state) => {
    if (state === "active") check();
  });
}
