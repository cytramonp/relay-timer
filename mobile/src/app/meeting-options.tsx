import { useTranslate } from "../state/language";
import { CustomizationGate } from "../components/plan-status";
import React, { useState } from "react";
import { Stack, router } from "expo-router";
import { Action, Body, Heading, Page, Row, Toggle } from "../components/ui";
import { useApp } from "../state/app-store";
import { allocate, totalSeconds } from "../core/meeting";
import { DurationField } from "../components/duration-field";

export default function MeetingOptions() {
  const tr = useTranslate();
  const { store, editMeeting } = useApp(),
    run =
      store.run?.kind === "meeting" && store.run.status !== "done"
        ? store.run
        : null,
    original = run?.config ?? store.drafts.meeting;
  const [c, setC] = useState(original),
    [total, setTotal] = useState(
      String((c.autoSplit ? c.total : totalSeconds(c.agenda)) / 60),
    ),
    [minimum, setMinimum] = useState(String(c.minimum)),
    [warning, setWarning] = useState(String(c.warning)),
    [error, setError] = useState("");
  function save() {
    try {
      const seconds = Number(total) * 60;
      if (
        !total.trim() ||
        !Number.isFinite(seconds) ||
        seconds < 15 ||
        seconds > 17280000
      )
        throw Error("Enter a positive meeting total, at least 15 seconds.");
      if (
        !minimum.trim() ||
        !warning.trim() ||
        !Number.isFinite(Number(minimum)) ||
        !Number.isFinite(Number(warning))
      )
        throw Error("Fill in the minimum and warning durations.");
      editMeeting(
        allocate(
          { ...c, minimum: Number(minimum), warning: Number(warning) },
          run,
          seconds,
        ),
      );
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Check your meeting settings.");
    }
  }
  return (
    <Page>
      <CustomizationGate>
        <Stack.Screen
          options={{
            title: tr("Timing settings"),
            presentation: "formSheet",
            headerRight: () => <Action label={tr("Done")} onPress={save} />,
          }}
        />
        <Heading>{tr("One shared finish.")}</Heading>
        <DurationField
          label={tr("Total meeting · minutes")}
          unit="minutes"
          expanded
          value={total}
          onChangeText={setTotal}
        />
        <Toggle
          label={tr("Split participants' time equally")}
          value={c.autoSplit}
          onChange={(autoSplit) => setC({ ...c, autoSplit })}
        />
        <Body muted>
          {tr(
            "Topics, pinned durations and completed turns stay fixed. Other participants share the remaining budget.",
          )}
        </Body>
        <Toggle
          label={tr("Keep proportions when changing durations")}
          value={c.keepProp}
          onChange={(keepProp) => setC({ ...c, keepProp })}
        />
        <DurationField
          label={tr("Minimum turn · seconds")}
          value={minimum}
          onChangeText={setMinimum}
        />
        <DurationField
          label={tr("Warning before time is up · seconds")}
          value={warning}
          onChangeText={setWarning}
        />
        <Toggle
          label={tr("Automatically move to the next speaker")}
          value={c.automatic}
          onChange={(automatic) => setC({ ...c, automatic })}
        />
        <Body muted>
          {tr(
            "With automatic advance off, the clock keeps counting overtime until the host chooses Next.",
          )}
        </Body>
        <Heading>{tr("Sound")}</Heading>
        <Row>
          {(["off", "bell", "gong", "beep"] as const).map((sound) => (
            <Action
              key={sound}
              label={sound === "off" ? tr("Silent") : sound}
              tone={c.sound === sound ? "primary" : "outline"}
              onPress={() => setC({ ...c, sound })}
            />
          ))}
        </Row>
        <Toggle
          label={tr("Spoken cues while the app is open")}
          value={c.voice}
          onChange={(voice) => setC({ ...c, voice })}
        />
        {error ? <Body>{error}</Body> : null}
        <Action label={tr("Save settings")} tone="primary" onPress={save} />
      </CustomizationGate>
    </Page>
  );
}
