import { useTranslate } from "../state/language";
import { CustomizationGate } from "../components/plan-status";
import React, { useState } from "react";
import { Text, View } from "react-native";
import { router, Stack, useLocalSearchParams } from "expo-router";
import * as Crypto from "expo-crypto";
import {
  Action,
  Body,
  Field,
  Heading,
  Page,
  Row,
  Rule,
  Toggle,
} from "../components/ui";
import { useApp } from "../state/app-store";
import { useTheme } from "../theme";
import { catalog, presets } from "../core/catalog";
import { validateConfig } from "../core/backup";
import { playCue } from "../services/audio";
import type { Config, Kind } from "../core/types";
import { clone } from "../core/clone";
import { DurationField } from "../components/duration-field";

export function EditorScreen({ kind }: { kind: Kind }) {
  const tr = useTranslate();
  const { programId } = useLocalSearchParams<{ programId?: string }>();
  const { store, updateDraft, reviseProgram, notify } = useApp(),
    t = useTheme();
  const savedProgram = store.programs.find(
    (p) => p.id === programId && p.kind === kind,
  );
  const [config, setConfig] = useState<Config>(() =>
    clone(savedProgram?.config ?? store.drafts[kind]),
  );
  const [numbers, setNumbers] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      Object.entries(config)
        .filter(([, v]) => typeof v === "number")
        .map(([k, v]) => [k, String(v)]),
    ),
  );
  const [error, setError] = useState("");
  const [agendaMinutes, setAgendaMinutes] = useState<Record<string, string>>(
    {},
  );
  const patch = (value: Partial<Config>) => {
    setConfig((c) => ({ ...c, ...value }));
    setNumbers((n) => ({
      ...n,
      ...Object.fromEntries(
        Object.entries(value)
          .filter(([, v]) => typeof v === "number")
          .map(([k, v]) => [k, String(v)]),
      ),
    }));
  };
  const numeric = (key: keyof Config, label: string) =>
    label.includes("seconds") ? (
      <DurationField
        key={key}
        label={label}
        value={numbers[key] ?? ""}
        onChangeText={(v) => setNumbers((n) => ({ ...n, [key]: v }))}
      />
    ) : (
      <Field
        key={key}
        label={label}
        keyboardType="decimal-pad"
        inputMode="decimal"
        value={numbers[key] ?? ""}
        onChangeText={(v) => setNumbers((n) => ({ ...n, [key]: v }))}
      />
    );
  function done() {
    try {
      const converted = {
        ...config,
        agenda: config.agenda.map((slot) => {
          const minutes = agendaMinutes[slot.id];
          if (minutes === undefined) return slot;
          if (!minutes.trim()) throw Error("Fill in every turn duration.");
          return { ...slot, seconds: Number(minutes) * 60 };
        }),
        ...Object.fromEntries(
          Object.entries(numbers).map(([k, v]) => {
            if (!v.trim()) throw Error("Fill in all timing fields.");
            return [k, Number(v)];
          }),
        ),
      };
      const valid = validateConfig(kind, converted);
      if (savedProgram) {
        if (
          !reviseProgram({ ...savedProgram, name: valid.title, config: valid })
        )
          return;
      } else if (!updateDraft(kind, valid)) return;
      notify(tr("Setup saved for your next run."));
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Check your timer settings.");
    }
  }
  const interval = kind === "boxing" || kind === "fitness";
  return (
    <Page>
      <CustomizationGate>
        <Stack.Screen
          options={{
            title: tr(
              "{0} setup",
              String(catalog.find((c) => c.kind === kind)!.title),
            ),
            headerRight: () => (
              <Action label={tr("Done")} onPress={done} tone="primary" />
            ),
          }}
        />
        {store.run?.kind === kind && store.run.status !== "done" && (
          <Body muted>
            {tr(
              "These changes apply to the next run. Reset the active timer to use the new setup.",
            )}
          </Body>
        )}
        {error ? (
          <Text
            accessibilityRole="alert"
            style={{ color: t.red, fontSize: 16 }}
          >
            {error}
          </Text>
        ) : null}
        <Field
          label={kind === "pomodoro" ? tr("Focus task") : tr("Program name")}
          value={config.title}
          onChangeText={(title) => patch({ title })}
        />
        {presets[kind] && (
          <>
            <Heading>{tr("Start with a preset")}</Heading>
            <Row>
              {presets[kind]!.map((p) => (
                <Action
                  key={p.name}
                  label={p.name}
                  onPress={() =>
                    patch({ ...p.values, customRounds: false, overrides: [] })
                  }
                />
              ))}
            </Row>
          </>
        )}
        {kind === "meeting" && (
          <>
            <Heading>{tr("Your agenda")}</Heading>
            <Body muted>
              {tr(
                "Early finishes give the next speaker more time. Overruns shorten later turns.",
              )}
            </Body>
            {config.agenda.map((slot, i) => (
              <View
                key={slot.id}
                style={{
                  gap: 10,
                  paddingBottom: 16,
                  borderBottomWidth: 1,
                  borderColor: t.line,
                }}
              >
                <Field
                  label={tr("Item {0}", String(i + 1))}
                  value={slot.name}
                  onChangeText={(name) =>
                    patch({
                      agenda: config.agenda.map((a) =>
                        a.id === slot.id ? { ...a, name } : a,
                      ),
                    })
                  }
                />
                <DurationField
                  label={tr("Duration · minutes")}
                  unit="minutes"
                  value={agendaMinutes[slot.id] ?? String(slot.seconds / 60)}
                  onChangeText={(v) =>
                    setAgendaMinutes((drafts) => ({ ...drafts, [slot.id]: v }))
                  }
                />
                <Row>
                  <Action
                    label={tr("Move up")}
                    disabled={i === 0}
                    onPress={() => {
                      const a = [...config.agenda];
                      [a[i - 1], a[i]] = [a[i], a[i - 1]];
                      patch({ agenda: a });
                    }}
                  />
                  <Action
                    label={tr("Move down")}
                    disabled={i === config.agenda.length - 1}
                    onPress={() => {
                      const a = [...config.agenda];
                      [a[i], a[i + 1]] = [a[i + 1], a[i]];
                      patch({ agenda: a });
                    }}
                  />
                  <Action
                    label={tr("Remove")}
                    disabled={config.agenda.length === 1}
                    onPress={() =>
                      patch({
                        agenda: config.agenda.filter((a) => a.id !== slot.id),
                      })
                    }
                  />
                </Row>
              </View>
            ))}
            <Row>
              <Action
                label={tr("Add item")}
                disabled={config.agenda.length >= 200}
                onPress={() =>
                  patch({
                    agenda: [
                      ...config.agenda,
                      {
                        id: Crypto.randomUUID(),
                        name: "New speaker",
                        seconds: 180,
                      },
                    ],
                  })
                }
              />
              <Action
                label={tr("Equal times")}
                onPress={() => {
                  const seconds =
                    config.agenda.reduce((n, a) => n + a.seconds, 0) /
                    config.agenda.length;
                  patch({
                    agenda: config.agenda.map((a) => ({
                      ...a,
                      seconds,
                      pinned: false,
                    })),
                  });
                }}
              />
            </Row>
            {numeric("minimum", "Minimum turn · seconds")}
            <Toggle
              label={tr("Move to the next speaker automatically")}
              value={config.automatic}
              onChange={(automatic) => patch({ automatic })}
            />
          </>
        )}
        {interval && (
          <>
            <Heading>{tr("Work & rest")}</Heading>
            <Row>
              {numeric("rounds", "Rounds")}
              {numeric("work", "Work · seconds")}
              {numeric("rest", "Rest · seconds")}
              {numeric("prepare", "Get ready · seconds")}
              {numeric("cooldown", "Cool down · seconds")}
              {kind === "fitness" && (
                <>
                  {numeric("sets", "Sets")}
                  {numeric("setRest", "Set recovery · seconds")}
                </>
              )}
            </Row>
            <Toggle
              label={tr("Customize individual rounds")}
              value={config.customRounds}
              onChange={(customRounds) => patch({ customRounds })}
            />
            {config.customRounds &&
              Array.from(
                {
                  length: Math.min(
                    99,
                    Math.max(1, Math.floor(Number(numbers.rounds) || 1)),
                  ),
                },
                (_, i) => {
                  const round = config.overrides[i] ?? {
                    name: `Round ${i + 1}`,
                    work: Number(numbers.work) || 180,
                    rest: Number(numbers.rest) || 60,
                  };
                  const edit = (values: Partial<typeof round>) => {
                    const overrides = Array.from(
                      { length: i + 1 },
                      (_, j) =>
                        config.overrides[j] ?? {
                          name: `Round ${j + 1}`,
                          work: Number(numbers.work) || 180,
                          rest: Number(numbers.rest) || 60,
                        },
                    );
                    patch({
                      overrides: [
                        ...overrides.slice(0, i),
                        { ...round, ...values },
                        ...config.overrides.slice(i + 1),
                      ],
                    });
                  };
                  return (
                    <View key={i} style={{ gap: 12 }}>
                      <Field
                        label={tr("Round {0} name", String(i + 1))}
                        value={round.name}
                        onChangeText={(name) => edit({ name })}
                      />
                      <Row>
                        <DurationField
                          label={tr("Work · seconds")}
                          value={String(round.work)}
                          onChangeText={(v) => edit({ work: Number(v) })}
                        />
                        <DurationField
                          label={tr("Rest · seconds")}
                          value={String(round.rest)}
                          onChangeText={(v) => edit({ rest: Number(v) })}
                        />
                      </Row>
                    </View>
                  );
                },
              )}
            <Toggle
              label={tr("Advance automatically")}
              value={config.automatic}
              onChange={(automatic) => patch({ automatic })}
            />
          </>
        )}
        {kind === "pomodoro" && (
          <>
            <Heading>{tr("Focus & breaks")}</Heading>
            <Row>
              {numeric("work", "Focus · seconds")}
              {numeric("rest", "Short break · seconds")}
              {numeric("longRest", "Long break · seconds")}
              {numeric("longEvery", "Long break every… sessions")}
              {numeric("rounds", "Focus sessions")}
            </Row>
            <Toggle
              label={tr("Include the final break")}
              value={config.finalBreak}
              onChange={(finalBreak) => patch({ finalBreak })}
            />
            <Toggle
              label={tr("Advance automatically")}
              value={config.automatic}
              onChange={(automatic) => patch({ automatic })}
            />
          </>
        )}
        {["simple", "classroom", "chess"].includes(kind) && (
          <>
            {numeric(
              "duration",
              kind === "chess"
                ? "Time per player · seconds"
                : "Duration · seconds",
            )}
            {kind !== "chess" && (
              <Row>
                {[5, 10, 15, 20, 25, 30].map((m) => (
                  <Action
                    key={m}
                    label={tr("{0} min", String(m))}
                    onPress={() => patch({ duration: m * 60 })}
                  />
                ))}
              </Row>
            )}
          </>
        )}
        {kind === "classroom" && (
          <Toggle
            label={tr("Hide digits and show visual progress")}
            value={config.hideDigits}
            onChange={(hideDigits) => patch({ hideDigits })}
          />
        )}
        {kind === "chess" && (
          <>
            <Row>
              {numeric("increment", "Increment · seconds")}
              {numeric("delay", "Delay · seconds")}
            </Row>
            <Heading>{tr("First player")}</Heading>
            <Row>
              {["White", "Black"].map((label, i) => (
                <Action
                  key={label}
                  label={label}
                  tone={Number(numbers.first) === i ? "primary" : "outline"}
                  onPress={() => patch({ first: i })}
                />
              ))}
            </Row>
          </>
        )}
        {kind === "newyear" && (
          <>
            <Heading>{tr("Celebrate midnight in…")}</Heading>
            <Row>
              {[
                ["local", "My time zone"],
                ["UTC", "UTC"],
                ["America/New_York", "New York"],
                ["America/Los_Angeles", "Los Angeles"],
                ["Europe/London", "London"],
                ["Europe/Paris", "Paris"],
                ["Asia/Dubai", "Dubai"],
                ["Asia/Tokyo", "Tokyo"],
                ["Australia/Sydney", "Sydney"],
              ].map(([zone, label]) => (
                <Action
                  key={zone}
                  label={label}
                  tone={config.zone === zone ? "primary" : "outline"}
                  onPress={() => patch({ zone })}
                />
              ))}
            </Row>
          </>
        )}
        <Rule />
        <Heading>{tr("Sound & cues")}</Heading>
        {!["stopwatch", "chess", "newyear"].includes(kind) && (
          <Row>
            {numeric("warning", "Warning · seconds left")}
            {numeric("finalCue", "Final countdown · seconds")}
          </Row>
        )}
        <Row>
          {(["gong", "bell", "beep", "off"] as const).map((sound) => (
            <Action
              key={sound}
              label={
                sound === "off"
                  ? tr("Silent")
                  : sound[0].toUpperCase() + sound.slice(1)
              }
              tone={config.sound === sound ? "primary" : "outline"}
              onPress={() => patch({ sound })}
            />
          ))}
        </Row>
        {numeric("volume", "In-app volume · 0–100%")}
        <Body muted>
          {tr("Background notification volume is controlled by your phone.")}
        </Body>
        <Toggle
          label={tr("Speak stage names while the app is open")}
          value={config.voice}
          onChange={(voice) => patch({ voice })}
        />
        <Action
          label={tr("Test sound")}
          onPress={() =>
            void playCue(
              { ...config, volume: Number(numbers.volume) },
              "Sound test",
              store.settings.haptics,
            ).catch(() =>
              setError("Audio could not play. Check your phone volume."),
            )
          }
        />
        <Action label={tr("Save setup")} tone="primary" onPress={done} />
        <Action label={tr("Cancel")} onPress={() => router.back()} />
      </CustomizationGate>
    </Page>
  );
}
