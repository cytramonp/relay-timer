import React, { useState } from "react";
import { View, Pressable, Text } from "react-native";
import { Image } from "expo-image";
import { Action, Body, Field, Heading, Row } from "./ui";
import { validAccent, type CustomMedia } from "../core/custom-media";
import { pickCustomMedia } from "../services/custom-media";
import { playCustomCue } from "../services/audio";
import { requireCustomization } from "../services/billing";

export type TimerBrand = {
  accent?: string;
  logo?: CustomMedia;
  customSound?: CustomMedia;
};
export function TimerBrandEditor({
  value,
  onChange,
  audio = true,
}: {
  value: TimerBrand;
  onChange: (value: TimerBrand) => void;
  audio?: boolean;
}) {
  const [error, setError] = useState("");
  const [hex, setHex] = useState(value.accent ?? "#66D6BE");
  async function change(fn: () => Promise<TimerBrand> | TimerBrand) {
    try {
      requireCustomization();
      const next = await fn();
      requireCustomization();
      onChange(next);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update the design.");
    }
  }
  return (
    <View style={{ gap: 12 }}>
      <Heading>Colors & company logo</Heading>
      <Body muted>
        Choose a highlight color. Clock digits keep their readable contrast.
        Your logo and sound travel with exported setups.
      </Body>
      <Row>
        {[
          ["Mint", "#66D6BE"],
          ["Amber", "#F6BD70"],
          ["Coral", "#F69A90"],
          ["Violet", "#AFA6ED"],
          ["Blue", "#91C8F6"],
        ].map(([name, accent]) => (
          <Pressable
            key={accent}
            accessibilityRole="button"
            accessibilityLabel={`${name} highlight`}
            accessibilityState={{ selected: value.accent === accent }}
            onPress={() => {
              setHex(accent);
              void change(() => ({ ...value, accent }));
            }}
            style={{
              minHeight: 48,
              padding: 10,
              borderRadius: 12,
              borderWidth: value.accent === accent ? 3 : 1,
              borderColor: "#17676b",
              backgroundColor: accent,
              flexDirection: "row",
              gap: 6,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#132c30", fontWeight: "600" }}>
              {name}
              {value.accent === accent ? " ✓" : ""}
            </Text>
          </Pressable>
        ))}
      </Row>
      <Field
        label="Custom highlight · #RRGGBB"
        value={hex}
        maxLength={7}
        autoCapitalize="characters"
        onChangeText={setHex}
      />
      <Action
        label="Apply color"
        onPress={() =>
          void change(() => {
            if (!validAccent(hex))
              throw Error("Enter a color such as #66D6BE.");
            return { ...value, accent: hex };
          })
        }
      />
      {value.logo ? (
        <Image
          source={{ uri: value.logo.uri }}
          contentFit="contain"
          style={{ width: 180, height: 64 }}
          accessibilityLabel={value.logo.name}
        />
      ) : null}
      <Row>
        <Action
          label="Upload company logo"
          onPress={() =>
            void change(async () => {
              const logo = await pickCustomMedia("image");
              return logo ? { ...value, logo } : value;
            })
          }
        />
        {value.logo ? (
          <Action
            label="Remove logo"
            onPress={() => void change(() => ({ ...value, logo: undefined }))}
          />
        ) : null}
      </Row>
      {audio ? (
        <>
          <Heading>Your sound</Heading>
          <Body muted>
            MP3, WAV, M4A, AAC or OGG, up to 2 MB. Choose “My sound” for a stage
            after uploading. Custom audio plays while the app is open;
            background notifications use the standard alert.
          </Body>
          {value.customSound ? <Body>{value.customSound.name}</Body> : null}
          <Row>
            <Action
              label="Upload sound"
              onPress={() =>
                void change(async () => {
                  const customSound = await pickCustomMedia("audio");
                  return customSound ? { ...value, customSound } : value;
                })
              }
            />
            {value.customSound ? (
              <>
                <Action
                  label="Preview my sound"
                  onPress={() =>
                    void playCustomCue(value.customSound!.uri).catch(() =>
                      setError(
                        "This audio could not be played. Try MP3 or WAV.",
                      ),
                    )
                  }
                />
                <Action
                  label="Remove sound"
                  onPress={() =>
                    void change(() => ({ ...value, customSound: undefined }))
                  }
                />
              </>
            ) : null}
          </Row>
        </>
      ) : null}
      {error ? <Body>{error}</Body> : null}
    </View>
  );
}
