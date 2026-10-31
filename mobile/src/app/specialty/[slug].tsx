import React, { useCallback, useEffect, useRef, useState } from "react";
import { AppState, Keyboard, Text, View } from "react-native";
import { Image } from "expo-image";
import {
  Stack,
  router,
  useFocusEffect,
  useLocalSearchParams,
} from "expo-router";
import { userData } from "../../services/user-data";
import * as Crypto from "expo-crypto";
import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";
import profiles from "../../core/specialty-catalog.json";
import { specialtyArt } from "../../core/specialty-art";
import {
  act,
  elapsed,
  display,
  settle,
  type Card,
} from "../../core/board-engine";
import {
  freshBoard,
  restoreBoard,
  servingBoard,
  boardCsv,
  customProfile,
  boardOptions,
  validateSignals,
  speechSignal,
  type BoardProfile,
} from "../../core/board";
import {
  Action,
  Body,
  Field,
  Heading,
  Page,
  Row,
  Rule,
  Toggle,
} from "../../components/ui";
import { DurationField } from "../../components/duration-field";
import { TimerFavoriteControls } from "../../components/timer-library";
import { PlanStatus } from "../../components/plan-status";
import { BrandLogo } from "../../components/brand-logo";
import { BreathingOrb } from "../../components/breathing-orb";
import {
  reserveSession,
  sessionIdentity,
  requireCustomization,
  useBilling,
} from "../../services/billing";
import { exportFile, importFile } from "../../services/files";
import { defaultConfig } from "../../core/catalog";
import { playCue, dialFeedback } from "../../services/audio";
import { useApp } from "../../state/app-store";
import {
  timerNow,
  saveClockCheckpoint,
  wallTime,
} from "../../services/timer-clock";
import { boardAlarmPlan } from "../../core/board-alarms";
import { syncAlarmScope } from "../../services/notifications";
import { boardSessionContinues } from "../../core/session";
import { useTheme } from "../../theme";

