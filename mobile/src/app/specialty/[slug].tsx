import { useTranslate } from "../../state/language";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  AppState,
  Keyboard,
  Modal,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Image } from "expo-image";
import {
  Stack,
  router,
  useFocusEffect,
  useLocalSearchParams,
} from "expo-router";
import { checkLibraryCapacity } from "../../services/library-capacity";
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
import { TimerBrandEditor } from "../../components/timer-brand-editor";
import { customRecipes, recipeSetup } from "../../core/custom-recipes";
import { SafeAreaView } from "react-native-safe-area-context";
import { BrandLogo } from "../../components/brand-logo";
import { EggDoneness } from "../../components/egg-doneness";
import { BreathingOrb } from "../../components/breathing-orb";
import {
  reserveSession,
  sessionIdentity,
  requireCustomization,
  useBilling,
} from "../../services/billing";
import { exportFile, importFile } from "../../services/files";
import { defaultConfig } from "../../core/catalog";
import { playCue, playCustomCue, dialFeedback } from "../../services/audio";
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

const eggStageNames =
  profiles
    .find((profile) => profile.slug === "egg-timer")
    ?.stages.map((stage) => stage.name) ?? [];

export default function SpecialtyTimer() {
  const tr = useTranslate();
  const { slug, instance } = useLocalSearchParams<{
    slug: string;
    instance?: string;
  }>();
  const validInstance =
    typeof instance === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      instance,
    )
      ? instance.toLowerCase()
      : undefined;
  const profile =
    slug === "custom-timer"
      ? customProfile
      : profiles.find((p) => p.slug === slug);
  if (
    !profile ||
    (instance !== undefined && (!validInstance || slug !== "custom-timer"))
  )
    return (
      <Page>
        <Heading>{tr("Timer not found")}</Heading>
        <Action
          label={tr("Timer library")}
          onPress={() => router.push("/(tabs)/timers")}
        />
      </Page>
    );
  return (
    <Board
      key={`${profile.slug}:${validInstance ?? "default"}`}
      profile={profile as BoardProfile}
      instance={slug === "custom-timer" ? validInstance : undefined}
    />
  );
}
function Board({
  profile: p,
  instance,
}: {
  profile: BoardProfile;
  instance?: string;
}) {
  const tr = useTranslate();
  const stageName = (name: string) =>
    p.slug !== "custom-timer" &&
    (p.stages.some((stage) => stage.name === name) ||
      p.cards?.some((card) => card.stages.some((stage) => stage.name === name)))
      ? tr(name)
      : name;
  const cardName = (name: string) => {
    if (p.slug === "custom-timer") return name;
    if (p.cards?.some((card) => card.name === name)) return tr(name);
    const match = /^(Timer|Player) ([0-9]+)$/.exec(name);
    return match
      ? tr(match[1] === "Timer" ? "Timer {0}" : "Player {0}", match[2])
      : name;
  };

  const [AsyncStorage] = useState(() => userData.scope());
  const t = useTheme(),
    { store, snapshot } = useApp(),
    { access } = useBilling();
  const [board, setBoard] = useState<Card[]>(() => freshBoard(p));
  const [ready, setReady] = useState(false),
    [now, setNow] = useState(() => timerNow());
  const [edit, setEdit] = useState<number | null>(null),
    [guide, setGuide] = useState(false);
  const [fullscreen, setFullscreen] = useState<number | null>(null);
  const [design, setDesign] = useState(false);
  const [recipesOpen, setRecipesOpen] = useState(false);
  const copyBusy = useRef(false);
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
  const key = `corptimer.board.${p.slug}${instance ? `-${instance}` : ""}`;
  current.current = board;
  const running = board.some((c) => c.anchor !== null || !!c.scheduledAt);
  function cue(name: string, which = "bell") {
    if (!sound || which === "off") return;
    if (which === "custom" && options.customSound && access?.customize) {
      void playCustomCue(options.customSound.uri).catch(() =>
        setNote("Your audio could not be played. Try MP3 or WAV."),
      );
      return;
    }
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
      .then(
        async (saved) =>
          saved ??
          (instance ? await AsyncStorage.getItem(key + ".setup") : null),
      )
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
  }, [key, p.mode, instance]);
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
      `board.${p.slug}${instance ? `-${instance}` : ""}`,
      plan,
      options.sound ? "bell" : "off",
      p.slug,
    ).catch(() =>
      setNote(
        "Background alerts could not be scheduled. Keep this timer open.",
      ),
    );
  }, [
    board,
    ready,
    p.mode,
    p.slug,
    instance,
    options,
    store.settings.notifications,
  ]);
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
        `board.${p.slug}${instance ? `-${instance}` : ""}`,
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
  async function saveCopy(cards: Card[] = setup(), savedOptions = options) {
    if (copyBusy.current) return;
    copyBusy.current = true;
    try {
      requireCustomization();
      const id = Crypto.randomUUID();
      const copyKey = `corptimer.board.custom-timer-${id}`;
      const data = JSON.stringify({
        board: cards,
        options: savedOptions,
        session: null,
        sessionOwner: null,
      });
      await checkLibraryCapacity([
        [copyKey + ".setup", data],
        [copyKey, data],
      ]);
      await AsyncStorage.setItem(copyKey + ".setup", data);
      await AsyncStorage.setItem(copyKey, data);
      if (AsyncStorage.current())
        router.push({
          pathname: "/specialty/[slug]",
          params: { slug: "custom-timer", instance: id },
        });
    } finally {
      copyBusy.current = false;
    }
  }
  return (
    <Page>
      <Stack.Screen options={{ title: tr(p.title) }} />
      {specialtyArt[p.slug] || p.slug === "custom-timer" ? (
        <Image
          source={specialtyArt[p.slug] ?? require("../../../assets/simple.jpg")}
          contentFit="contain"
          style={{ width: "100%", height: 120 }}
          accessibilityLabel={tr("{0} illustration", tr(p.title))}
        />
      ) : null}
      <Row>
        <Action
          label={tr("Customize timer")}
          testID="customize-timer"
          tone="primary"
          disabled={!ready || running}
          onPress={() =>
            customize(() => {
              setEdit(0);
              setDesign(false);
            })
          }
        />
        <Action
          label={tr("Creation guide")}
          onPress={() => router.push("/timer-guide")}
        />
      </Row>
      <Row>
        <Action
          label={
            design
              ? tr("Hide colors, logo & sounds")
              : tr("Colors, logo & sounds")
          }
          testID="timer-brand-options"
          onPress={() => customize(() => setDesign(!design))}
        />
        {p.slug === "custom-timer" ? (
          <Action
            label={recipesOpen ? tr("Hide recipes") : tr("Choose a recipe")}
            testID="custom-recipes-toggle"
            onPress={() => setRecipesOpen(!recipesOpen)}
          />
        ) : null}
      </Row>
      {edit !== null ? (
        <Action label={tr("Close editor")} onPress={() => setEdit(null)} />
      ) : null}
      {edit !== null && board[edit] && access?.customize ? (
        <ClockEditor
          key={edit}
          card={board[edit]}
          mode={p.mode}
          hasCustomSound={!!options.customSound}
          onChange={(value) => customize(() => patch(edit, value))}
          onRemove={() =>
            customize(() => {
              if (board.length > 1)
                setBoard((b) => b.filter((_, n) => n !== edit));
              setEdit(null);
            })
          }
        />
      ) : null}
      {design && access?.customize ? (
        <TimerBrandEditor
          value={options}
          onChange={(v) =>
            customize(
              () =>
                void files(async () => {
                  const next = {
                    ...options,
                    accent: v.accent,
                    logo: v.logo,
                    customSound: v.customSound,
                  };
                  await checkLibraryCapacity([
                    [
                      key,
                      JSON.stringify({
                        board: current.current,
                        options: next,
                        session: session.current,
                        sessionOwner: sessionOwner.current,
                      }),
                    ],
                  ]);
                  requireCustomization();
                  if (AsyncStorage.current()) setOptions(next);
                }),
            )
          }
        />
      ) : null}
      {p.slug === "custom-timer" && recipesOpen ? (
        <>
          <Heading>{tr("Try a complete recipe")}</Heading>
          <Body muted>
            {tr(
              "Each recipe creates its own saved timer in Library. Example durations are editable.",
            )}
          </Body>
          <Row>
            {customRecipes.map((r) => (
              <Action
                key={r.id}
                testID={`custom-recipe-${r.id}`}
                label={tr(r.title)}
                disabled={running}
                onPress={() =>
                  customize(
                    () =>
                      void files(async () => {
                        const recipe = recipeSetup(r.id);
                        await saveCopy(
                          recipe.board,
                          boardOptions(recipe.options, p),
                        );
                      }),
                  )
                }
              />
            ))}
          </Row>
        </>
      ) : null}
      <Modal
        visible={fullscreen !== null}
        animationType="fade"
        onRequestClose={() => setFullscreen(null)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: t.clock }}>
          <ScrollView
            contentContainerStyle={{
              flexGrow: 1,
              justifyContent: "center",
              padding: 24,
              gap: 20,
            }}
          >
            {fullscreen !== null && board[fullscreen] ? (
              <>
                <Image
                  source={
                    specialtyArt[p.slug] ??
                    require("../../../assets/simple.jpg")
                  }
                  contentFit="contain"
                  style={{ width: 120, height: 72, alignSelf: "center" }}
                  accessibilityLabel={tr("{0} illustration", tr(p.title))}
                />
                {options.logo && access?.customize ? (
                  <Image
                    source={{ uri: options.logo.uri }}
                    contentFit="contain"
                    style={{ width: 180, height: 64, alignSelf: "center" }}
                  />
                ) : null}
                <Text
                  style={{ color: t.cream, fontSize: 26, textAlign: "center" }}
                >
                  {cardName(board[fullscreen].name)}
                </Text>
                <Text
                  style={{
                    color: t.bright,
                    fontSize: 22,
                    textAlign: "center",
                  }}
                >
                  {stageName(
                    board[fullscreen].stages[board[fullscreen].index].name,
                  )}
                </Text>
                <Text
                  accessibilityRole="timer"
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  style={{
                    color: t.cream,
                    fontSize: 100,
                    textAlign: "center",
                    fontVariant: ["tabular-nums"],
                  }}
                >
                  {display(board[fullscreen], p.mode, now)}
                </Text>
                {p.slug === "egg-timer" ? (
                  <EggDoneness
                    card={board[fullscreen]}
                    stageNames={eggStageNames}
                    compact
                  />
                ) : null}
                {p.mode !== "up" ? (
                  <StageProgress
                    card={board[fullscreen]}
                    now={now}
                    accent={access?.customize ? options.accent : undefined}
                  />
                ) : null}
                <Row>
                  <Action
                    label={
                      board[fullscreen].anchor === null
                        ? tr("Start")
                        : tr("Pause")
                    }
                    tone="cream"
                    disabled={
                      pending ||
                      board[fullscreen].done ||
                      !!board[fullscreen].waiting
                    }
                    onPress={() => action(fullscreen, "toggle")}
                  />
                  <Action
                    label={tr("Next stage")}
                    tone="cream"
                    disabled={pending || board[fullscreen].done}
                    onPress={() =>
                      action(fullscreen, p.mode === "up" ? "lap" : "next")
                    }
                  />
                </Row>
              </>
            ) : null}
            <Action
              label={tr("Exit full screen")}
              tone="cream"
              onPress={() => setFullscreen(null)}
            />
          </ScrollView>
        </SafeAreaView>
      </Modal>
      <View style={{ gap: 6 }}>
        <Body muted>{tr(p.description)}</Body>
        <Body muted style={{ fontSize: 14, lineHeight: 20 }}>
          {tr(
            "Background alerts follow Settings. Up to 48 upcoming alerts across timers are scheduled; keep long sessions open. Voice and repeated cues play in the app.",
          )}
        </Body>
      </View>
      {options.logo && access?.customize ? (
        <Image
          source={{ uri: options.logo.uri }}
          contentFit="contain"
          style={{ width: 180, height: 64 }}
          accessibilityLabel={options.logo.name}
        />
      ) : (
        <BrandLogo />
      )}
      {note ? <Body>{note}</Body> : null}
      <Row>
        <Action
          label={
            pending
              ? tr("Checking access…")
              : p.mode === "turn"
                ? tr("Start first player")
                : tr("Start all")
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
          label={tr("Pause all")}
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
          label={tr("Reset board")}
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
                  testID={`board-name-${i}`}
                  style={{
                    color: t.cream,
                    fontSize: 22,
                    fontFamily: "Cantata",
                  }}
                >
                  {cardName(c.name)}
                </Text>
                <Row>
                  <Action
                    label={tr("Full screen")}
                    tone="cream"
                    onPress={() => setFullscreen(i)}
                  />
                </Row>
                <Text style={{ color: t.bright, fontSize: 16 }}>
                  {stageName(phase.name)} ·{" "}
                  {c.done
                    ? tr("Finished")
                    : c.waiting
                      ? tr("Ready for next stage")
                      : c.scheduledAt
                        ? tr("Scheduled")
                        : c.anchor === null
                          ? tr("Paused / ready")
                          : tr("Running")}
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
                    {tr("A moment without watching the clock.")}
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
                    {tr("{0} signal", tr(signal))}
                  </Text>
                ) : null}
                {p.slug === "egg-timer" ? (
                  <EggDoneness card={c} stageNames={eggStageNames} />
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
                      {tr("Score ")}
                      {Number(c.score) || 0}
                    </Text>
                    <Row>
                      <Action
                        label={tr("−1 point")}
                        tone="cream"
                        onPress={() =>
                          patch(i, {
                            score: Math.max(0, (Number(c.score) || 0) - 1),
                          })
                        }
                      />
                      <Action
                        label={tr("+1 point")}
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
                  <StageProgress
                    card={c}
                    now={now}
                    accent={access?.customize ? options.accent : undefined}
                  />
                ) : null}
                <Row>
                  <Action
                    label={c.anchor === null ? tr("Start") : tr("Pause")}
                    tone="cream"
                    disabled={pending || c.done || !!c.waiting}
                    onPress={() => action(i, "toggle")}
                  />
                  <Action
                    label={
                      p.mode === "up"
                        ? tr("Lap")
                        : p.mode === "turn"
                          ? tr("Next player")
                          : tr("Next stage")
                    }
                    tone="cream"
                    disabled={pending || c.done}
                    onPress={() => action(i, p.mode === "up" ? "lap" : "next")}
                  />
                  <Action
                    label={tr("Reset")}
                    tone="cream"
                    onPress={() => action(i, "reset")}
                  />
                </Row>
              </View>
              <Row>
                {p.mode !== "up" ? (
                  <>
                    <Action
                      label={tr("+1 minute")}
                      onPress={() => action(i, "add")}
                    />
                    <Action
                      label={tr("−1 minute")}
                      onPress={() => action(i, "subtract")}
                    />
                  </>
                ) : null}
                <Action
                  label={edit === i ? tr("Close editor") : tr("Edit clock")}
                  onPress={() =>
                    customize(() => setEdit(edit === i ? null : i))
                  }
                  disabled={c.anchor !== null}
                />
              </Row>
              {c.laps.map((v, j) => (
                <Body key={j}>
                  {tr("Lap ")}
                  {(c.lapOffset ?? 0) + j + 1}: {(v / 1000).toFixed(2)}
                  {tr(" s · split")}{" "}
                  {((v - (c.laps[j - 1] ?? c.lapBase ?? 0)) / 1000).toFixed(2)}{" "}
                  {tr("s")}
                </Body>
              ))}
            </View>
          );
        })
      ) : (
        <Body>{tr("Restoring clocks…")}</Body>
      )}
      <Rule />
      <Heading>{tr("Setup & options")}</Heading>

      <TimerFavoriteControls id={instance ? `${p.slug}-${instance}` : p.slug} />
      <Body muted>
        {tr(
          "Clocks continue by elapsed time while away. Keep this screen open for stage sounds; background alerts follow Settings and its schedule limit. Up to 500 recent laps are kept.",
        )}
      </Body>
      <Action
        label={tr("Add clock")}
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
          label={tr("Hide clock digits")}
          value={hideDigits}
          onChange={(hideDigits) => setOptions((o) => ({ ...o, hideDigits }))}
        />
      ) : null}
      <Toggle
        label={tr("Stage sounds while the app is open")}
        value={sound}
        onChange={(sound) => setOptions((o) => ({ ...o, sound }))}
      />
      {p.slug === "toothbrushing-timer" ? (
        <Toggle
          label={tr("Show brushing zones")}
          value={kidsView}
          onChange={(kidsView) => setOptions((o) => ({ ...o, kidsView }))}
        />
      ) : null}
      {p.slug === "speech-timer" ? (
        <>
          <Heading>{tr("Speech signals")}</Heading>
          {(["green", "amber", "red"] as const).map((color) => (
            <DurationField
              key={color}
              label={tr(
                "{0} · seconds",
                String(color[0].toUpperCase() + color.slice(1)),
              )}
              value={signalDraft[color]}
              onChangeText={(v) =>
                setSignalDraft((d) => ({ ...d, [color]: v }))
              }
            />
          ))}
          <Action
            label={tr("Apply signals")}
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
          <Heading>{tr("Serve dishes together")}</Heading>
          <Body muted>
            {tr("Keep this screen open for scheduled dish starts.")}
          </Body>
          <DurationField
            label={tr("Serve in · minutes")}
            unit="minutes"
            value={serve}
            onChangeText={setServe}
          />
          <Action
            label={tr("Schedule dishes")}
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
        {p.mode === "sequence" ? (
          <Action
            label={tr("Save as new timer")}
            testID="save-custom-copy"
            disabled={pending || running}
            onPress={() => customize(() => void files(() => saveCopy()))}
          />
        ) : null}
        <Action
          label={tr("Save setup")}
          testID="save-board-setup"
          onPress={() =>
            customize(
              () =>
                void files(async () => {
                  const data = JSON.stringify({ board: setup(), options });
                  await checkLibraryCapacity([[key + ".setup", data]]);
                  await AsyncStorage.setItem(key + ".setup", data);
                  setNote("Setup saved on this device.");
                }),
            )
          }
        />
        <Action
          label={tr("Load setup")}
          testID="load-board-setup"
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
          label={tr("Export setup")}
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
          label={tr("Import setup")}
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
          label={tr("Export CSV")}
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
        label={guide ? tr("Hide instructions") : tr("How to use & advice")}
        onPress={() => setGuide(!guide)}
      />
      {guide ? (
        <>
          {specialtyArt[p.slug] || p.slug === "custom-timer" ? (
            <Image
              source={
                specialtyArt[p.slug] ?? require("../../../assets/simple.jpg")
              }
              contentFit="contain"
              style={{ width: "100%", aspectRatio: 1200 / 630 }}
              accessibilityLabel={tr("{0} stage diagram", tr(p.title))}
            />
          ) : null}
          <Heading>{tr("How to use")}</Heading>
          <Body>{tr(p.use)}</Body>
          <Heading>{tr("Advice")}</Heading>
          <Body>{tr(p.tip)}</Body>
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
  hasCustomSound,
}: {
  hasCustomSound: boolean;
  card: Card;
  mode: string;
  onChange: (value: Partial<Card>) => void;
  onRemove: () => void;
}) {
  const tr = useTranslate();
  const [stages, setStages] = useState(card.stages),
    [name, setName] = useState(card.name),
    [times, setTimes] = useState(() =>
      card.stages.map((s) => String(s.seconds)),
    ),
    [error, setError] = useState("");
  return (
    <View style={{ gap: 16 }}>
      <Field
        label={tr("Clock name")}
        value={name}
        maxLength={80}
        onChangeText={setName}
      />
      {stages.map((s, j) => (
        <View key={j} style={{ gap: 8 }}>
          <Field
            label={tr("Stage {0} name", String(j + 1))}
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
              label={tr("Stage {0} · seconds", String(j + 1))}
              value={times[j]}
              onChangeText={(v) =>
                setTimes((a) => a.map((x, n) => (n === j ? v : x)))
              }
            />
          ) : null}
          <Body muted>{tr("Stage end sound")}</Body>
          <Row>
            {[
              "bell",
              "gong",
              "beep",
              "click",
              "off",
              ...(hasCustomSound ? ["custom"] : []),
            ].map((cue) => (
              <Action
                key={cue}
                label={cue === "custom" ? tr("My sound") : cue}
                tone={(s.cueEnd ?? "bell") === cue ? "primary" : "outline"}
                onPress={() =>
                  setStages((a) =>
                    a.map((x, n) => (n === j ? { ...x, cueEnd: cue } : x)),
                  )
                }
              />
            ))}
          </Row>
          <Row>
            <Action
              label={tr("Move earlier")}
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
              label={tr("Remove stage")}
              disabled={stages.length < 2}
              onPress={() => {
                setStages((a) => a.filter((_, n) => n !== j));
                setTimes((a) => a.filter((_, n) => n !== j));
              }}
            />
          </Row>
        </View>
      ))}
      <Toggle
        label={tr("Automatically advance to next stage")}
        value={card.automatic !== false}
        onChange={(automatic) => onChange({ automatic })}
      />
      <Action
        label={tr("Add stage")}
        disabled={stages.length >= 100}
        onPress={() => {
          setStages((a) => [...a, { name: "Next stage", seconds: 60 }]);
          setTimes((a) => [...a, "60"]);
        }}
      />
      <Body muted>
        {tr(
          "Changing durations or the number of stages resets this clock and its laps. Renaming keeps the current timing.",
        )}
      </Body>
      <Action
        label={tr("Apply clock changes")}
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
                  lapOffset: 0,
                  lapBase: 0,
                  hasStarted: false,
                }
              : {}),
          });
          setError("Clock updated.");
        }}
      />
      <Action label={tr("Remove clock")} onPress={onRemove} />
      {error ? <Body>{error}</Body> : null}
    </View>
  );
}

