import React, { useEffect, useState } from "react";
import { Platform, Text, TextInput, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import Svg, { Circle, Line } from "react-native-svg";
import { useTheme } from "../theme";
import { useApp } from "../state/app-store";
import { angleDelta, dialValue } from "../core/dial";
import { Action, Body, Field, Row } from "./ui";
import { dialFeedback } from "../services/audio";

const SIZE = 264,
  CENTER = SIZE / 2;
/** Value remains in the field's units (minutes or seconds), including keyboard input. */
export function DurationField({
  label,
  value,
  onChangeText,
  unit = "seconds",
  expanded = false,
  min = 0,
  max = 17280000,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  unit?: "minutes" | "seconds";
  expanded?: boolean;
  min?: number;
  max?: number;
}) {
  const t = useTheme(),
    { store, settings } = useApp();
  const [open, setOpen] = useState(expanded),
    [draft, setDraft] = useState({ source: value, text: value });
  const sound = store.settings.dialSound !== false;
  const text = draft.source === value ? draft.text : value;
  function setText(text: string) {
    setDraft({ source: value, text });
  }
  const step = 1;
  const amount = useSharedValue(Number(value) || 0),
    raw = useSharedValue(Number(value) || 0),
    previous = useSharedValue(0);
  useEffect(() => {
    amount.set(Number(value) || 0);
    raw.set(Number(value) || 0);
  }, [value, amount, raw]);
  function detent(next: number) {
    setText(String(next));
    dialFeedback(store.settings.haptics, sound);
  }
  function commit(next: number) {
    setText(String(next));
    onChangeText(String(next));
  }
  const pan = Gesture.Pan()
    .minDistance(2)
    .onBegin((e) => {
      previous.set(Math.atan2(e.y - CENTER, e.x - CENTER));
      raw.set(Number(value) || 0);
    })
    .onUpdate((e) => {
      // A finger crossing the center should not fling the value by half a turn.
      const angle = Math.atan2(e.y - CENTER, e.x - CENTER);
      const delta = angleDelta(angle, previous.get());
      previous.set(angle);
      if (Math.hypot(e.x - CENTER, e.y - CENTER) < 55) return;
      raw.set(
        Math.max(
          min,
          Math.min(max, raw.get() + (delta / (2 * Math.PI)) * 60 * step),
        ),
      );
      const next = dialValue(raw.get(), step, min, max);
      if (next !== amount.get()) {
        amount.set(next);
        runOnJS(detent)(next);
      }
    })
    .onEnd(() => {
      runOnJS(commit)(amount.get());
    })
    .onFinalize((_, success) => {
      if (!success) {
        amount.set(Number(value) || 0);
        runOnJS(setText)(value);
      }
    });
  const pointer = useAnimatedStyle(() => ({
    transform: [{ rotate: `${(amount.get() / step) * 6}deg` }],
  }));
  function changeBy(delta: number) {
    const next = dialValue((Number(text) || 0) + delta, step, min, max);
    amount.set(next);
    raw.set(next);
    detent(next);
    commit(next);
  }
  return (
    <View style={{ gap: 12 }}>
      {!open ? (
        <>
          <Field
            label={label}
            value={value}
            onChangeText={onChangeText}
            inputMode="decimal"
            keyboardType="decimal-pad"
            selectTextOnFocus
            containerStyle={{ flexGrow: 0, flexBasis: "auto" }}
          />
          <Action label={`Use dial · ${label}`} onPress={() => setOpen(true)} />
        </>
      ) : (
        <>
          <Text
            accessibilityRole="header"
            style={{
              fontFamily: "Manrope",
              fontSize: 16,
              fontWeight: "600",
              color: t.ink,
            }}
          >
            {label}
          </Text>
          <View style={{ width: SIZE, height: SIZE, alignSelf: "center" }}>
            <GestureDetector gesture={pan}>
              <Animated.View
                testID="duration-dial"
                accessibilityRole="adjustable"
                accessibilityLabel={`Adjust ${label}`}
                accessibilityHint="Turn clockwise to add time, or use the plus and minus buttons."
                accessibilityValue={{
                  min,
                  max,
                  now: Number(text) || 0,
                  text: `${text} ${unit}`,
                }}
                accessibilityActions={[
                  { name: "increment" },
                  { name: "decrement" },
                ]}
                onAccessibilityAction={(e) =>
                  changeBy(
                    e.nativeEvent.actionName === "increment" ? step : -step,
                  )
                }
                style={{
                  width: SIZE,
                  height: SIZE,
                  borderRadius: CENTER,
                  backgroundColor: t.clock,
                  ...(Platform.OS === "web" ? { touchAction: "none" } : {}),
                }}
              >
                <Svg width={SIZE} height={SIZE} pointerEvents="none">
                  <Circle
                    cx={CENTER}
                    cy={CENTER}
                    r={101}
                    fill="none"
                    stroke={t.clockLine}
                    strokeWidth={1}
                  />
                  {Array.from({ length: 60 }, (_, i) => {
                    const angle = (i * Math.PI) / 30 - Math.PI / 2,
                      start = i % 5 === 0 ? 108 : 115;
                    return (
                      <Line
                        key={i}
                        x1={CENTER + Math.cos(angle) * start}
                        y1={CENTER + Math.sin(angle) * start}
                        x2={CENTER + Math.cos(angle) * 122}
                        y2={CENTER + Math.sin(angle) * 122}
                        stroke={i % 5 === 0 ? t.cream : t.clockMuted}
                        strokeWidth={i % 5 === 0 ? 2 : 1}
                      />
                    );
                  })}
                </Svg>
                <Animated.View
                  pointerEvents="none"
                  style={[
                    { position: "absolute", inset: 0, alignItems: "center" },
                    pointer,
                  ]}
                >
                  <View
                    style={{
                      width: 5,
                      height: 22,
                      marginTop: 8,
                      borderRadius: 3,
                      backgroundColor: t.salmon,
                    }}
                  />
                </Animated.View>
              </Animated.View>
            </GestureDetector>
            <View
              pointerEvents="box-none"
              style={{
                position: "absolute",
                inset: 60,
                justifyContent: "center",
                alignItems: "center",
                gap: 2,
              }}
            >
              <TextInput
                testID="dial-value"
                accessibilityLabel={label}
                value={text}
                onChangeText={(v) => {
                  setText(v);
                  onChangeText(v);
                }}
                selectTextOnFocus
                keyboardType="decimal-pad"
                inputMode="decimal"
                returnKeyType="done"
                style={{
                  color: t.cream,
                  fontFamily: "Manrope",
                  fontVariant: ["tabular-nums"],
                  textAlign: "center",
                  width: 140,
                  fontSize: text.length > 4 ? 30 : 44,
                  lineHeight: 60,
                  paddingVertical: 6,
                  includeFontPadding: true,
                }}
              />
              <Text
                pointerEvents="none"
                style={{ color: t.clockMuted, fontSize: 14 }}
              >
                {unit}
              </Text>
              <Text
                pointerEvents="none"
                style={{ color: t.clockMuted, fontSize: 12, marginTop: 6 }}
              >
                tap number to type
              </Text>
            </View>
          </View>
          <Row style={{ justifyContent: "center" }}>
            <Action
              label={`−${step} ${unit === "minutes" ? "min" : "sec"}`}
              onPress={() => changeBy(-step)}
            />
            <Action
              label={`+${step} ${unit === "minutes" ? "min" : "sec"}`}
              onPress={() => changeBy(step)}
            />
            <Action
              label={sound ? "Clicks on" : "Clicks off"}
              onPress={() => settings({ dialSound: !sound })}
            />
          </Row>
          <Body muted style={{ textAlign: "center", fontSize: 13 }}>
            Turn the rim to adjust. One tick = {step}{" "}
            {unit === "minutes" ? "minute" : "second"}.
          </Body>
          {!expanded && (
            <Action label="Close dial" onPress={() => setOpen(false)} />
          )}
        </>
      )}
    </View>
  );
}
