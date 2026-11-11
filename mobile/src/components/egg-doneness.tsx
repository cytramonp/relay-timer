import React, { memo } from "react";
import { Text, View } from "react-native";
import { Image } from "expo-image";
import type { Card } from "../core/board-engine";
import { eggMilestones, eggStages } from "../core/egg";
import { formatTime } from "../core/clock";
import { useTranslate } from "../state/language";
import { useTheme } from "../theme";

const images = [
  require("../../assets/egg/raw.png"),
  require("../../assets/egg/runny.png"),
  require("../../assets/egg/soft.png"),
  require("../../assets/egg/jammy.png"),
  require("../../assets/egg/set.png"),
  require("../../assets/egg/hard.png"),
];

export const EggDoneness = memo(function EggDoneness({
  card,
  stageNames,
  compact = false,
}: {
  card: Card;
  stageNames: readonly string[];
  compact?: boolean;
}) {
  const theme = useTheme();
  const tr = useTranslate();
  const milestones = eggMilestones(card, stageNames);
  if (!milestones) return null;
  const { selected, seconds } = milestones;
  const [label, description] = eggStages[selected];
  return (
    <View style={{ alignItems: "center", gap: 8 }} testID="egg-doneness">
      <Image
        source={images[selected]}
        contentFit="contain"
        style={{ width: 104, height: 112 }}
        accessible
        accessibilityLabel={tr(description)}
      />
      <Text
        style={{ color: theme.cream, fontWeight: "700", textAlign: "center" }}
      >
        {tr(label)}
      </Text>
      <Text style={{ color: theme.clockMuted, textAlign: "center" }}>
        {tr(description)}
      </Text>
      {!compact ? (
        <View
          accessibilityLabel={tr("Egg doneness milestones")}
          style={{
            alignSelf: "stretch",
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 6,
          }}
        >
          {eggStages.map(([stage], i) => (
            <View
              key={stage}
              accessible
              accessibilityLabel={tr(
                "{0} · {1}",
                tr(stage),
                formatTime(seconds[i] * 1000),
              )}
              accessibilityState={{ selected: i === selected }}
              style={{
                flexBasis: "30%",
                flexGrow: 1,
                alignItems: "center",
                justifyContent: "center",
                padding: 6,
                gap: 4,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: i === selected ? theme.bright : theme.clockMuted,
              }}
            >
              <Image
                source={images[i]}
                contentFit="contain"
                style={{ width: 32, height: 36 }}
              />
              <Text
                style={{
                  color: i === selected ? theme.bright : theme.cream,
                  textAlign: "center",
                }}
              >
                {formatTime(seconds[i] * 1000)}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
});
