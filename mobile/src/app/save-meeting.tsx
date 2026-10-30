import { CustomizationGate } from "../components/plan-status";
import React, { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { Action, Body, Field, Heading, Page, Row } from "../components/ui";
import { useApp } from "../state/app-store";
import { useTheme } from "../theme";
import type { Program } from "../core/types";
import { validateConfig } from "../core/backup";
import * as Crypto from "expo-crypto";
import { DurationField } from "../components/duration-field";
export default function SaveMeeting() {
  const { id } = useLocalSearchParams<{ id?: string }>(),
    { store, saveProgram, reviseProgram } = useApp(),
    original = store.programs.find((p) => p.id === id),
    t = useTheme();
  const [name, setName] = useState(
      original?.name ?? store.drafts.meeting.title,
    ),
    [color, setColor] = useState<Program["color"]>(original?.color ?? "mint"),
    [icon, setIcon] = useState<Program["icon"]>(original?.icon ?? "people"),
    [error, setError] = useState("");
  const [plan, setPlan] = useState(
    original?.config ??
      (store.run?.kind === "meeting" ? store.run.config : store.drafts.meeting),
  );
  const [timings, setTimings] = useState<Record<string, string>>(() =>
    Object.fromEntries(plan.agenda.map((a) => [a.id, String(a.seconds / 60)])),
  );
  function save() {
    if (!name.trim()) {
      setError("Give this template a name.");
      return;
    }
    try {
      const agenda = plan.agenda.map((a) => {
        if (!(timings[a.id] ?? "").trim())
          throw Error("Fill in each slot's duration.");
        return { ...a, seconds: Number(timings[a.id]) * 60 };
      });
      const config = validateConfig("meeting", {
        ...plan,
        title: name.trim(),
        agenda,
        total: agenda.reduce((n, a) => n + a.seconds, 0),
      });
      const saved = original
        ? reviseProgram({ ...original, name: name.trim(), color, icon, config })
        : saveProgram("meeting", name, { color, icon }, config);
      if (saved) router.back();
      else setError("Could not save this template. Your edits are still here.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Check this plan.");
    }
  }
  return (
    <Page>
      <CustomizationGate>
        <Stack.Screen
          options={{
            title: original ? "Edit template" : "Save template",
            presentation: "formSheet",
            headerRight: () => <Action label="Save" onPress={save} />,
          }}
        />
        <Heading>Make it your own.</Heading>
        <Field
          label="Template name"
          value={name}
          onChangeText={setName}
          autoFocus
        />
        <Body muted>
          A reusable plan contains timing and participants. Session results,
          notes and private follow-ups are kept separate.
        </Body>
        <Heading>Color</Heading>
        <Row>
          {(["citron", "peach", "lilac", "mint"] as const).map((value) => (
            <Pressable
              key={value}
              accessibilityRole="button"
              accessibilityLabel={value}
              accessibilityState={{ selected: color === value }}
              onPress={() => setColor(value)}
              style={{
                width: 60,
                height: 52,
                borderRadius: 12,
                backgroundColor: t[value],
                borderWidth: color === value ? 2 : 0,
                borderColor: t.teal,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Text style={{ color: t.onSignal }}>
                {color === value ? "Selected" : value}
              </Text>
            </Pressable>
          ))}
        </Row>
        <Heading>Icon</Heading>
        <Row>
          {(
            ["people", "loop", "grid", "spark", "focus", "coffee"] as const
          ).map((value) => (
            <Action
              key={value}
              label={value}
              tone={icon === value ? "primary" : "outline"}
              onPress={() => setIcon(value)}
            />
          ))}
        </Row>
        <Heading>The plan</Heading>
        {
          <View style={{ gap: 12 }}>
            {plan.agenda.map((a, i) => (
              <View
                key={a.id}
                style={{
                  gap: 10,
                  paddingVertical: 12,
                  borderBottomWidth: 1,
                  borderColor: t.line,
                }}
              >
                <Field
                  label={`Slot ${i + 1}`}
                  value={a.name}
                  onChangeText={(name) =>
                    setPlan({
                      ...plan,
                      agenda: plan.agenda.map((s) =>
                        s.id === a.id ? { ...s, name } : s,
                      ),
                    })
                  }
                />
                <DurationField
                  label="Minutes"
                  unit="minutes"
                  value={timings[a.id] ?? ""}
                  onChangeText={(value) =>
                    setTimings({ ...timings, [a.id]: value })
                  }
                />
                <Row>
                  <Action
                    label="Move up"
                    disabled={i === 0}
                    onPress={() => {
                      const agenda = [...plan.agenda];
                      [agenda[i - 1], agenda[i]] = [agenda[i], agenda[i - 1]];
                      setPlan({ ...plan, agenda });
                    }}
                  />
                  <Action
                    label="Move down"
                    disabled={i === plan.agenda.length - 1}
                    onPress={() => {
                      const agenda = [...plan.agenda];
                      [agenda[i + 1], agenda[i]] = [agenda[i], agenda[i + 1]];
                      setPlan({ ...plan, agenda });
                    }}
                  />
                  <Action
                    label="Remove"
                    disabled={plan.agenda.length < 2}
                    onPress={() =>
                      setPlan({
                        ...plan,
                        agenda: plan.agenda.filter((s) => s.id !== a.id),
                      })
                    }
                  />
                </Row>
              </View>
            ))}
            <Body muted>
              Only the reusable plan is saved. Existing session results stay
              unchanged.
            </Body>
          </View>
        }
        <Row>
          {(["person", "topic"] as const).map((kind) => (
            <Action
              key={kind}
              label={kind === "person" ? "Add speaker" : "Add topic"}
              disabled={plan.agenda.length >= 200}
              onPress={() => {
                const id = Crypto.randomUUID();
                setPlan({
                  ...plan,
                  agenda: [
                    ...plan.agenda,
                    {
                      id,
                      name: kind === "person" ? "New speaker" : "Discussion",
                      seconds: 120,
                      kind,
                    },
                  ],
                });
                setTimings({ ...timings, [id]: "2" });
              }}
            />
          ))}
        </Row>
        {error ? <Body>{error}</Body> : null}
        <Action
          label={original ? "Save template" : "Save current agenda"}
          tone="primary"
          onPress={save}
        />
      </CustomizationGate>
    </Page>
  );
}
