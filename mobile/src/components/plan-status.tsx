import React from "react";
import { router } from "expo-router";
import { Action, Body, Row } from "./ui";
import { useBilling, refreshBilling } from "../services/billing";

export function PlanStatus() {
  const { access, error, loading } = useBilling();
  return (
    <Row>
      <Body muted>
        {loading
          ? "Checking access…"
          : access?.tier === "pro"
            ? "CorpTimer Pro"
            : access?.tier === "trial"
              ? "Full access · trial"
              : access
                ? `Free · ${access.remaining} starts left today`
                : "Access check unavailable"}
      </Body>
      <Action label="Your plan" onPress={() => router.push("/pro")} />
      {!access && !loading ? (
        <Action
          label="Retry access check"
          onPress={() => void refreshBilling().catch(() => {})}
        />
      ) : null}
      {error && !access ? <Body muted>{error}</Body> : null}
    </Row>
  );
}
export function CustomizationGate({ children }: { children: React.ReactNode }) {
  const { access, loading } = useBilling();
  if (access?.customize) return <>{children}</>;
  return (
    <>
      <Body>
        {loading
          ? "Checking your access…"
          : access
            ? "Editing and custom timers are included in Pro. Your saved setups stay on this device."
            : "Reconnect to check your access before editing."}
      </Body>
      <Action label="View your plan" onPress={() => router.push("/pro")} />
      {!access ? (
        <Action
          label="Retry access check"
          onPress={() => void refreshBilling().catch(() => {})}
        />
      ) : null}
    </>
  );
}
