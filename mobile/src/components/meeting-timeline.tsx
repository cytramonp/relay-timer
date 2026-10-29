import React, { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { meetingView, totalSeconds } from "../core/meeting";
import { formatTime } from "../core/clock";
import { useTheme } from "../theme";
import { IconAction } from "./meeting-clock";
import type { Config, Run } from "../core/types";

function Boundary({
  index,
  left,
  width,
  total,
  position,
  onChange,
  disabled,
}: {
  index: number;
  left: number;
  width: number;
  total: number;
  position: number;
  onChange: (index: number, position: number) => void;
  disabled: boolean;
}) {
  const t = useTheme(),
    dx = useSharedValue(0);
  const pan = Gesture.Pan()
    .enabled(!disabled)
    .minDistance(3)
    .onUpdate((e) => {
      dx.value = e.translationX;
    })
    .onEnd((e) => {
      runOnJS(onChange)(index, position + (e.translationX / width) * total);
    })
    .onFinalize(() => {
      dx.value = 0;
    });
  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: dx.value }],
  }));
  return (
    <GestureDetector gesture={pan}>
      <Animated.View
        testID={`boundary-${index}`}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={`Resize boundary after slot ${index + 1}`}
        accessibilityHint="Drag left or right to adjust planned time"
        accessibilityActions={[
          { name: "increment", label: "Add 15 seconds" },
          { name: "decrement", label: "Remove 15 seconds" },
        ]}
        onAccessibilityAction={(e) =>
          onChange(
            index,
            position + (e.nativeEvent.actionName === "increment" ? 15 : -15),
          )
        }
        style={[
          {
            position: "absolute",
            left: left - 24,
            width: 48,
            top: -4,
            height: 60,
            zIndex: 4,
            alignItems: "center",
            justifyContent: "center",
            opacity: disabled ? 0.35 : 1,
          },
          style,
        ]}
      >
        <View
          style={{
            width: 4,
            height: 31,
            backgroundColor: t.teal,
            borderRadius: 2,
          }}
        />
        <View
          style={{
            position: "absolute",
            width: 12,
            height: 12,
            borderRadius: 6,
            backgroundColor: t.panel,
            borderWidth: 2,
            borderColor: t.teal,
          }}
        />
      </Animated.View>
    </GestureDetector>
  );
}
function ClockCursor({
  at,
  scale,
  width,
  onSeek,
}: {
  at: number;
  scale: number;
  width: number;
  onSeek: (ms: number) => void;
}) {
  const t = useTheme(),
    dx = useSharedValue(0),
    left = Math.min(1, at / scale) * width;
  const pan = Gesture.Pan()
    .minDistance(3)
    .onUpdate((e) => {
      dx.value = e.translationX;
    })
    .onEnd((e) => {
      runOnJS(onSeek)(
        Math.max(0, Math.min(scale, at + (e.translationX / width) * scale)),
      );
    })
    .onFinalize(() => {
      dx.value = 0;
    });
  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: dx.value }],
  }));
  return (
    <GestureDetector gesture={pan}>
      <Animated.View
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel="Correct meeting clock"
        accessibilityHint="Drag to adjust elapsed time without changing recorded turns"
        accessibilityValue={{
          min: 0,
          max: Math.ceil(scale / 1000),
          now: Math.floor(at / 1000),
        }}
        accessibilityActions={[
          { name: "increment", label: "Forward 30 seconds" },
          { name: "decrement", label: "Back 30 seconds" },
        ]}
        onAccessibilityAction={(e) =>
          onSeek(
            at + (e.nativeEvent.actionName === "increment" ? 30000 : -30000),
          )
        }
        style={[
          {
            position: "absolute",
            top: 56,
            left: left - 24,
            height: 48,
            width: 48,
            zIndex: 5,
          },
          style,
        ]}
      >
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: -56,
            left: 24,
            height: 74,
            width: 1,
            backgroundColor: t.red,
          }}
        />
        <View
          pointerEvents="none"
          style={{
            width: 12,
            height: 12,
            borderRadius: 6,
            backgroundColor: t.red,
            marginLeft: 18,
          }}
        />
      </Animated.View>
    </GestureDetector>
  );
}
export function MeetingTimeline({
  config,
  run,
  now,
  onBoundary,
  onClock,
  onSeek,
}: {
  config: Config;
  run: Run | null;
  now: number;
  onBoundary: (i: number, position: number) => void;
  onClock: (seconds: number) => void;
  onSeek: (ms: number) => void;
}) {
  const t = useTheme(),
    v = meetingView(config, run, now),
    [container, setContainer] = useState(0);
  const width = Math.max(container, Math.min(1000, config.agenda.length * 77)),
    scale = Math.max(v.total, v.elapsed, 1);
  return (
    <View
      testID="meeting-timeline"
      style={{ gap: 14 }}
      onLayout={(e) => setContainer(e.nativeEvent.layout.width)}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        <Text
          accessibilityRole="header"
          style={{ fontFamily: "Cantata", fontSize: 21, color: t.ink }}
        >
          Meeting timeline
        </Text>
        <Text
          style={{
            color: t.muted,
            fontSize: 12,
            fontVariant: ["tabular-nums"],
          }}
        >
          {formatTime(v.elapsed)} / {formatTime(v.total)}
        </Text>
      </View>
      <Text style={{ fontSize: 12, color: t.muted, lineHeight: 18 }}>
        Drag a handle to change the plan. Swipe the track to see every slot.
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator
        contentContainerStyle={{ paddingTop: 5, paddingBottom: 15 }}
      >
        <View style={{ width, gap: 7 }}>
          <View
            style={{
              flexDirection: "row",
              height: 48,
              gap: 2,
              width: (v.total / scale) * width,
            }}
          >
            {v.rows.map((a, i) => (
              <View
                key={a.id}
                accessible
                accessibilityLabel={`${a.name}, ${formatTime(a.seconds * 1000)} planned, ${a.state}`}
                style={{
                  flex: Math.max(a.seconds, 1),
                  backgroundColor:
                    a.state === "done"
                      ? t.soft
                      : a.state === "current"
                        ? t.teal
                        : t.panel,
                  overflow: "hidden",
                  borderRadius: 5,
                  justifyContent: "center",
                  paddingHorizontal: 5,
                }}
              >
                <Text
                  numberOfLines={1}
                  style={{
                    fontSize: 11,
                    fontFamily: "Manrope",
                    color: a.state === "current" ? t.onTeal : t.ink,
                  }}
                >
                  {i + 1} {a.name}
                </Text>
                <Text
                  numberOfLines={1}
                  style={{
                    fontSize: 10,
                    color: a.state === "current" ? t.onTeal : t.muted,
                  }}
                >
                  {formatTime(a.seconds * 1000)}
                </Text>
              </View>
            ))}
          </View>
          {config.agenda.slice(0, -1).map((a, i) => {
            const sum = totalSeconds(config.agenda.slice(0, i + 1));
            return (
              <Boundary
                key={a.id}
                index={i}
                left={((sum * 1000) / scale) * width}
                position={sum}
                width={width}
                total={scale / 1000}
                onChange={onBoundary}
                disabled={
                  !!run &&
                  (v.done.has(a.id) || v.done.has(config.agenda[i + 1].id))
                }
              />
            );
          })}
          <View
            accessibilityLabel="Actual time used"
            style={{
              flexDirection: "row",
              height: 18,
              borderRadius: 4,
              backgroundColor: t.line,
              overflow: "hidden",
            }}
          >
            {(run?.entries ?? []).map((entry, i) => (
              <View
                key={i}
                style={{
                  width: `${(entry.actual / scale) * 100}%`,
                  height: 18,
                  backgroundColor:
                    entry.actual > entry.planned ? t.salmon : t.bright,
                  borderRightWidth: 2,
                  borderRightColor: t.bg,
                }}
              />
            ))}
            {run && run.status !== "done" && (
              <View
                style={{
                  width: `${(Math.max(0, v.elapsed - run.phaseStart) / scale) * 100}%`,
                  height: 18,
                  backgroundColor: t.teal,
                }}
              />
            )}
          </View>
          {run && run.status !== "done" && (
            <ClockCursor
              at={v.elapsed}
              scale={scale}
              width={width}
              onSeek={onSeek}
            />
          )}
          {run && run.status === "done" && (
            <View
              pointerEvents="none"
              style={{
                position: "absolute",
                left:
                  Math.min(1, v.elapsed / Math.max(v.total, v.elapsed, 1)) *
                  width,
                top: 0,
                height: 73,
                width: 1,
                backgroundColor: t.red,
              }}
            />
          )}
          <View
            style={{ flexDirection: "row", justifyContent: "space-between" }}
          >
            {[0, 0.25, 0.5, 0.75, 1].map((p) => (
              <Text key={p} style={{ fontSize: 11, color: t.muted }}>
                {formatTime(p * scale)}
              </Text>
            ))}
          </View>
        </View>
      </ScrollView>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          flexWrap: "wrap",
        }}
      >
        <View style={{ flex: 1, minWidth: 140 }}>
          <Text style={{ fontSize: 12, color: t.muted }}>
            Plan above · actual below
          </Text>
          <Text style={{ fontSize: 12, color: t.muted }}>
            Teal: early · coral: over
          </Text>
        </View>
        <IconAction
          icon="remove"
          label="Move meeting clock back one minute"
          disabled={!run || run.status === "done"}
          onPress={() => onClock(-60)}
        />
        <IconAction
          icon="add"
          label="Move meeting clock forward one minute"
          disabled={!run || run.status === "done"}
          onPress={() => onClock(60)}
        />
      </View>
    </View>
  );
}