function StageProgress({
  card,
  now,
  accent,
}: {
  card: Card;
  now: number;
  accent?: string;
}) {
  const tr = useTranslate();
  const t = useTheme();
  const remaining = card.done ? 0 : card.stages.length - card.index - 1;
  return (
    <View style={{ gap: 12 }}>
      <View
        accessibilityLabel={tr(
          "{0} stages remaining after this one",
          String(remaining),
        )}
        style={{ flexDirection: "row", gap: 4, height: 14 }}
      >
        {card.stages.map((s, i) => (
          <View
            key={i}
            style={{
              flex: s.seconds,
              minWidth: 3,
              borderRadius: 3,
              backgroundColor: t.clockTrack,
              overflow: "hidden",
              borderWidth: 1,
              borderColor: accent ?? t.bright,
            }}
          >
            <View
              style={{
                height: "100%",
                width: `${card.done || i < card.index ? 100 : i === card.index ? Math.min(100, (elapsed(card, now) / Math.max(1, s.seconds * 1000)) * 100) : 0}%`,
                backgroundColor: accent ?? t.bright,
              }}
            />
          </View>
        ))}
      </View>
      <Text style={{ color: t.cream, fontSize: 16 }}>
        {card.done
          ? tr("All stages finished")
          : tr(
              "{0} next stages · Next: {1}",
              String(remaining),
              String(card.stages[card.index + 1]?.name ?? "Finish"),
            )}
      </Text>
    </View>
  );
}
