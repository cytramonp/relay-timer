import React, { memo, useEffect, useState } from "react";
import { Platform, Pressable, Text, TextInput, View } from "react-native";
import { MenuView } from "@expo/ui/community/menu";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  withSpring,
  type SharedValue,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { formatTime } from "../core/clock";
import type { Slot } from "../core/types";
import { metrics, useTheme } from "../theme";

export type DragState = {
  index: SharedValue<number>;
  target: SharedValue<number>;
  dy: SharedValue<number>;
  pointer: SharedValue<number>;
  scroll: SharedValue<number>;
  originScroll: SharedValue<number>;
};
export const AgendaRow = memo(function AgendaRow({
  item,
  index,
  count,
  state,
  available,
  drag,
  onMove,
  onRename,
  onDuration,
  onMenu,
  onDrag,
}: {
  item: Slot;
  index: number;
  count: number;
  state: string;
  available: number;
  drag: DragState;
  onMove: (from: number, to: number) => void;
  onRename: (id: string, name: string) => void;
  onDuration: (id: string) => void;
  onMenu: (id: string, action: string) => void;
  onDrag: (active: boolean) => void;
}) {
  const t = useTheme(),
    reduced = useReducedMotion(),
    [name, setName] = useState(item.name),
    [menu, setMenu] = useState(false);
  useEffect(() => setName(item.name), [item.name]);
  const pan = Gesture.Pan()
    .minDistance(3)
    .onStart((e) => {
      drag.index.value = index;
      drag.target.value = index;
      drag.originScroll.value = drag.scroll.value;
      drag.pointer.value = e.absoluteY;
      runOnJS(onDrag)(true);
    })
    .onUpdate((e) => {
      drag.dy.value =
        e.translationY + drag.scroll.value - drag.originScroll.value;
      drag.pointer.value = e.absoluteY;
      drag.target.value = Math.max(
        0,
        Math.min(count - 1, Math.round(index + drag.dy.value / metrics.row)),
      );
    })
    .onEnd(() => {
      runOnJS(onMove)(index, drag.target.value);
    })
    .onFinalize(() => {
      drag.index.value = -1;
      drag.target.value = -1;
      drag.dy.value = 0;
      drag.pointer.value = -1;
      runOnJS(onDrag)(false);
    });
  const style = useAnimatedStyle(() => {
    const active = drag.index.value === index;
    const offset =
      drag.index.value < index && drag.target.value >= index
        ? -metrics.row
        : drag.index.value > index &&
            drag.target.value <= index &&
            drag.target.value >= 0
          ? metrics.row
          : 0;
    return {
      zIndex: active ? 20 : 0,
      transform: [
        {
          translateY: active
            ? drag.dy.value
            : reduced
              ? offset
              : withSpring(offset, { duration: 400, dampingRatio: 1 }),
        },
        { scale: active && !reduced ? 1.02 : 1 },
      ],
      opacity: active ? 0.96 : 1,
    };
  });
  const actions = [
    { id: "up", title: "Move up", attributes: { disabled: index === 0 } },
    {
      id: "down",
      title: "Move down",
      attributes: { disabled: index === count - 1 },
    },
    {
      id: "pin",
      title: item.pinned ? "Unpin duration" : "Pin duration",
      attributes: { disabled: state === "done" },
    },
    {
      id: "remove",
      title: "Remove",
      attributes: {
        disabled: state === "current" || state === "done" || count < 2,
        destructive: true,
      },
    },
  ];
  const trigger = (
    <View
      accessible
      accessibilityLabel={`Actions for ${item.name}`}
      style={{
        width: 40,
        minHeight: 48,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Ionicons name="ellipsis-horizontal" size={21} color={t.muted} />
    </View>
  );
  return (
    <Animated.View
      testID={`agenda-row-${index}`}
      style={[
        {
          height: metrics.row,
          backgroundColor: state === "current" ? t.soft : t.bg,
          borderBottomWidth: 1,
          borderColor: t.line,
          borderRadius: state === "current" ? 10 : 0,
          justifyContent: "center",
        },
        style,
      ]}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
        <GestureDetector gesture={pan}>
          <View
            testID={`drag-handle-${index}`}
            accessible
            accessibilityRole="adjustable"
            accessibilityLabel={`Reorder ${item.name}`}
            accessibilityHint="Drag to move. Or use accessibility actions."
            accessibilityActions={[
              { name: "increment", label: "Move down" },
              { name: "decrement", label: "Move up" },
            ]}
            onAccessibilityAction={(e) =>
              onMove(
                index,
                Math.max(
                  0,
                  Math.min(
                    count - 1,
                    index + (e.nativeEvent.actionName === "increment" ? 1 : -1),
                  ),
                ),
              )
            }
            style={{
              minHeight: 56,
              width: 40,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="reorder-two-outline" size={25} color={t.muted} />
          </View>
        </GestureDetector>
        <View style={{ flex: 1, minWidth: 0, gap: 1 }}>
          <TextInput
            testID={`agenda-name-${index}`}
            accessibilityLabel={`Name for slot ${index + 1}`}
            value={name}
            maxLength={120}
            onChangeText={setName}
            onEndEditing={() => onRename(item.id, name.trim() || item.name)}
            onBlur={Platform.OS === "web" ? () => onRename(item.id, name.trim() || item.name) : undefined}
            selectTextOnFocus
            style={{
              color: t.ink,
              fontFamily: "Manrope",
              fontSize: 15,
              minHeight: 44,
              paddingHorizontal: 4,
              paddingVertical: 8,
              backgroundColor: state === "current" ? t.soft : t.bg,
            }}
          />
          <Text
            numberOfLines={1}
            style={{
              fontSize: 11,
              color: state === "current" ? t.teal : t.muted,
              paddingLeft: 4,
            }}
          >
            {state === "current"
              ? "Speaking now"
              : state === "done"
                ? "Finished"
                : item.kind === "topic"
                  ? "Topic"
                  : "Participant"}
            {item.pinned ? " · pinned" : ""}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Edit minutes for ${item.name}, ${formatTime(item.seconds * 1000)} planned`}
          disabled={state === "done"}
          onPress={() => onDuration(item.id)}
          style={({ pressed }) => ({
            width: 72,
            minHeight: 58,
            justifyContent: "center",
            alignItems: "flex-end",
            gap: 5,
            opacity: pressed ? 0.65 : 1,
          })}
        >
          <Text
            style={{
              color: t.ink,
              fontFamily: "Manrope",
              fontWeight: "600",
              fontSize: 15,
              fontVariant: ["tabular-nums"],
            }}
          >
            {formatTime(item.seconds * 1000)}
          </Text>
          <Text
            style={{
              color: state === "current" ? t.teal : t.muted,
              fontSize: 11,
              fontVariant: ["tabular-nums"],
            }}
          >
            {state === "done" || state === "current" ? "used " : "gets "}
            {formatTime(Math.max(0, available))}
          </Text>
        </Pressable>
        {Platform.OS === "web" ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Actions for ${item.name}`}
            onPress={() => setMenu(!menu)}
          >
            {trigger}
          </Pressable>
        ) : (
          <MenuView
            actions={actions}
            onPressAction={({ nativeEvent }) =>
              onMenu(item.id, nativeEvent.event)
            }
            shouldOpenOnLongPress={false}
          >
            {trigger}
          </MenuView>
        )}
      </View>
      {menu && (
        <View
          style={{
            position: "absolute",
            top: 78,
            right: 0,
            backgroundColor: t.panel,
            padding: 8,
            zIndex: 30,
            borderWidth: 1,
            borderColor: t.line,
          }}
        >
          {actions.map((a) => (
            <Pressable
              key={a.id}
              disabled={a.attributes?.disabled}
              onPress={() => {
                setMenu(false);
                onMenu(item.id, a.id);
              }}
              style={{ minHeight: 48, padding: 12 }}
            >
              <Text
                style={{ color: a.attributes?.disabled ? t.muted : t.teal }}
              >
                {a.title}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
    </Animated.View>
  );
});
