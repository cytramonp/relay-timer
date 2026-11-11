import { useTranslate } from "../state/language";
import { TimerFavoriteControls } from "../components/timer-library";
import { TimerIdentity } from "../components/timer-identity";
import { TimerSurface } from "../components/timer-surface";
import React, { useEffect, useMemo, useState } from "react";
import { Text, TextInput, View, Pressable } from "react-native";
import { Stack, router } from "expo-router";
import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";
import { catalog } from "../core/catalog";
import {
  advance,
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
  useConfirm,
  Field,
  Heading,
  Page,
  Row,
  Rule,
} from "../components/ui";
import { useTimerNow } from "../hooks/use-timer-now";
import { useApp } from "../state/app-store";
import { useTheme } from "../theme";

export function TimerScreen({ kind }: { kind: Kind }) {
  const tr = useTranslate();
  const confirm = useConfirm();
  const { store, start, act, chess, notes, saveProgram, canUndo } = useApp(),
    t = useTheme();
  const preview = useMemo(
    () => createRun(kind, store.drafts[kind], "preview"),
    [kind, store.drafts],
  );
  const active = store.run?.kind === kind ? store.run : null,
    base = active ?? preview;
  const now = useTimerNow(
    base.status === "running",
    kind === "stopwatch" ? 100 : 250,
    kind === "newyear",
  );
  const r = kind === "chess" ? advance(base, now) : base;
  const [name, setName] = useState(store.drafts[kind].title);
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
        tr("Start a different timer?"),
        tr("The current run will finish and move to History."),
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
  const stockTitle = catalog.find((item) => item.kind === kind)!.title;
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
          title: tr(stockTitle),
          headerRight: () => (
            <Action
              label={tr("Edit")}
              onPress={() => router.push(`/edit/${kind}`)}
            />
          ),
        }}
      />
      <TimerIdentity kind={kind} />
      <Heading>
        {r.config.title === stockTitle ? tr(stockTitle) : r.config.title}
      </Heading>
      <TimerFavoriteControls id={kind} />
      <TimerSurface identity={<TimerIdentity kind={kind} />}>
        <Row style={{ justifyContent: "space-between" }}>
          <Text style={{ color: t.bright, fontSize: 15, fontWeight: "600" }}>
            {tr(status)}
          </Text>
          {phase && (
            <Text style={{ color: t.clockMuted, fontSize: 14 }}>
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
                accessibilityLabel={tr(
                  "{0} clock. {1}. Tap after your move.",
                  tr(side === 0 ? "White" : "Black"),
                  String(formatTime(r.sides[side])),
                )}
                onPress={() => (active ? chess(side) : void begin())}
                disabled={done}
                style={{
                  padding: 22,
                  minHeight: 145,
                  borderRadius: 10,
                  borderWidth: 2,
                  borderColor: r.active === side ? t.bright : t.clockLine,
                  backgroundColor: r.active === side ? t.clockTrack : t.clock,
                }}
              >
                <Text style={{ color: t.cream, fontSize: 17 }}>
                  {side === 0 ? tr("White") : tr("Black")} · {r.moves[side]}
                  {tr(" moves")}
                </Text>
                <Text
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  style={{
                    fontSize: 54,
                    lineHeight: 76,
                    includeFontPadding: true,
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
                ? tr("Elapsed time")
                : kind === "newyear"
                  ? r.config.zone === "local"
                    ? tr("Your local midnight")
                    : r.config.zone
                  : (phase?.name ?? r.config.title)}
            </Text>
            {!(kind === "classroom" && r.config.hideDigits) && (
              <Text
                selectable
                accessibilityLabel={tr(
                  kind === "stopwatch" ? "Elapsed {0}" : "Remaining {0}",
                  formatTime(ms),
                )}
                adjustsFontSizeToFit
                numberOfLines={1}
                style={{
                  fontFamily: "Manrope",
                  fontSize: kind === "newyear" ? 46 : 70,
                  fontVariant: ["tabular-nums"],
                  color: ms < 0 ? t.salmon : t.cream,
                  letterSpacing: -2,
                  minHeight: 98,
                  lineHeight: kind === "newyear" ? 68 : 98,
                  includeFontPadding: true,
                  paddingVertical: 4,
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
                  backgroundColor: t.clockTrack,
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
              label={done ? tr("Run again") : tr("Start timer")}
              testID="start-timer"
              tone="cream"
              onPress={() => void begin()}
            />
          ) : kind !== "newyear" ? (
            <Action
              label={
                running
                  ? tr("Pause")
                  : r.status === "waiting"
                    ? tr("Next interval")
                    : tr("Resume")
              }
              tone="cream"
              onPress={() => act(r.status === "waiting" ? "next" : "toggle")}
            />
          ) : null}
          {active && !done && r.phases.length > 1 && (
            <Action
              label={kind === "meeting" ? tr("Next speaker") : tr("Next")}
              tone="cream"
              onPress={() => act("next")}
            />
          )}
          {active && !done && kind === "stopwatch" && (
            <Action
              label={tr("Lap")}
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
                label={tr("+1 minute")}
                tone="cream"
                onPress={() => act("extend")}
              />
            )}
            <Action
              label={tr("Undo")}
              tone="cream"
              disabled={!canUndo}
              onPress={() => act("undo")}
            />
            <Action
              label={tr("Reset")}
              tone="danger"
              onPress={() =>
                void confirm(
                  tr("Reset this timer?"),
                  tr("The current run will be saved in History."),
                  true,
                ).then((ok) => {
                  if (ok) act("reset");
                })
              }
            />
          </Row>
        )}
      </TimerSurface>
      {active && !done && (
        <Action
          label={tr("Finish & save to History")}
          onPress={() =>
            void confirm(
              tr("Finish this run?"),
              tr("Save the elapsed time and results in History."),
            ).then((ok) => {
              if (ok) act("finish");
            })
          }
        />
      )}
      {done && (
        <Body>
          {tr("Saved in History. You can export your results there.")}
        </Body>
      )}
      <Body muted>
        {store.settings.notifications
          ? tr(
              "Background alerts enabled. Your phone controls notification delivery and volume.",
            )
          : tr(
              "Keep the app open for sounds. Enable background alerts in Settings for lock-screen notifications.",
            )}
      </Body>
      {phase?.round > 0 && (
        <Body muted>
          {tr("Round ")}
          {phase.round}
          {r.config.sets > 1
            ? tr(" · Set {0} of {1}", String(phase.set), String(r.config.sets))
            : ""}
        </Body>
      )}
      {r.phases.length > 0 && (
        <>
          <Heading>
            {kind === "meeting" ? tr("Agenda") : tr("Sequence")}
          </Heading>
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
                        {tr("Current interval")}
                      </Body>
                    )}
                  </View>
                  <Body muted>{formatTime(p.ms)}</Body>
                </View>
              );
            })}
          {r.phases.length > 30 && (
            <Body muted>
              {tr("Showing nearby stages · ")}
              {r.phases.length}
              {tr(" stages in this program.")}
            </Body>
          )}
        </>
      )}
      {kind === "stopwatch" && r.laps.length > 0 && (
        <>
          <Heading>{tr("Laps")}</Heading>
          {r.laps.map((lap, i) => (
            <Row key={i} style={{ justifyContent: "space-between" }}>
              <Body>
                {tr("Lap ")}
                {i + 1}
              </Body>
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
          <Heading>{tr("Private notes")}</Heading>
          <TextInput
            accessibilityLabel={tr("Private meeting notes")}
            multiline
            maxLength={10000}
            value={r.notes}
            onChangeText={notes}
            placeholder={tr("Decisions, next steps, things to return to…")}
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
      <Heading>{tr("Keep this program")}</Heading>
      <Field
        label={tr("Saved program name")}
        value={name}
        onChangeText={setName}
      />
      <Row>
        <Action
          label={tr("Save program")}
          onPress={() => saveProgram(kind, name)}
        />
        <Action
          label={tr("Edit setup")}
          onPress={() => router.push(`/edit/${kind}`)}
        />
      </Row>
    </Page>
  );
}
