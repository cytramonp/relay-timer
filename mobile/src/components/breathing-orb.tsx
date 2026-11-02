import React, { memo, useEffect } from "react";
import Animated, {
  cancelAnimation,
  Easing,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { timerNow } from "../services/timer-clock";
import { elapsed, type Card } from "../core/board-engine";
import { useTheme } from "../theme";

export const BreathingOrb = memo(function BreathingOrb({
  card,
}: {
  card: Card;
}) {
  const t = useTheme(),
    phase = card.stages[card.index];
  const scale = useSharedValue(0.55);
  useEffect(() => {
    const progress = Math.min(
      1,
      elapsed(card, timerNow()) / Math.max(1, phase.seconds * 1000),
    );
    const inhale = /inhale/i.test(phase.name),
      exhale = /exhale/i.test(phase.name);
    scale.set(
      inhale ? 0.55 + 0.45 * progress : exhale ? 1 - 0.45 * progress : 1,
    );
    if (card.anchor !== null && !card.done && (inhale || exhale))
      scale.set(
        withTiming(inhale ? 1 : 0.55, {
          duration: Math.max(
            0,
            phase.seconds * 1000 - elapsed(card, timerNow()),
          ),
          easing: Easing.linear,
          reduceMotion: ReduceMotion.System,
        }),
      );
    return () => {
      cancelAnimation(scale);
    };
    // Elapsed is read once at each start/pause/phase handoff; the UI thread animates between them.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    card.index,
    card.anchor,
    card.elapsed,
    card.done,
    phase.name,
    phase.seconds,
    scale,
  ]);
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.get() }],
  }));
  return (
    <Animated.View
      accessibilityLabel={phase.name}
      style={[
        {
          width: 90,
          height: 90,
          borderRadius: 45,
          backgroundColor: t.bright,
          alignSelf: "center",
        },
        style,
      ]}
    />
  );
});
