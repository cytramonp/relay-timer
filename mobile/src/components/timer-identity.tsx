import React from "react";
import { View } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import type { Kind } from "../core/types";
import { BrandLogo } from "./brand-logo";
const art: Partial<Record<Kind, number>> = {
  boxing: require("../../assets/boxing.jpg"),
  fitness: require("../../assets/fitness.jpg"),
  pomodoro: require("../../assets/pomodoro.jpg"),
  classroom: require("../../assets/classroom.jpg"),
  chess: require("../../assets/chess.jpg"),
  stopwatch: require("../../assets/stopwatch.jpg"),
  simple: require("../../assets/simple.jpg"),
  newyear: require("../../assets/newyear.jpg"),
};
/** The timer's familiar illustration remains separate from the owner's brand. */
export function TimerIdentity({ kind }: { kind: Kind }) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
      }}
    >
      {kind === "meeting" ? (
        <View
          accessibilityLabel="Meeting glasses"
          style={{
            width: 88,
            height: 72,
            borderRadius: 18,
            backgroundColor: "#e7e9b1",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="glasses-outline" size={52} color="#17676b" />
        </View>
      ) : (
        <Image
          source={art[kind]}
          accessibilityLabel={`${kind} timer illustration`}
          contentFit="cover"
          style={{ width: 88, height: 72, borderRadius: 18 }}
        />
      )}
      <BrandLogo />
    </View>
  );
}
