import React, { useEffect, useRef, useState } from "react";
import { Linking, Text, View } from "react-native";
import { Stack, router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { Action, Body, Field, Heading, Page, Row } from "../components/ui";
import { sendFeedback, type Feedback } from "../services/feedback";
import { useTheme } from "../theme";

const KEY = "corptimer-feedback-draft-v1";
const empty: Feedback = {
  message: "",
  email: "",
  category: "Something isn’t working",
};
export default function FeedbackScreen() {
  const t = useTheme(),
    [form, setForm] = useState(empty),
    [ready, setReady] = useState(false),
    [busy, setBusy] = useState(false),
    [sent, setSent] = useState(false),
    [error, setError] = useState("");
  const sending = useRef(false);
  useEffect(() => {
    let mounted = true;
    void AsyncStorage.getItem(KEY)
      .then((json) => {
        if (!mounted) return;
        if (json) {
          try {
            const draft = JSON.parse(json);
            if (
              typeof draft.message === "string" &&
              typeof draft.email === "string" &&
              typeof draft.category === "string"
            )
              setForm(draft);
          } catch {}
        }
        setReady(true);
      })
      .catch(() => {
        if (mounted) setReady(true);
      });
    return () => {
      mounted = false;
    };
  }, []);
  useEffect(() => {
    if (!ready || sent) return;
    const timer = setTimeout(() => {
      void AsyncStorage.setItem(KEY, JSON.stringify(form)).catch(() => {});
    }, 200);
    return () => clearTimeout(timer);
  }, [form, ready, sent]);
  async function send() {
    if (sending.current) return;
    sending.current = true;
    setBusy(true);
    setError("");
    try {
      await AsyncStorage.setItem(KEY, JSON.stringify(form));
      await sendFeedback(form);
      setSent(true);
      await AsyncStorage.removeItem(KEY).catch(() => {});
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Could not send. Your draft is saved; please try again.",
      );
    } finally {
      sending.current = false;
      setBusy(false);
    }
  }
  return (
    <Page>
      <Stack.Screen
        options={{ title: "Support & feedback", gestureEnabled: !busy }}
      />
      {sent ? (
        <>
          <Ionicons name="checkmark-circle-outline" size={48} color={t.teal} />
          <Heading>Thank you. Message sent.</Heading>
          <Body>
            Your message was accepted by our delivery service. If you left an
            email, support can reply there.
          </Body>
          <Action
            label="Back to settings"
            tone="primary"
            onPress={() => router.back()}
          />
        </>
      ) : (
        <>
          <Heading>Let’s make it better.</Heading>
          <Body muted>
            Report a problem or tell us what would help. You can write in any
            language.
          </Body>
          <Row>
            {["Something isn’t working", "An idea", "A question"].map(
              (category) => (
                <Action
                  key={category}
                  label={category}
                  disabled={busy || !ready}
                  tone={form.category === category ? "primary" : "outline"}
                  onPress={() => setForm({ ...form, category })}
                />
              ),
            )}
          </Row>
          <Field
            label="Your message"
            containerStyle={{ flexGrow: 0, flexBasis: "auto" }}
            testID="feedback-message"
            value={form.message}
            editable={ready && !busy}
            onChangeText={(message) => setForm({ ...form, message })}
            multiline
            maxLength={5000}
            placeholder="What happened? What did you expect?"
            style={{ minHeight: 170, textAlignVertical: "top" }}
          />
          <Text style={{ color: t.muted, textAlign: "right", marginTop: -12 }}>
            {form.message.length}/5,000
          </Text>
          <Field
            label="Email for a reply · optional"
            containerStyle={{ flexGrow: 0, flexBasis: "auto" }}
            value={form.email}
            editable={ready && !busy}
            onChangeText={(email) => setForm({ ...form, email })}
            keyboardType="email-address"
            inputMode="email"
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={254}
            placeholder="you@example.com"
          />
          <Body muted style={{ fontSize: 13, lineHeight: 20 }}>
            Only your message, optional reply email, category, app version and
            platform are sent through Web3Forms to CorpTimer support. Your
            agendas, notes and history stay on this device. Please leave out
            private meeting details.
          </Body>
          <Action
            label="Delivery service privacy"
            onPress={() => {
              void Linking.openURL("https://web3forms.com/privacy").catch(() =>
                setError(
                  "Could not open the privacy page. Try opening web3forms.com/privacy in your browser.",
                ),
              );
            }}
          />
          {error ? (
            <View accessibilityRole="alert">
              <Body style={{ color: t.dangerText }}>{error}</Body>
            </View>
          ) : null}
          <Action
            label={busy ? "Sending…" : "Send message"}
            disabled={busy || !ready}
            tone="primary"
            onPress={() => void send()}
          />
          <Body muted style={{ fontSize: 13 }}>
            Your unsent draft is saved on this device.
          </Body>
        </>
      )}
    </Page>
  );
}
