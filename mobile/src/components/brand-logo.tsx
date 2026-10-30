import React from "react";
import { Image } from "expo-image";
import { useApp } from "../state/app-store";
import { useBilling } from "../services/billing";

export function BrandLogo() {
  const { store } = useApp(),
    { access } = useBilling();
  if (!store.settings.companyLogo || !access?.customize) return null;
  return (
    <Image
      source={{ uri: store.settings.companyLogo }}
      accessibilityLabel="Your company logo"
      contentFit="contain"
      style={{ width: 120, height: 48 }}
    />
  );
}
