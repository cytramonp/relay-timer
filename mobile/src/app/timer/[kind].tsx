import React from "react";
import { useLocalSearchParams } from "expo-router";
import { isKind } from "../../core/backup";
import { TimerScreen } from "../../screens/timer";
import { Body, Page } from "../../components/ui";
export default function TimerRoute() {
  const { kind } = useLocalSearchParams<{ kind: string }>();
  return isKind(kind) ? (
    <TimerScreen kind={kind} />
  ) : (
    <Page>
      <Body>This timer does not exist. Go back to Timers.</Body>
    </Page>
  );
}
