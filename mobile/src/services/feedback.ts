import Constants from "expo-constants";
import { Platform } from "react-native";

// Public form alias, never the recipient's email or a mail-account credential.
export const feedbackKey = process.env.EXPO_PUBLIC_FEEDBACK_FORM_KEY ?? "57b15dbd-0dd2-4e87-8676-8efc5e63eaa5";
export type Feedback = { message: string; email: string; category: string };
export function validateFeedback(form: Feedback) {
  if (form.message.trim().length < 10)
    throw Error("Please add a little more detail (at least 10 characters).");
  if (form.message.length > 5000)
    throw Error("Please keep your message under 5,000 characters.");
  if (
    form.email.trim() &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())
  )
    throw Error("Check your reply email, or leave it empty.");
}
export async function sendFeedback(form: Feedback) {
  validateFeedback(form);
  if (!feedbackKey)
    throw Error(
      "Support delivery is being connected. Your draft is saved on this device; please try again after the next update.",
    );
  const controller = new AbortController(),
    timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        access_key: feedbackKey,
        subject: `CorpTimer · ${form.category}`,
        from_name: "CorpTimer feedback",
        message: form.message.trim(),
        ...(form.email.trim() ? { email: form.email.trim() } : {}),
        category: form.category,
        app_version: Constants.expoConfig?.version ?? "unknown",
        platform: Platform.OS,
        botcheck: false,
      }),
    });
    if (response.status === 429)
      throw Error(
        "Support is receiving too many messages. Your draft is saved; please try later.",
      );
    const result = await response.json();
    if (!response.ok || result.success !== true)
      throw Error(
        "The delivery service could not accept your message. Your draft is saved; please try later.",
      );
  } catch (error) {
    if (
      error instanceof TypeError ||
      (error instanceof Error && error.name === "AbortError")
    )
      throw Error(
        "Could not reach support. Check your connection. Your draft is saved; try again when online.",
      );
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
