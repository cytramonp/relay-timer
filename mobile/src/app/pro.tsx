import React, { useState } from "react";
import { Linking, Platform, View } from "react-native";
import { Stack, router } from "expo-router";
import * as DocumentPicker from "expo-document-picker";
import { File } from "expo-file-system";
import { useApp } from "../state/app-store";
import { BrandLogo } from "../components/brand-logo";
import { Action, Body, Heading, Page, Rule } from "../components/ui";
import {
  requireCustomization,
  buyPro,
  purchasesEnabled,
  refreshBilling,
  restorePurchases,
  useBilling,
  googleSignInEnabled,
  signInGoogle,
  signOutAccount,
} from "../services/billing";
import { useLive } from "../state/live-store";
import { useTheme } from "../theme";

export default function ProScreen() {
  const live = useLive();
  const { settings } = useApp();
  const { access, product, error, account } = useBilling(),
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
      {account ? (
        <>
          <Body>
            Signed in as{" "}
            {account.email || account.name || "your Google account"}.
          </Body>
          <Action
            label="Sign out"
            disabled={busy}
            onPress={() =>
              void task(async () => {
                if (live.host) await live.stop();
                await signOutAccount();
              })
            }
          />
        </>
      ) : (
        <>
          <Action
            label="Sign in with Google"
            disabled={busy || !googleSignInEnabled()}
            onPress={() =>
              void task(async () => {
                if (live.host) await live.stop();
                await signInGoogle();
              })
            }
          />
          <Body muted>
            {googleSignInEnabled()
              ? "Use the same Google account as the website to check your Pro access. Your local timers stay on this device."
              : "Google account linking is awaiting the publisher's app-certificate setup. You can use the trial without signing in."}
          </Body>
        </>
      )}
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
      <Heading>Your logo</Heading>
      <BrandLogo />
      <Body muted>
        PNG, JPEG or WebP, up to 2 MB. Stored on this device and in your
        explicit device-data export; never attached to feedback or sent to
        billing.
      </Body>
      <Action
        label="Choose company logo"
        disabled={busy || !access?.customize}
        onPress={() =>
          void task(async () => {
            requireCustomization();
            const pick = await DocumentPicker.getDocumentAsync({
              type: ["image/png", "image/jpeg", "image/webp"],
              copyToCacheDirectory: true,
              multiple: false,
            });
            if (pick.canceled) return;
            const asset = pick.assets[0];
            if (
              !asset.mimeType ||
              !["image/png", "image/jpeg", "image/webp"].includes(
                asset.mimeType,
              ) ||
              (asset.size ?? 3000000) > 2000000
            )
              throw Error("Choose PNG, JPEG or WebP up to 2 MB.");
            let uri: string;
            if (Platform.OS === "web" && asset.file)
              uri = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(String(reader.result));
                reader.onerror = reject;
                reader.readAsDataURL(asset.file!);
              });
            else
              uri = `data:${asset.mimeType};base64,${await new File(asset.uri).base64()}`;
            if (uri.length > 2800000) throw Error("Choose a smaller image.");
            settings({ companyLogo: uri });
          })
        }
      />
      <Action
        label="Remove company logo"
        onPress={() => settings({ companyLogo: undefined })}
      />
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
      <Action label="Privacy & data" onPress={() => router.push("/privacy")} />
      {message || error ? <Body>{message || error}</Body> : null}
    </Page>
  );
}
