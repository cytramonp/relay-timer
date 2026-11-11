import { useTranslate } from "../../state/language";
import React from "react";
import { useLocalSearchParams } from "expo-router";
import { isKind } from "../../core/backup";
import { TimerScreen } from "../../screens/timer";
import { MeetingScreen } from "../../screens/meeting";
import { Body, Page } from "../../components/ui";
export default function TimerRoute() {
  const tr = useTranslate();
  const { kind } = useLocalSearchParams<{ kind: string }>();
  return kind === "meeting" ? (
    <MeetingScreen />
  ) : isKind(kind) ? (
    <TimerScreen kind={kind} />
  ) : (
    <Page>
      <Body>{tr("This timer does not exist. Go back to Timers.")}</Body>
    </Page>
  );
}