export default function SpecialtyTimer() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const profile =
    slug === "custom-timer"
      ? customProfile
      : profiles.find((p) => p.slug === slug);
  if (!profile)
    return (
      <Page>
        <Heading>Timer not found</Heading>
        <Action
          label="Timer library"
          onPress={() => router.push("/(tabs)/timers")}
        />
      </Page>
    );
  return <Board key={profile.slug} profile={profile as BoardProfile} />;
}
function Board({ profile: p }: { profile: BoardProfile }) {
  const [AsyncStorage] = useState(() => userData.scope());
  const t = useTheme(),
    { store, snapshot } = useApp(),
    { access } = useBilling();
  const [board, setBoard] = useState<Card[]>(() => freshBoard(p));
  const [ready, setReady] = useState(false),
    [now, setNow] = useState(() => timerNow());
  const [edit, setEdit] = useState<number | null>(null),
    [guide, setGuide] = useState(false);
  const [note, setNote] = useState("");
  const [options, setOptions] = useState(() => boardOptions(undefined, p));
  const { sound, hideDigits, kidsView } = options;
  const optionSnapshot = useRef(options);
  optionSnapshot.current = options;
  const [signalDraft, setSignalDraft] = useState(() => ({
    green: String(options.green),
    amber: String(options.amber),
    red: String(options.red),
  }));
  const [signalMessage, setSignalMessage] = useState("");
  const [serve, setServe] = useState("60");
  const cueMarkers = useRef<Record<string, string>>({});
  function restoreOptions(raw: unknown) {
    const value = boardOptions(raw, p);
    setOptions(value);
    setSignalDraft({
      green: String(value.green),
      amber: String(value.amber),
      red: String(value.red),
    });
  }
  const [pending, setPending] = useState(false);
  const sessionOwner = useRef<string | null>(null);
  const session = useRef<string | null>(null),
    busy = useRef(false),
    current = useRef(board),
    persist = useRef(true);
  const key = `corptimer.board.${p.slug}`;
  current.current = board;
  const running = board.some((c) => c.anchor !== null || !!c.scheduledAt);
  function cue(name: string, which = "bell") {
    if (!sound || which === "off") return;
    if (which === "click") {
      dialFeedback(store.settings.haptics, true);
      return;
    }
    void playCue(
      {
        ...defaultConfig("simple"),
        sound: which === "gong" || which === "beep" ? which : "bell",
        voice: false,
      },
      name,
      store.settings.haptics,
    ).catch(() => {});
  }
  useEffect(() => {
    let live = true;
    void AsyncStorage.getItem(key)
      .then((s) => {
        if (!live || !s) return;
        const saved = JSON.parse(s);
        setBoard(
          restoreBoard(
            Array.isArray(saved) ? saved : saved.board,
            p.mode,
            timerNow(),
          ),
        );
        session.current = Array.isArray(saved) ? null : saved.session || null;
        sessionOwner.current = saved.sessionOwner || null;
        restoreOptions(saved.options);
      })
      .catch(() => {
        if (live) {
          persist.current = false;
          setNote(
            "Could not restore the board. The original saved data has not been replaced.",
          );
        }
      })
      .finally(() => {
        if (live) setReady(true);
      });
    return () => {
      live = false;
    };
    // The profile is fixed for this keyed screen instance.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, p.mode]);
  useEffect(() => {
    if (!ready || !persist.current) return;
    const save = () => {
      if (busy.current) return;
      try {
        saveClockCheckpoint();
      } catch {
        setNote(
          "Could not save clock recovery data. Keep the app open and export a backup.",
        );
        return;
      }
      return AsyncStorage.setItem(
        key,
        JSON.stringify({
          board: current.current,
          session: session.current,
          sessionOwner: sessionOwner.current,
          options,
        }),
      ).catch(() => setNote("Could not save this board. Export a backup."));
    };
    void save();
    const sub = AppState.addEventListener("change", () => {
      void save();
    });
    return () => {
      sub.remove();
    };
  }, [board, ready, key, options, AsyncStorage, pending]);
  useEffect(() => {
    if (!ready) return;
    const plan = store.settings.notifications
      ? boardAlarmPlan(
          board,
          p.mode,
          timerNow(),
          p.slug === "speech-timer" ? options : undefined,
        ).map((a) => ({ ...a, at: wallTime(a.at) }))
      : [];
    void syncAlarmScope(
      `board.${p.slug}`,
      plan,
      options.sound ? "bell" : "off",
      p.slug,
    ).catch(() =>
      setNote(
        "Background alerts could not be scheduled. Keep this timer open.",
      ),
    );
  }, [board, ready, p.mode, p.slug, options, store.settings.notifications]);
  useFocusEffect(
    useCallback(() => {
      if (!running) return;
      const id = setInterval(() => {
        if (
          AppState.currentState === "background" ||
          AppState.currentState === "inactive"
        )
          return;
        const time = timerNow();
        setNow(time);
        const before = current.current;
        before.forEach((card, i) => {
          const stage = card.stages[card.index];
          const seconds = elapsed(card, time) / 1000;
          const marker =
            p.slug === "speech-timer"
              ? speechSignal(seconds, options)
              : stage.repeatCue && stage.repeatCue > 0
                ? `${card.index}:${Math.floor(seconds / stage.repeatCue)}`
                : "";
          const previous = cueMarkers.current[String(i)];
          if (
            marker &&
            previous &&
            marker !== previous &&
            card.anchor !== null &&
            AppState.currentState === "active" &&
            (p.slug === "speech-timer" || !marker.endsWith(":0"))
          )
            cue(stage.name, stage.cueEnd ?? "bell");
          cueMarkers.current[String(i)] = marker;
        });
        const next = before.map((c) =>
          settle(
            c.scheduledAt && c.scheduledAt <= time
              ? { ...c, anchor: c.scheduledAt, scheduledAt: null }
              : c,
            p.mode,
            time,
          ),
        );
        if (
          next.some(
            (c, i) =>
              c.index !== before[i].index ||
              c.done !== before[i].done ||
              c.waiting !== before[i].waiting ||
              c.anchor !== before[i].anchor,
          )
        ) {
          if (AppState.currentState === "active") {
            const old = before.find(
              (c, i) =>
                c.index !== next[i].index ||
                c.done !== next[i].done ||
                c.waiting !== next[i].waiting,
            );
            if (old)
              cue("Stage changed", old.stages[old.index].cueEnd ?? "bell");
          }
          setBoard(next);
        }
      }, 200);
      return () => clearInterval(id);
      // Latest board is read from a ref; reinstall only for the sound preference.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [running, p.mode, options, store.settings.haptics]),
  );
  useEffect(() => {
    if (running && store.settings.keepAwake)
      void activateKeepAwakeAsync("specialty").catch(() => {});
    return () => {
      void deactivateKeepAwake("specialty");
    };
  }, [running, store.settings.keepAwake]);
  function customize(fn: () => void) {
    try {
      requireCustomization();
      fn();
    } catch (e) {
      setNote(e instanceof Error ? e.message : "Check your plan.");
    }
  }
  async function start(fn: (b: Card[], time: number) => Card[]) {
    if (!ready || busy.current || !AsyncStorage.current()) return;
    // Release input focus before pending/access updates resize the controls.
    // Otherwise Android can scroll back to an offscreen duration field.
    Keyboard.dismiss();
    busy.current = true;
    setPending(true);
    setNote("");
    try {
      const uid = await sessionIdentity();
      if (sessionOwner.current !== uid) session.current = null;
      if (!session.current) {
        const saved = await AsyncStorage.getItem(key + ".reservation"),
          reservation = saved || Crypto.randomUUID();
        if (!saved)
          await AsyncStorage.setItem(key + ".reservation", reservation);
        await reserveSession(reservation, uid);
        session.current = reservation;
        sessionOwner.current = uid;
      }
      if (!AsyncStorage.current()) return;
      const next = fn(current.current, timerNow());
      saveClockCheckpoint();
      // Persist the accepted start before removing its retry ID. A navigation
      // or process interruption must not consume a grant without saving it.
      await AsyncStorage.setItem(
        key,
        JSON.stringify({
          board: next,
          session: session.current,
          sessionOwner: sessionOwner.current,
          options: optionSnapshot.current,
        }),
      );
      if (!AsyncStorage.current()) return;
      await AsyncStorage.removeItem(key + ".reservation");
      if (!AsyncStorage.current()) return;
      current.current = next;
      setBoard(next);
      const settings = snapshot().settings;
      const plan = settings.notifications
        ? boardAlarmPlan(
            next,
            p.mode,
            timerNow(),
            p.slug === "speech-timer" ? optionSnapshot.current : undefined,
          ).map((a) => ({ ...a, at: wallTime(a.at) }))
        : [];
      void syncAlarmScope(
        `board.${p.slug}`,
        plan,
        optionSnapshot.current.sound ? "bell" : "off",
        p.slug,
      ).catch(() =>
        setNote(
          "Background alerts could not be scheduled. Keep this timer open.",
        ),
      );
      cue("Start", "off");
    } catch (e) {
      setNote(e instanceof Error ? e.message : "Reconnect to start a timer.");
    } finally {
      busy.current = false;
      setPending(false);
    }
  }
  function action(i: number, action: string) {
    if (action === "add" || action === "subtract") {
      customize(() => setBoard((b) => act(b, i, action, p.mode, timerNow())));
      return;
    }
    if (
      (action === "toggle" && board[i].anchor === null) ||
      (action === "next" && !session.current)
    ) {
      void start((b, time) => act(b, i, action, p.mode, time));
      return;
    }
    if (action === "reset" && !boardSessionContinues(current.current, i))
      session.current = null;
    setBoard((b) => act(b, i, action, p.mode, timerNow()));
    if (action === "next")
      cue("Next stage", board[i].stages[board[i].index].cueEnd ?? "bell");
  }
  async function resetAll() {
    session.current = null;
    persist.current = true;
    await AsyncStorage.removeItem(key + ".reservation");
    setBoard(freshBoard(p));
    setEdit(null);
  }
  function patch(i: number, values: Partial<Card>) {
    setBoard((b) => b.map((c, n) => (n === i ? { ...c, ...values } : c)));
  }
  async function files(fn: () => Promise<unknown>) {
    try {
      await fn();
    } catch (e) {
      setNote(e instanceof Error ? e.message : "Could not open the file.");
    }
  }
  const setup = () =>
    board.map((c) => ({
      ...c,
      index: 0,
      elapsed: 0,
      anchor: null,
      scheduledAt: null,
      done: false,
      waiting: false,
      laps: [],
      lapOffset: 0,
      lapBase: 0,
      hasStarted: false,
    }));
  return (
    <Page>
      <Stack.Screen options={{ title: p.title }} />
      <View style={{ gap: 6 }}>
        <Body muted>{p.description}</Body>
        <Body muted style={{ fontSize: 14, lineHeight: 20 }}>
          Background alerts follow Settings. Up to 48 upcoming alerts across
          timers are scheduled; keep long sessions open. Voice and repeated cues
          play in the app.
        </Body>
      </View>
      <BrandLogo />
      {note ? <Body>{note}</Body> : null}
      <Row>
        <Action
          label={
            pending
              ? "Checking access…"
              : p.mode === "turn"
                ? "Start first player"
                : "Start all"
          }
          tone="primary"
          disabled={!ready || pending}
          onPress={() =>
            void start((b, time) =>
              b.map((c, i) => {
                const n = settle(c, p.mode, time);
                return {
                  ...n,
                  scheduledAt: null,
                  elapsed: elapsed(n, time),
                  anchor:
                    !n.done && !n.waiting && (p.mode !== "turn" || i === 0)
                      ? time
                      : null,
                };
              }),
            )
          }
        />
        <Action
          label="Pause all"
          disabled={!ready}
          onPress={() =>
            setBoard((b) =>
              b.map((_, i) => ({
                ...act(b, i, "pause", p.mode, timerNow())[i],
                scheduledAt: null,
              })),
            )
          }
        />
        <Action
          label="Reset board"
          disabled={pending}
          onPress={() => void resetAll()}
        />
      </Row>
      {ready ? (
        board.map((c, i) => {
          const spent = elapsed(c, now) / 1000,
            phase = c.stages[c.index];
          const signal =
            p.slug === "speech-timer" ? speechSignal(spent, options) : "";
          return (
            <View key={i} style={{ gap: 12 }}>
              <View
                style={{
                  backgroundColor: t.clock,
                  borderRadius: 16,
                  padding: 22,
                  gap: 16,
                }}
              >
                <Text
                  style={{
                    color: t.cream,
                    fontSize: 22,
                    fontFamily: "Cantata",
                  }}
                >
                  {c.name}
                </Text>
                <Text style={{ color: t.bright, fontSize: 16 }}>
                  {phase.name} ·{" "}
                  {c.done
                    ? "Finished"
                    : c.waiting
                      ? "Ready for next stage"
                      : c.scheduledAt
                        ? "Scheduled"
                        : c.anchor === null
                          ? "Paused / ready"
                          : "Running"}
                </Text>
                {!hideDigits ? (
                  <Text
                    accessibilityRole="timer"
                    testID={`board-clock-${i}`}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.5}
                    style={{
                      color: t.cream,
                      fontFamily: "Manrope",
                      fontSize: 58,
                      lineHeight: 80,
                      paddingVertical: 4,
                      includeFontPadding: true,
                      fontVariant: ["tabular-nums"],
                    }}
                  >
                    {display(c, p.mode, now)}
                  </Text>
                ) : (
                  <Body style={{ color: t.cream }}>
                    A moment without watching the clock.
                  </Body>
                )}
                {signal ? (
                  <Text
                    style={{
                      color:
                        signal === "Red"
                          ? t.salmon
                          : signal === "Amber"
                            ? t.citron
                            : t.bright,
                      fontSize: 22,
                    }}
                  >
                    {signal} signal
                  </Text>
                ) : null}
                {p.slug === "breathing-timer" ? (
                  <BreathingOrb card={c} />
                ) : null}
                {p.slug === "toothbrushing-timer" && kidsView ? (
                  <Row>
                    {[
                      "Upper left",
                      "Upper right",
                      "Lower right",
                      "Lower left",
                    ].map((zone, n) => (
                      <Text
                        key={zone}
                        style={{
                          color: c.index % 4 === n ? t.bright : t.clockMuted,
                          fontWeight: c.index % 4 === n ? "700" : "400",
                        }}
                      >
                        {zone}
                      </Text>
                    ))}
                  </Row>
                ) : null}
                {p.slug === "sports-scoreboard-timer" ? (
                  <>
                    <Text style={{ color: t.cream, fontSize: 24 }}>
                      Score {Number(c.score) || 0}
                    </Text>
                    <Row>
                      <Action
                        label="−1 point"
                        tone="cream"
                        onPress={() =>
                          patch(i, {
                            score: Math.max(0, (Number(c.score) || 0) - 1),
                          })
                        }
                      />
                      <Action
                        label="+1 point"
                        tone="cream"
                        onPress={() =>
                          patch(i, {
                            score: Math.min(999, (Number(c.score) || 0) + 1),
                          })
                        }
                      />
                    </Row>
                  </>
                ) : null}
                {p.mode !== "up" ? (
                  <View
                    accessibilityLabel={`${c.stages.length} stage timeline`}
                    style={{ flexDirection: "row", gap: 4, height: 10 }}
                  >
                    {c.stages.map((s, n) => (
                      <View
                        key={n}
                        style={{
                          flex: s.seconds,
                          minWidth: 3,
                          borderRadius: 3,
                          backgroundColor:
                            n < c.index
                              ? t.bright
                              : n === c.index
                                ? t.salmon
                                : t.clockTrack,
                        }}
                      />
                    ))}
                  </View>
                ) : null}
                <Row>
                  <Action
                    label={c.anchor === null ? "Start" : "Pause"}
                    tone="cream"
                    disabled={pending || c.done || !!c.waiting}
                    onPress={() => action(i, "toggle")}
                  />
                  <Action
                    label={
                      p.mode === "up"
                        ? "Lap"
                        : p.mode === "turn"
                          ? "Next player"
                          : "Next stage"
                    }
                    tone="cream"
                    disabled={pending || c.done}
                    onPress={() => action(i, p.mode === "up" ? "lap" : "next")}
                  />
                  <Action
                    label="Reset"
                    tone="cream"
                    onPress={() => action(i, "reset")}
                  />
                </Row>
              </View>
              <Row>
                {p.mode !== "up" ? (
                  <>
                    <Action
                      label="+1 minute"
                      onPress={() => action(i, "add")}
                    />
                    <Action
                      label="−1 minute"
                      onPress={() => action(i, "subtract")}
                    />
                  </>
                ) : null}
                <Action
                  label={edit === i ? "Close editor" : "Edit clock"}
                  onPress={() =>
                    customize(() => setEdit(edit === i ? null : i))
                  }
                  disabled={c.anchor !== null}
                />
              </Row>
              {edit === i && c.anchor === null && access?.customize ? (
                <ClockEditor
                  card={c}
                  mode={p.mode}
                  onChange={(value) => customize(() => patch(i, value))}
                  onRemove={() =>
                    customize(() => {
                      if (board.length > 1)
                        setBoard((b) => b.filter((_, n) => i !== n));
                      setEdit(null);
                    })
                  }
                />
              ) : null}
              {c.laps.map((v, j) => (
                <Body key={j}>
                  Lap {(c.lapOffset ?? 0) + j + 1}: {(v / 1000).toFixed(2)} s ·
                  split{" "}
                  {((v - (c.laps[j - 1] ?? c.lapBase ?? 0)) / 1000).toFixed(2)}{" "}
                  s
                </Body>
              ))}
            </View>
          );
        })
      ) : (
        <Body>Restoring clocks…</Body>
      )}
      <Rule />
      <Heading>Setup & options</Heading>
      <PlanStatus showLogo={false} />
      <TimerFavoriteControls id={p.slug} />
      <Body muted>
        Clocks continue by elapsed time while away. Keep this screen open for
        stage sounds; specialty background alerts are not scheduled. Up to 500
        recent laps are kept.
      </Body>
      <Action
        label="Add clock"
        disabled={!ready || board.length >= 12}
        onPress={() =>
          customize(() =>
            setBoard((b) => [
              ...b,
              {
                ...freshBoard({ ...p, cards: undefined, count: 1 })[0],
                name: `Timer ${b.length + 1}`,
              },
            ]),
          )
        }
      />
      {p.slug === "meditation-timer" ? (
        <Toggle
          label="Hide clock digits"
          value={hideDigits}
          onChange={(hideDigits) => setOptions((o) => ({ ...o, hideDigits }))}
        />
      ) : null}
      <Toggle
        label="Stage sounds while the app is open"
        value={sound}
        onChange={(sound) => setOptions((o) => ({ ...o, sound }))}
      />
      {p.slug === "toothbrushing-timer" ? (
        <Toggle
          label="Show brushing zones"
          value={kidsView}
          onChange={(kidsView) => setOptions((o) => ({ ...o, kidsView }))}
        />
      ) : null}
      {p.slug === "speech-timer" ? (
        <>
          <Heading>Speech signals</Heading>
          {(["green", "amber", "red"] as const).map((color) => (
            <DurationField
              key={color}
              label={`${color[0].toUpperCase() + color.slice(1)} · seconds`}
              value={signalDraft[color]}
              onChangeText={(v) =>
                setSignalDraft((d) => ({ ...d, [color]: v }))
              }
            />
          ))}
          <Action
            label="Apply signals"
            tone="primary"
            onPress={() =>
              customize(() => {
                Keyboard.dismiss();
                try {
                  const signals = validateSignals(
                    Number(signalDraft.green),
                    Number(signalDraft.amber),
                    Number(signalDraft.red),
                  );
                  setOptions((o) => ({ ...o, ...signals }));
                  setSignalMessage("Speech signals saved.");
                } catch (e) {
                  setSignalMessage((e as Error).message);
                }
              })
            }
          />
          {signalMessage ? <Body>{signalMessage}</Body> : null}
        </>
      ) : null}
      {p.slug === "kitchen-timer" ? (
        <>
          <Heading>Serve dishes together</Heading>
          <Body muted>Keep this screen open for scheduled dish starts.</Body>
          <DurationField
            label="Serve in · minutes"
            unit="minutes"
            value={serve}
            onChangeText={setServe}
          />
          <Action
            label="Schedule dishes"
            disabled={pending || running}
            onPress={() =>
              customize(() => {
                try {
                  const scheduled = servingBoard(
                    board,
                    timerNow() + Number(serve) * 60000,
                    timerNow(),
                  );
                  void start(() => scheduled);
                } catch (e) {
                  setNote((e as Error).message);
                }
              })
            }
          />
        </>
      ) : null}
      <Rule />
      <Row>
        <Action
          label="Save setup"
          onPress={() =>
            customize(
              () =>
                void files(async () => {
                  await AsyncStorage.setItem(
                    key + ".setup",
                    JSON.stringify({ board: setup(), options }),
                  );
                  setNote("Setup saved on this device.");
                }),
            )
          }
        />
        <Action
          label="Load setup"
          onPress={() =>
            void files(async () => {
              const s = await AsyncStorage.getItem(key + ".setup");
              if (!s) throw Error("Save a setup first.");
              const saved = JSON.parse(s);
              const b = restoreBoard(
                Array.isArray(saved) ? saved : saved.board,
                p.mode,
                timerNow(),
              );
              restoreOptions(saved.options);
              session.current = null;
              setBoard(b);
            })
          }
        />
        <Action
          label="Export setup"
          onPress={() =>
            void files(() =>
              exportFile(
                `${p.slug}.json`,
                JSON.stringify({
                  version: 1,
                  mode: p.mode,
                  board: setup(),
                  options,
                }),
              ),
            )
          }
        />
        <Action
          label="Import setup"
          onPress={() =>
            customize(
              () =>
                void files(async () => {
                  const text = await importFile();
                  if (!text) return;
                  const s = JSON.parse(text);
                  if (s.mode !== p.mode)
                    throw Error("This setup uses a different clock mode.");
                  const b = restoreBoard(s.board, p.mode, timerNow()).map(
                    (c) => ({ ...c, anchor: null, scheduledAt: null }),
                  );
                  session.current = null;
                  restoreOptions(s.options);
                  setBoard(b);
                }),
            )
          }
        />
        <Action
          label="Export CSV"
          onPress={() =>
            void files(() =>
              exportFile(
                `${p.slug}-results.csv`,
                boardCsv(board, timerNow()),
                "text/csv",
              ),
            )
          }
        />
      </Row>
      <Action
        label={guide ? "Hide instructions" : "How to use & advice"}
        onPress={() => setGuide(!guide)}
      />
      {guide ? (
        <>
          {specialtyArt[p.slug] ? (
            <Image
              source={specialtyArt[p.slug]}
              contentFit="contain"
              style={{ width: "100%", aspectRatio: 1200 / 630 }}
              accessibilityLabel={`${p.title} stage diagram`}
            />
          ) : null}
          <Heading>How to use</Heading>
          <Body>{p.use}</Body>
          <Heading>Advice</Heading>
          <Body>{p.tip}</Body>
        </>
      ) : null}
    </Page>
  );
}
function ClockEditor({
  card,
  mode,
  onChange,
  onRemove,
}: {
  card: Card;
  mode: string;
  onChange: (value: Partial<Card>) => void;
  onRemove: () => void;
}) {
  const [stages, setStages] = useState(card.stages),
    [name, setName] = useState(card.name),
    [times, setTimes] = useState(() =>
      card.stages.map((s) => String(s.seconds)),
    ),
    [error, setError] = useState("");
  return (
    <View style={{ gap: 16 }}>
      <Field
        label="Clock name"
        value={name}
        maxLength={80}
        onChangeText={setName}
      />
      {stages.map((s, j) => (
        <View key={j} style={{ gap: 8 }}>
          <Field
            label={`Stage ${j + 1} name`}
            value={s.name}
            maxLength={80}
            onChangeText={(v) =>
              setStages((a) =>
                a.map((x, n) => (n === j ? { ...x, name: v } : x)),
              )
            }
          />
          {mode !== "up" ? (
            <DurationField
              label={`Stage ${j + 1} · seconds`}
              value={times[j]}
              onChangeText={(v) =>
                setTimes((a) => a.map((x, n) => (n === j ? v : x)))
              }
            />
          ) : null}
          <Row>
            <Action
              label="Move earlier"
              disabled={j === 0}
              onPress={() => {
                const a = [...stages],
                  b = [...times];
                [a[j - 1], a[j]] = [a[j], a[j - 1]];
                [b[j - 1], b[j]] = [b[j], b[j - 1]];
                setStages(a);
                setTimes(b);
              }}
            />
            <Action
              label="Remove stage"
              disabled={stages.length < 2}
              onPress={() => {
                setStages((a) => a.filter((_, n) => n !== j));
                setTimes((a) => a.filter((_, n) => n !== j));
              }}
            />
          </Row>
        </View>
      ))}
      <Action
        label="Add stage"
        disabled={stages.length >= 100}
        onPress={() => {
          setStages((a) => [...a, { name: "Next stage", seconds: 60 }]);
          setTimes((a) => [...a, "60"]);
        }}
      />
      <Body muted>
        Changing durations or the number of stages resets this clock and its
        laps. Renaming keeps the current timing.
      </Body>
      <Action
        label="Apply clock changes"
        tone="primary"
        onPress={() => {
          if (
            times.some(
              (v) =>
                !v.trim() ||
                !Number.isFinite(Number(v)) ||
                Number(v) < (mode === "up" ? 0 : 1) ||
                Number(v) > 86400,
            )
          ) {
            setError("Enter durations from 1 to 86400 seconds.");
            return;
          }
          const nextStages = stages.map((s, j) => ({
            ...s,
            seconds: Number(times[j]),
          }));
          const timingChanged =
            nextStages.length !== card.stages.length ||
            nextStages.some((s, j) => s.seconds !== card.stages[j]?.seconds);
          onChange({
            name: name.trim() || card.name,
            stages: nextStages,
            ...(timingChanged
              ? {
                  index: 0,
                  elapsed: 0,
                  anchor: null,
                  scheduledAt: null,
                  done: false,
                  waiting: false,
                  laps: [],
                }
              : {}),
          });
          setError("Clock updated.");
        }}
      />
      <Action label="Remove clock" onPress={onRemove} />
      {error ? <Body>{error}</Body> : null}
    </View>
  );
}
