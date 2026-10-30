import React, { useState } from "react";
import { Linking, View } from "react-native";
import { Stack } from "expo-router";
import { Action, Body, Heading, Page, Rule } from "../components/ui";
import {
  buyPro,
  purchasesEnabled,
  refreshBilling,
  restorePurchases,
  useBilling,
} from "../services/billing";
import { useTheme } from "../theme";

export default function ProScreen() {
  const { access, product, error } = useBilling(),
    t = useTheme();
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  async function task(fn: () => Promise<unknown>, success = "") {
    if (busy) return;
    setBusy(true);
    setMessage("");
    try {
      await fn();
      setMessage(success);
    } catch (e) {
      setMessage(
        e instanceof Error
          ? e.message
          : "Could not check your plan. Try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <Page>
      <Stack.Screen options={{ title: "Your plan" }} />
      <Body muted>
        {access ? `YOUR PLAN · ${access.tier.toUpperCase()}` : "YOUR PLAN"}
      </Body>
      <Heading>Your timer. Your way.</Heading>
      <Body>
        One library for meetings, training, focus and everyday routines.
      </Body>
      <View
        style={{
          backgroundColor: t.clock,
          borderRadius: 16,
          padding: 24,
          gap: 16,
        }}
      >
        <Body style={{ color: t.cream, fontSize: 23 }}>CorpTimer Pro</Body>
        <Body style={{ color: t.cream }}>
          Unlimited starts. Edit durations, stages, rounds and agendas. Save and
          reuse your own timers.
        </Body>
        {product ? (
          <Body style={{ color: t.bright }}>
            {product.price} / year · auto-renewing
          </Body>
        ) : (
          <Body style={{ color: t.bright }}>
            Annual plan · price shown by Google Play
          </Body>
        )}
        {access?.tier === "pro" ? (
          <Body style={{ color: t.bright }}>Pro is active.</Body>
        ) : (
          <Action
            label={busy ? "Please wait…" : "Subscribe with Google Play"}
            tone="cream"
            disabled={busy || !product || !purchasesEnabled()}
            onPress={() => void task(buyPro)}
          />
        )}
      </View>
      {!purchasesEnabled() ? (
        <Body muted>
          Google Play purchases are being prepared. This build can check trial
          and Free access; it cannot take a payment.
        </Body>
      ) : null}
      <Heading>Start with full access.</Heading>
      <Body>
        The trial ends only after both 10 days and 10 timer starts. Then Free
        includes two starts per UTC day. Pausing, resuming, changing speakers
        and stages use the same start.
      </Body>
      <Body>
        Your running timers, history, exports and saved setups remain available
        when your plan changes.
      </Body>
      {access?.tier === "free" ? (
        <Body>
          {access.remaining} of 2 starts left today. Resets at 00:00 UTC.
        </Body>
      ) : null}
      <Rule />
      <Action
        label="Restore Google Play purchases"
        disabled={busy || !purchasesEnabled()}
        onPress={() =>
          void task(
            restorePurchases,
            "Restore check complete. Your current plan is shown above.",
          )
        }
      />
      <Action
        label="Refresh plan"
        disabled={busy}
        onPress={() => void task(refreshBilling)}
      />
      <Action
        label="Manage Google Play subscription"
        onPress={() =>
          void Linking.openURL(
            "https://play.google.com/store/account/subscriptions?sku=corptimer_pro_yearly&package=com.corptimer.app",
          ).catch(() =>
            setMessage(
              "Open Google Play → Payments & subscriptions → Subscriptions.",
            ),
          )
        }
      />
      <Body muted>
        Payment is charged to your Google Play account. The annual subscription
        renews automatically unless cancelled in Google Play before renewal.
        Cancelling retains Pro until the end of the paid period. No payment is
        required to start the CorpTimer trial.
      </Body>
      <Action
        label="Privacy & data"
        onPress={() => void Linking.openURL("https://corptimer.com/#privacy")}
      />
      {message || error ? <Body>{message || error}</Body> : null}
    </Page>
  );
}
