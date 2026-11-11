import { useTranslate } from "../state/language";
import { CustomizationGate } from "../components/plan-status";
import React, { useState } from "react";
import { Stack, router, useLocalSearchParams } from "expo-router";
import {
  Action,
  Body,
  Field,
  Heading,
  Page,
  Row,
  Toggle,
} from "../components/ui";
import { useApp } from "../state/app-store";
import { allocate, editDuration } from "../core/meeting";
import { DurationField } from "../components/duration-field";

export default function SlotSheet() {
  const tr = useTranslate();
  const { id } = useLocalSearchParams<{ id: string }>(),
    { store, editMeeting } = useApp();
  const run =
      store.run?.kind === "meeting" && store.run.status !== "done"
        ? store.run
        : null,
    c = run?.config ?? store.drafts.meeting,
    slot = c.agenda.find((a) => a.id === id);
  const [minutes, setMinutes] = useState(String((slot?.seconds ?? 0) / 60)),
    [name, setName] = useState(slot?.name ?? ""),
    [pinned, setPinned] = useState(!!slot?.pinned),
    [topic, setTopic] = useState(slot?.kind === "topic"),
    [error, setError] = useState("");
  function save() {
    try {
      if (!slot) throw Error("This slot no longer exists.");
      if (!minutes.trim()) throw Error("Enter a duration in minutes.");
      let next = editDuration(c, run, id, Number(minutes) * 60);
      next = {
        ...next,
        agenda: next.agenda.map((a) =>
          a.id === id
            ? {
                ...a,
                name: name.trim() || a.name,
                pinned,
                kind: topic ? "topic" : "person",
              }
            : a,
        ),
      };
      if (!pinned && c.autoSplit) next = allocate(next, run);
      editMeeting(next);
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Check this duration.");
    }
  }
  return (
    <Page>
      <CustomizationGate>
        <Stack.Screen
          options={{
            title: tr("Edit turn"),
            presentation: "formSheet",
            headerRight: () => <Action label={tr("Done")} onPress={save} />,
          }}
        />
        <Heading>{slot?.name ?? tr("Turn removed")}</Heading>
        <Body muted>
          {tr(
            "Durations use minutes. With proportions on, other unfinished slots absorb the change.",
          )}
        </Body>
        <Field
          label={tr("Speaker or topic")}
          value={name}
          onChangeText={setName}
          containerStyle={{ flexGrow: 0, flexBasis: "auto" }}
        />
        <DurationField
          label={tr("Duration · minutes")}
          unit="minutes"
          expanded
          value={minutes}
          onChangeText={(value) => {
            setMinutes(value);
            setPinned(true);
          }}
        />
        <Row>
          {[1, 2, 3, 5, 8, 10].map((m) => (
            <Action
              key={m}
              label={tr("{0} min", String(m))}
              onPress={() => {
                setMinutes(String(m));
                setPinned(true);
              }}
            />
          ))}
        </Row>
        <Toggle
          label={tr("Topic rather than participant")}
          value={topic}
          onChange={setTopic}
        />
        <Toggle
          label={tr("Pin this duration during automatic split")}
          value={pinned}
          onChange={setPinned}
        />
        {error ? <Body>{error}</Body> : null}
        <Action label={tr("Apply changes")} tone="primary" onPress={save} />
      </CustomizationGate>
    </Page>
  );
}
