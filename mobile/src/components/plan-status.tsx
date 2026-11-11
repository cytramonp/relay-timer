import { useTranslate } from "../state/language";
import React from "react";
import { router } from "expo-router";
import { Action, Body, Row } from "./ui";
import { useBilling, refreshBilling } from "../services/billing";
import { BrandLogo } from "./brand-logo";

export function PlanStatus({ showLogo = true }: { showLogo?: boolean }) {
  const tr = useTranslate();
  const { access, error, loading } = useBilling();
  return (
    <Row>
      {showLogo ? <BrandLogo /> : null}
      <Body muted>
        {loading
          ? tr("Checking access…")
          : access?.tier === "pro"
            ? tr("CorpTimer Pro")
            : access?.tier === "trial"
              ? tr("Full access · trial")
              : access
                ? tr("Free · {0} starts left today", String(access.remaining))
                : tr("Access check unavailable")}
      </Body>
      <Action label={tr("Your plan")} onPress={() => router.push("/pro")} />
      {!access && !loading ? (
        <Action
          label={tr("Retry access check")}
          onPress={() => void refreshBilling().catch(() => {})}
        />
      ) : null}
      {error && !access ? <Body muted>{error}</Body> : null}
    </Row>
  );
}
export function CustomizationGate({ children }: { children: React.ReactNode }) {
  const tr = useTranslate();
  const { access, loading } = useBilling();
  if (access?.customize) return <>{children}</>;
  return (
    <>
      <Body>
        {loading
          ? tr("Checking your access…")
          : access
            ? tr(
                "Editing and custom timers are included in Pro. Your saved setups stay on this device.",
              )
            : tr("Reconnect to check your access before editing.")}
      </Body>
      <Action
        label={tr("View your plan")}
        onPress={() => router.push("/pro")}
      />
      {!access ? (
        <Action
          label={tr("Retry access check")}
          onPress={() => void refreshBilling().catch(() => {})}
        />
      ) : null}
    </>
  );
}
