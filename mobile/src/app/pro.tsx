import { useTranslate } from "../state/language";
import { GoogleMark } from "../components/google-mark";
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
  const tr = useTranslate();
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
      <Stack.Screen options={{ title: tr("Your plan") }} />
      <Body muted>
        {access
          ? tr("YOUR PLAN · {0}", String(access.tier.toUpperCase()))
          : tr("YOUR PLAN")}
      </Body>
      <Heading>{tr("Your timer. Your way.")}</Heading>
      <Body>
        {tr("One library for meetings, training, focus and everyday routines.")}
      </Body>
      <View
        style={{
          backgroundColor: t.clock,
          borderRadius: 16,
          padding: 24,
          gap: 16,
        }}
      >
        <Body style={{ color: t.cream, fontSize: 23 }}>
          {tr("CorpTimer Pro")}
        </Body>
        <Body style={{ color: t.cream }}>
          {tr(
            "Unlimited starts. Edit durations, stages, rounds and agendas. Save and reuse your own timers.",
          )}
        </Body>
        {product ? (
          <Body style={{ color: t.bright }}>
            {product.price}
            {tr(" / year · auto-renewing")}
          </Body>
        ) : (
          <Body style={{ color: t.bright }}>
            {Platform.OS === "android"
              ? tr("Annual plan - price shown by Google Play")
              : tr("Annual plan - purchases unavailable in this build")}
          </Body>
        )}
        {access?.tier === "pro" ? (
          <Body style={{ color: t.bright }}>{tr("Pro is active.")}</Body>
        ) : (
          <Action
            label={
              busy
                ? tr("Please wait...")
                : Platform.OS === "android"
                  ? tr("Subscribe with Google Play")
                  : tr("Pro subscription")
            }
            tone="cream"
            disabled={busy || !product || !purchasesEnabled()}
            onPress={() => void task(buyPro)}
          />
        )}
      </View>
      {!purchasesEnabled() ? (
        <Body muted>
          {Platform.OS === "android"
            ? tr(
                "Google Play purchases and restore are not available in this build yet.",
              )
            : tr(
                "App Store purchases and restore are not available in this build yet.",
              )}{" "}
          {tr(
            "You can use the trial and Free timers without signing in. No payment can be taken in this build.",
          )}
        </Body>
      ) : null}
      <Action
        label={
          Platform.OS === "android"
            ? tr("Restore Google Play purchases")
            : tr("Restore purchases")
        }
        disabled={busy || !purchasesEnabled()}
        onPress={() =>
          void task(
            restorePurchases,
            "Restore check complete. Your current plan is shown above.",
          )
        }
      />
      <Action
        label={tr("Refresh plan")}
        disabled={busy}
        onPress={() => void task(refreshBilling)}
      />
      {Platform.OS === "android" ? (
        <Action
          label={tr("Manage Google Play subscription")}
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
      ) : null}
      {Platform.OS === "android" ? (
        <Body muted>
          {tr(
            "Payment is charged to your Google Play account. The annual subscription renews automatically unless cancelled in Google Play before renewal. Cancelling retains Pro until the end of the paid period. No payment is required to start the CorpTimer trial.",
          )}
        </Body>
      ) : null}
      <Heading>{tr("Start with full access.")}</Heading>
      <Body>
        {tr(
          "The trial ends only after both 10 days and 10 timer starts. Then Free includes two starts per UTC day. Pausing, resuming, changing speakers and stages use the same start.",
        )}
      </Body>
      <Body>
        {tr(
          "Your running timers, history, exports and saved setups remain available when your plan changes.",
        )}
      </Body>
      {access?.tier === "free" ? (
        <Body>
          {access.remaining}
          {tr(" of 2 starts left today. Resets at 00:00 UTC.")}
        </Body>
      ) : null}
      <Rule />
      <Heading>{tr("Website account (optional)")}</Heading>
      <Body muted>
        {tr(
          "Already have Pro on corptimer.com? Link the same Google account to check that access here. This is separate from purchasing or restoring through the app store.",
        )}
      </Body>
      {account ? (
        <>
          <Body>
            {tr("Website account:")}{" "}
            {account.email || account.name || tr("your Google account")}.
          </Body>
          <Action
            label={tr("Sign out")}
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
            label={tr("Sign in with Google")}
            icon={<GoogleMark />}
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
              ? tr(
                  "Use the same Google account as the website to check your Pro access. Your local timers stay on this device.",
                )
              : tr(
                  "Website account linking is not available in this build yet. No sign-in is needed to use the trial or Free timers.",
                )}
          </Body>
        </>
      )}
      <Rule />
      <Heading>{tr("Your logo")}</Heading>
      <BrandLogo />
      <Body muted>
        {tr(
          "PNG, JPEG or WebP, up to 2 MB. Stored on this device and in your explicit device-data export; never attached to feedback or sent to billing.",
        )}
      </Body>
      <Action
        label={tr("Choose company logo")}
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
        label={tr("Remove company logo")}
        onPress={() => settings({ companyLogo: undefined })}
      />
      <Rule />
      <Action
        label={tr("Privacy & data")}
        onPress={() => router.push("/privacy")}
      />
      {message || error ? <Body>{message || error}</Body> : null}
    </Page>
  );
}
