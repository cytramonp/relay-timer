import React, { useState } from "react";
import { Action, Body, Heading, Row } from "./ui";
import { BrandLogo } from "./brand-logo";
import { useApp } from "../state/app-store";
import { requireCustomization } from "../services/billing";
import { pickCustomMedia } from "../services/custom-media";
import { brandPalettes } from "../core/brand";

export function AppBrandEditor() {
  const { store, settings } = useApp();
  const [error, setError] = useState("");
  async function change(action: () => void | Promise<void>) {
    try {
      requireCustomization();
      await action();
      setError("");
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not update your design.",
      );
    }
  }
  return (
    <>
      <Heading>Colors & company logo</Heading>
      <Body muted>
        Trial & Pro · Apply your style to every timer. Saved on this device and
        included in device backups.
      </Body>
      <Row>
        {(Object.keys(brandPalettes) as (keyof typeof brandPalettes)[]).map(
          (accent) => (
            <Action
              key={accent}
              label={brandPalettes[accent].label}
              tone={
                (store.settings.accent ?? "teal") === accent
                  ? "primary"
                  : "outline"
              }
              onPress={() => void change(() => settings({ accent }))}
            />
          ),
        )}
      </Row>
      <BrandLogo />
      <Row>
        <Action
          label="Upload company logo"
          onPress={() =>
            void change(async () => {
              const logo = await pickCustomMedia("image");
              if (logo) {
                requireCustomization();
                settings({ companyLogo: logo.uri });
              }
            })
          }
        />
        {store.settings.companyLogo ? (
          <Action
            label="Remove company logo"
            onPress={() => settings({ companyLogo: undefined })}
          />
        ) : null}
      </Row>
      {error ? <Body>{error}</Body> : null}
    </>
  );
}
