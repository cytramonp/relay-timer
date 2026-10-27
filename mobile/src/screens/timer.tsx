import React, { useEffect, useMemo, useState } from "react";
import { Text, TextInput, View, Pressable } from "react-native";
import { Stack, router } from "expo-router";
import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";
import { catalog } from "../core/catalog";
import {
  createRun,
  elapsed,
  formatTime,
  phaseDeadline,
  remaining,
} from "../core/clock";
import type { Kind } from "../core/types";
import {
  Action,
  Body,
  confirm,
  Field,
  Heading,
  Page,
  Row,
  Rule,
} from "../components/ui";
import { useApp } from "../state/app-store";
import { useTheme } from "../theme";

export function TimerScreen({ kind }: { kind: Kind }) {
  const { store, start, act, chess, notes, saveProgram, canUndo } = useApp(),
    t = useTheme();
  const preview = useMemo(
    () => createRun(kind, store.drafts[kind], "preview"),
    [kind, store.drafts],
  );
  const active = store.run?.kind === kind ? store.run : null,
    r = active ?? preview;
  const [name, setName] = useState(store.drafts[kind].title),
    [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(id);
  }, []);
  const running = r.status === "running";
  useEffect(() => {
    if (running && store.settings.keepAwake)
      void activateKeepAwakeAsync("corptimer").catch(() => {});
    return () => {
      void deactivateKeepAwake("corptimer");
    };
  }, [running, store.settings.keepAwake]);
  async function begin() {
    if (
      store.run &&
      store.run.id !== r.id &&
      store.run.status !== "done" &&
      !(await confirm(
        "Start a different timer?",
        "The current run will finish and move to History.",
      ))
    )
      return;
    start(kind);
  }
  const ms = remaining(r, now),
    done = r.status === "done",
    phase = r.phases[r.index];
  const progress =
    kind === "stopwatch" || kind === "chess" || kind === "newyear"
      ? 0
      : Math.max(
          0,
          Math.min(
            1,
            (elapsed(r, now) - r.phaseStart) /
              Math.max(1, phaseDeadline(r) - r.phaseStart),
          ),
        );
  const status = done
    ? "Complete"
    : r.status === "ready"
      ? "Ready when you are"
      : r.status === "waiting"
        ? "Waiting for Next"
        : r.status === "paused"
          ? "Paused"
          : ms < 0
            ? "Over time"
            : "Running";
  return (
    <Page>
      <Stack.Screen
        options={{
          title: catalog.find((c) => c.kind === kind)!.title,
          headerRight: () => (
            <Action label="Edit" onPress={() => router.push(`/edit/${kind}`)} />
          ),
        }}
      />
      <Heading>{r.config.title}</Heading>
      <View
        style={{
          backgroundColor: t.clock,
          borderRadius: 14,
          padding: 22,
          gap: 20,
        }}
      >
        <Row style={{ justifyContent: "space-between" }}>
          <Text style={{ color: t.bright, fontSize: 15, fontWeight: "600" }}>
            {status}
          </Text>
          {phase && (
            <Text style={{ color: "#b5cbca", fontSize: 14 }}>
              {r.index + 1} / {r.phases.length}
            </Text>
          )}
        </Row>
        {kind === "chess" ? (
          <View style={{ gap: 12 }}>
            {[0, 1].map((side) => (
              <Pressable
                key={side}
                accessibilityRole="button"
                accessibilityLabel={`${side === 0 ? "White" : "Black"} clock. ${formatTime(r.sides[side])}. Tap after your move.`}
                onPress={() => (active ? chess(side) : void begin())}
                disabled={done}
                style={{
                  padding: 22,
                  minHeight: 145,
                  borderRadius: 10,
                  borderWidth: 2,
                  borderColor: r.active === side ? t.bright : "#375055",
                  backgroundColor: r.active === side ? "#173f42" : t.clock,
                }}
              >
                <Text style={{ color: t.cream, fontSize: 17 }}>
                  {side === 0 ? "White" : "Black"} · {r.moves[side]} moves
                </Text>
                <Text
                  style={{
                    fontSize: 54,
                    color: r.active === side ? t.bright : t.cream,
                    fontFamily: "Manrope",
                    fontVariant: ["tabular-nums"],
                  }}
                >
                  {formatTime(r.sides[side])}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : (
          <>
            <Text
              selectable
              style={{ color: t.cream, fontSize: 22, fontFamily: "Cantata" }}
            >
              {kind === "stopwatch"
                ? "Elapsed time"
                : kind === "newyear"
                  ? r.config.zone === "local"
                    ? "Your local midnight"
                    : r.config.zone
                  : (phase?.name ?? r.config.title)}
            </Text>
            {!(kind === "classroom" && r.config.hideDigits) && (
              <Text
                selectable
                accessibilityLabel={`${kind === "stopwatch" ? "Elapsed" : "Remaining"} ${formatTime(ms)}`}
                adjustsFontSizeToFit
                numberOfLines={1}
                style={{
                  fontFamily: "Manrope",
                  fontSize: kind === "newyear" ? 46 : 70,
                  fontVariant: ["tabular-nums"],
                  color: ms < 0 ? t.salmon : t.cream,
                  letterSpacing: -2,
                  minHeight: 90,
                }}
              >
                {formatTime(ms, kind === "stopwatch")}
              </Text>
            )}
            {!["stopwatch", "newyear"].includes(kind) && (
              <View
                accessibilityRole="progressbar"
                accessibilityValue={{
                  min: 0,
                  max: 100,
                  now: Math.round(progress * 100),
                }}
                style={{
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: "#375055",
                  overflow: "hidden",
                }}
              >
                <View
                  style={{
                    height: 8,
                    width: `${progress * 100}%`,
                    backgroundColor: ms < 0 ? t.salmon : t.bright,
                  }}
                />
              </View>
            )}
          </>
        )}
        <Row>
          {!active || done ? (
            <Action
              label={done ? "Run again" : "Start timer"}
              testID="start-timer"
              tone="cream"
              onPress={() => void begin()}
            />
          ) : kind !== "newyear" ? (
            <Action
              label={
                running
                  ? "Pause"
                  : r.status === "waiting"
                    ? "Next interval"
                    : "Resume"
              }
              tone="cream"
              onPress={() => act(r.status === "waiting" ? "next" : "toggle")}
            />
          ) : null}
          {active && !done && r.phases.length > 1 && (
            <Action
              label={kind === "meeting" ? "Next speaker" : "Next"}
              tone="cream"
              onPress={() => act("next")}
            />
          )}
          {active && !done && kind === "stopwatch" && (
            <Action
              label="Lap"
              tone="cream"
              disabled={!running}
              onPress={() => act("lap")}
            />
          )}
        </Row>
        {active && (
          <Row>
            {!done && r.phases.length > 0 && (
              <Action
                label="+1 minute"
                tone="cream"
                onPress={() => act("extend")}
              />
            )}
            <Action
              label="Undo"
              tone="cream"
              disabled={!canUndo}
              onPress={() => act("undo")}
            />
            <Action
              label="Reset"
              tone="danger"
              onPress={() =>
                void confirm(
                  "Reset this timer?",
                  "The current run will be saved in History.",
                  true,
                ).then((ok) => {
                  if (ok) act("reset");
                })
              }
            />
          </Row>
        )}
      </View>
      {active && !done && (
        <Action
          label="Finish & save to History"
          onPress={() =>
            void confirm(
              "Finish this run?",
              "Save the elapsed time and results in History.",
            ).then((ok) => {
              if (ok) act("finish");
            })
          }
        />
      )}
      {done && (
        <Body>Saved in History. You can export your results there.</Body>
      )}
      <Body muted>
        {store.settings.notifications
          ? "Background alerts enabled. Your phone controls notification delivery and volume."
          : "Keep the app open for sounds. Enable background alerts in Settings for lock-screen notifications."}
      </Body>
      {phase?.round > 0 && (
        <Body muted>
          Round {phase.round}
          {r.config.sets > 1 ? ` · Set ${phase.set} of ${r.config.sets}` : ""}
        </Body>
      )}
      {r.phases.length > 0 && (
        <>
          <Heading>{kind === "meeting" ? "Agenda" : "Sequence"}</Heading>
          {r.phases
            .slice(Math.max(0, r.index - 3), Math.max(30, r.index + 27))
            .map((p, offset) => {
              const i = offset + Math.max(0, r.index - 3);
              return (
                <View
                  key={i}
                  style={{
                    flexDirection: "row",
                    gap: 12,
                    paddingVertical: 12,
                    borderBottomWidth: 1,
                    borderColor: t.line,
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: t.muted, minWidth: 22 }}>{i + 1}</Text>
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text
                      style={{
                        color: i === r.index ? t.red : t.ink,
                        fontSize: 16,
                        fontWeight: i === r.index ? "700" : "400",
                      }}
                    >
                      {p.name}
                    </Text>
                    {i === r.index && (
                      <Body muted style={{ fontSize: 13 }}>
                        Current interval
                      </Body>
                    )}
                  </View>
                  <Body muted>{formatTime(p.ms)}</Body>
                </View>
              );
            })}
          {r.phases.length > 30 && (
            <Body muted>
              Showing nearby stages · {r.phases.length} stages in this program.
            </Body>
          )}
        </>
      )}
      {kind === "stopwatch" && r.laps.length > 0 && (
        <>
          <Heading>Laps</Heading>
          {r.laps.map((lap, i) => (
            <Row key={i} style={{ justifyContent: "space-between" }}>
              <Body>Lap {i + 1}</Body>
              <Body>
                {formatTime(lap - (r.laps[i - 1] ?? 0), true)} ·{" "}
                {formatTime(lap, true)}
              </Body>
            </Row>
          ))}
        </>
      )}
      {kind === "meeting" && active && !done && (
        <>
          <Heading>Private notes</Heading>
          <TextInput
            accessibilityLabel="Private meeting notes"
            multiline
            maxLength={10000}
            value={r.notes}
            onChangeText={notes}
            placeholder="Decisions, next steps, things to return to…"
            placeholderTextColor={t.muted}
            style={{
              minHeight: 140,
              borderWidth: 1,
              borderColor: t.line,
              borderRadius: 6,
              padding: 14,
              color: t.ink,
              backgroundColor: t.field,
              fontSize: 17,
              textAlignVertical: "top",
            }}
          />
        </>
      )}
      <Rule />
      <Heading>Keep this program</Heading>
      <Field label="Saved program name" value={name} onChangeText={setName} />
      <Row>
        <Action label="Save program" onPress={() => saveProgram(kind, name)} />
        <Action
          label="Edit setup"
          onPress={() => router.push(`/edit/${kind}`)}
        />
      </Row>
    </Page>
  );
}
