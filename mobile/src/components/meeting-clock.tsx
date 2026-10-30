import React from "react";
import { Pressable, Text, View, type ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../theme";
import { formatTime } from "../core/clock";
import { meetingView } from "../core/meeting";
import type { Config, Run } from "../core/types";

export function IconAction({
  icon,
  label,
  onPress,
  disabled = false,
  dark = false,
  style,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  onPress: () => void;
  disabled?: boolean;
  dark?: boolean;
  style?: ViewStyle;
}) {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      accessibilityState={{ disabled }}
      onPress={onPress}
      style={({ pressed }) => [
        {
          minWidth: 48,
          minHeight: 48,
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 12,
          opacity: disabled ? 0.35 : pressed ? 0.6 : 1,
        },
        style,
      ]}
    >
      <Ionicons name={icon} size={22} color={dark ? t.cream : t.teal} />
    </Pressable>
  );
}
export function MeetingClock({
  config,
  run,
  now,
  onNext,
  onToggle,
  onUndo,
  onReset,
  onExtend,
  onFocus,
  focus = false,
}: {
  config: Config;
  run: Run | null;
  now: number;
  onNext: () => void;
  onToggle: () => void;
  onUndo: () => void;
  onReset: () => void;
  onExtend: () => void;
  onFocus?: () => void;
  focus?: boolean;
}) {
  const t = useTheme(),
    v = meetingView(config, run, now),
    done = run?.status === "done",
    over = v.remaining < 0;
  const state = done
    ? "COMPLETE"
    : !run
      ? "READY"
      : run.status === "paused"
        ? "PAUSED"
        : over
          ? "OVER TIME"
          : "NOW";
  const mainLabel = done
    ? "New meeting"
    : !run
      ? "Start meeting"
      : v.pending.length
        ? "Next speaker"
        : "Finish meeting";
  return (
    <View
      testID="meeting-clock"
      style={{
        backgroundColor: t.clock,
        borderRadius: focus ? 0 : 16,
        padding: focus ? 28 : 20,
        gap: focus ? 24 : 14,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          minHeight: focus ? 48 : 28,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: over ? t.salmon : t.bright,
            }}
          />
          <Text
            style={{
              fontFamily: "Manrope",
              color: over ? t.salmon : t.clockMuted,
              fontSize: 12,
            }}
          >
            {state}
            {run && !done
              ? ` · ${v.done.size + 1}/${config.agenda.length}`
              : ""}
          </Text>
        </View>
        {onFocus ? (
          <IconAction
            icon={focus ? "contract-outline" : "expand-outline"}
            label={focus ? "Close focus view" : "Open focus view"}
            dark
            onPress={onFocus}
            style={
              focus ? undefined : { position: "absolute", right: -8, top: -10 }
            }
          />
        ) : (
          <Text style={{ color: t.clockMuted, fontSize: 12 }}>
            slot {formatTime(v.available)}
          </Text>
        )}
      </View>
      <Text
        testID="current-speaker"
        accessibilityRole="header"
        style={{
          fontFamily: "Cantata",
          fontSize: focus ? 34 : 25,
          lineHeight: focus ? 46 : 36,
          color: t.cream,
        }}
      >
        {done ? "Meeting finished" : (v.current?.name ?? "Add a speaker")}
      </Text>
      <Text
        testID="meeting-remaining"
        accessibilityLabel={`Time remaining ${formatTime(v.remaining)}`}
        selectable
        adjustsFontSizeToFit
        numberOfLines={1}
        style={{
          fontFamily: "Manrope",
          fontSize: focus ? 128 : 80,
          lineHeight: focus ? 150 : 92,
          fontWeight: "600",
          color: over ? t.salmon : t.cream,
          letterSpacing: -2,
          fontVariant: ["tabular-nums"],
        }}
      >
        {formatTime(done ? v.elapsed : v.remaining)}
      </Text>
      <View
        accessibilityRole="progressbar"
        accessibilityLabel="Current turn elapsed"
        accessibilityValue={{
          min: 0,
          max: 100,
          now: Math.round(v.progress * 100),
        }}
        style={{
          height: 9,
          backgroundColor: t.clockTrack,
          borderRadius: 3,
          overflow: "hidden",
        }}
      >
        <View
          style={{
            height: 9,
            width: `${v.progress * 100}%`,
            backgroundColor: over ? t.salmon : t.bright,
          }}
        />
      </View>
      <View
        testID="meeting-cells"
        style={{ flexDirection: "row", gap: 3, height: 7, marginTop: -10 }}
      >
        {v.rows.map((a) => (
          <View
            key={a.id}
            accessible
            accessibilityLabel={`${a.name}, ${a.state}, ${formatTime(a.seconds * 1000)} planned`}
            style={{
              flex: Math.max(a.seconds, 30),
              backgroundColor: a.state === "done" ? t.bright : t.clockTrack,
              borderRadius: 1,
              overflow: "hidden",
            }}
          >
            {a.state === "current" && (
              <View
                style={{
                  width: `${v.progress * 100}%`,
                  height: 7,
                  backgroundColor: t.bright,
                }}
              />
            )}
          </View>
        ))}
      </View>
      <View style={{ gap: 4, minHeight: 48 }}>
        <Text
          testID="next-speaker"
          style={{ fontFamily: "Manrope", color: t.cream, fontSize: 16 }}
        >
          {done
            ? `${formatTime(v.elapsed)} elapsed`
            : v.next
              ? `Next: ${v.next.name}`
              : "Last one. Make it count."}
        </Text>
        <Text
          testID="next-budget"
          style={{ color: t.clockMuted, fontSize: 13, lineHeight: 20 }}
        >
          {done
            ? `${formatTime(v.total)} planned`
            : v.next
              ? `gets ${formatTime(v.nextBudget)}${run ? " if you stop now" : ""} · ${v.pending.length} remaining`
              : "Your shared finish stays in view."}
        </Text>
      </View>
      <View style={{ flexDirection: "row", gap: 8 }}>
        <Pressable
          testID="meeting-next"
          accessibilityRole="button"
          accessibilityLabel={mainLabel}
          onPress={done ? onReset : onNext}
          style={({ pressed }) => ({
            flex: 1,
            minHeight: 52,
            borderRadius: 10,
            backgroundColor: t.cream,
            paddingHorizontal: 16,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
            opacity: pressed ? 0.75 : 1,
          })}
        >
          <Text
            style={{
              color: t.onSignal,
              fontSize: 15,
              fontFamily: "Manrope",
              fontWeight: "700",
            }}
          >
            {mainLabel}
          </Text>
          <Ionicons
            name={done ? "refresh" : "arrow-forward"}
            size={19}
            color={t.onSignal}
          />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            run?.status === "paused" ? "Resume meeting" : "Pause meeting"
          }
          disabled={!run || done}
          onPress={onToggle}
          style={({ pressed }) => ({
            minWidth: 58,
            minHeight: 52,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 10,
            borderColor: t.clockLine,
            borderWidth: 1,
            opacity: !run || done ? 0.35 : pressed ? 0.6 : 1,
          })}
        >
          <Ionicons
            name={run?.status === "paused" ? "play" : "pause"}
            size={23}
            color={t.cream}
          />
        </Pressable>
      </View>
      <View style={{ flexDirection: "row", gap: 8 }}>
        {[
          {
            label: "Undo",
            icon: "arrow-undo-outline",
            onPress: onUndo,
            disabled: !run?.entries.length,
          },
          {
            label: "+1 min",
            icon: "add",
            onPress: onExtend,
            disabled: !run || done,
          },
          {
            label: "Reset",
            icon: "refresh-outline",
            onPress: onReset,
            disabled: !run,
          },
        ].map((action) => (
          <Pressable
            key={action.label}
            accessibilityRole="button"
            accessibilityLabel={
              action.label === "+1 min"
                ? "Extend current turn by one minute"
                : action.label
            }
            accessibilityState={{ disabled: !!action.disabled }}
            disabled={action.disabled}
            onPress={action.onPress}
            style={({ pressed }) => ({
              flex: 1,
              minHeight: 48,
              gap: 6,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor:
                action.label === "Reset" ? t.salmon : "transparent",
              borderWidth: action.label === "Reset" ? 0 : 1,
              borderColor: t.clockLine,
              borderRadius: 10,
              opacity: action.disabled ? 0.35 : pressed ? 0.6 : 1,
            })}
          >
            <Ionicons
              name={
                action.icon as React.ComponentProps<typeof Ionicons>["name"]
              }
              size={16}
              color={action.label === "Reset" ? t.onSignal : t.cream}
            />
            <Text
              style={{
                color: action.label === "Reset" ? t.onSignal : t.cream,
                fontSize: 13,
                fontFamily: "Manrope",
                fontWeight: "600",
              }}
            >
              {action.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
