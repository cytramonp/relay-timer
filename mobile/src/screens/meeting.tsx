import React, { useCallback, useEffect, useState } from "react";
import {
  Pressable,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { router } from "expo-router";
import Animated, {
  scrollTo,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useFrameCallback,
  useSharedValue,
} from "react-native-reanimated";
import * as Crypto from "expo-crypto";
import * as Haptics from "expo-haptics";
import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";
import { useApp } from "../state/app-store";
import { metrics, useTheme } from "../theme";
import {
  allocate,
  meetingView,
  moveBoundary,
  totalSeconds,
} from "../core/meeting";
import { defaultConfig } from "../core/catalog";
import {
  Action,
  Body,
  confirm,
  Field,
  Heading,
  Notice,
  Row,
  Rule,
  Toggle,
} from "../components/ui";
import { MeetingClock, IconAction } from "../components/meeting-clock";
import { MeetingTimeline } from "../components/meeting-timeline";
import { AgendaRow } from "../components/agenda-row";
import type { Config } from "../core/types";
import { useLive } from "../state/live-store";

export function MeetingScreen() {
  const live = useLive();
  const {
      store,
      editMeeting,
      start,
      act,
      seekMeeting,
      parking,
      notes,
      notify,
    } = useApp(),
    t = useTheme(),
    { height, width } = useWindowDimensions();
  const run = store.run?.kind === "meeting" ? store.run : null,
    config = run && run.status !== "done" ? run.config : store.drafts.meeting;
  const [now, setNow] = useState(Date.now),
    [dragging, setDragging] = useState(false),
    [topic, setTopic] = useState(""),
    [owner, setOwner] = useState(""),
    [editingItem, setEditingItem] = useState<string | null>(null);
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    if (run?.status === "running" && store.settings.keepAwake)
      void activateKeepAwakeAsync("meeting").catch(() => {});
    return () => {
      void deactivateKeepAwake("meeting");
    };
  }, [run?.status, store.settings.keepAwake]);
  const view = meetingView(config, run, now),
    items = run?.parking ?? store.meetingParking ?? [],
    wide = width >= 900;
  const scrollRef = useAnimatedRef<Animated.ScrollView>(),
    scroll = useSharedValue(0),
    maxScroll = useSharedValue(0),
    index = useSharedValue(-1),
    target = useSharedValue(-1),
    dy = useSharedValue(0),
    pointer = useSharedValue(-1),
    originScroll = useSharedValue(0);
  const drag = { index, target, dy, pointer, scroll, originScroll };
  const scrollHandler = useAnimatedScrollHandler((e) => {
    scroll.value = e.contentOffset.y;
  });
  useFrameCallback(() => {
    if (index.value < 0 || pointer.value < 0) return;
    const velocity =
      pointer.value > height - 140 ? 8 : pointer.value < 140 ? -8 : 0;
    if (velocity) {
      const next = Math.max(
        0,
        Math.min(maxScroll.value, scroll.value + velocity),
      );
      dy.value += next - scroll.value;
      scroll.set(next);
      target.value = Math.max(
        0,
        Math.min(
          config.agenda.length - 1,
          Math.round(index.value + dy.value / metrics.row),
        ),
      );
      scrollTo(scrollRef, 0, next, false);
    }
  });
  function change(c: Config) {
    try {
      editMeeting(c);
    } catch (e) {
      notify(e instanceof Error ? e.message : "Could not update this meeting.");
    }
  }
  async function begin() {
    if (
      store.run &&
      store.run.kind !== "meeting" &&
      store.run.status !== "done" &&
      !(await confirm(
        "Start this meeting?",
        "The current timer will finish and move to History.",
      ))
    )
      return;
    start("meeting");
  }
  async function reset() {
    if (!run) return;
    if (
      run.status !== "done" &&
      !(await confirm(
        "Reset this meeting?",
        "The current session and its results will be kept in History.",
        true,
      ))
    )
      return;
    act("reset");
  }
  const onMove = useCallback(
    (from: number, to: number) => {
      if (from === to || to < 0 || to >= config.agenda.length) return;
      const agenda = [...config.agenda],
        [slot] = agenda.splice(from, 1);
      agenda.splice(to, 0, slot);
      editMeeting({ ...config, agenda });
      if (store.settings.haptics) void Haptics.selectionAsync().catch(() => {});
    },
    [config, editMeeting, store.settings.haptics],
  );
  function menu(id: string, action: string) {
    const at = config.agenda.findIndex((a) => a.id === id),
      item = config.agenda[at];
    if (action === "up" || action === "down") {
      onMove(at, at + (action === "up" ? -1 : 1));
      return;
    }
    if (action === "remove") {
      const agenda = config.agenda.filter((a) => a.id !== id);
      change(allocate({ ...config, agenda }, run));
    }
    if (action === "pin") {
      const agenda = config.agenda.map((a) =>
        a.id === id ? { ...a, pinned: !item.pinned } : a,
      );
      change(allocate({ ...config, agenda }, run));
    }
  }
  function add(kind: "person" | "topic") {
    if (config.agenda.length >= 200) {
      notify("Use up to 200 agenda slots.");
      return;
    }
    const agenda = [...config.agenda],
      item = {
        id: Crypto.randomUUID(),
        name:
          kind === "topic"
            ? "Discussion"
            : `Speaker ${config.agenda.filter((a) => a.kind !== "topic").length + 1}`,
        seconds: kind === "topic" ? 120 : 480,
        kind,
      };
    const at =
      kind === "topic"
        ? run && run.status !== "done"
          ? config.agenda.findIndex((a) => a.id === view.current?.id) + 1
          : 0
        : agenda.length;
    agenda.splice(at, 0, item);
    change(allocate({ ...config, agenda }, run));
  }
  const clock = (
    <View style={{ gap: 16 }}>
      <MeetingClock
        config={config}
        run={run}
        now={now}
        onNext={() => (run ? act("next") : void begin())}
        onToggle={() => act("toggle")}
        onUndo={() => act("undo")}
        onReset={() => void reset()}
        onExtend={() => act("extend")}
        onFocus={() => router.push("/focus")}
      />
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <Action
          label="Float timer"
          onPress={() => router.push("/floating")}
          tone="primary"
        />
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push("/meeting-options")}
          style={{ minHeight: 48, justifyContent: "center" }}
        >
          <Text style={{ fontSize: 12, color: t.teal }}>
            {config.automatic ? "Auto advance" : "Wait for the host"} · Settings
          </Text>
        </Pressable>
      </View>
      <MeetingTimeline
        config={config}
        run={run}
        now={now}
        onBoundary={(i, position) =>
          change(moveBoundary(config, run, i, position))
        }
        onClock={(delta) => act(delta < 0 ? "clock-back" : "clock-forward")}
        onSeek={seekMeeting}
      />
      <Row style={{ justifyContent: "space-between" }}>
        <Action
          label="Equal times"
          onPress={() =>
            change(
              allocate(
                config,
                run,
                config.autoSplit ? config.total : totalSeconds(config.agenda),
                true,
              ),
            )
          }
        />
        <Action
          label="Session report"
          onPress={() => router.push("/meeting-report")}
          disabled={!run}
        />
      </Row>
      <Toggle
        label="Keep proportions when changing durations"
        value={config.keepProp}
        onChange={(keepProp) => change({ ...config, keepProp })}
      />
    </View>
  );
  const agenda = (
    <View style={{ gap: 14 }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        <View style={{ gap: 5 }}>
          <Text
            accessibilityRole="header"
            style={{ fontFamily: "Cantata", fontSize: 25, color: t.ink }}
          >
            Run of show
          </Text>
          <Text style={{ fontSize: 12, color: t.muted }}>
            {config.agenda.filter((a) => a.kind !== "topic").length} people ·{" "}
            {config.agenda.filter((a) => a.kind === "topic").length} topics
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Edit total meeting minutes"
          onPress={() => router.push("/meeting-options")}
          style={{
            minHeight: 52,
            paddingHorizontal: 12,
            borderWidth: 1,
            borderColor: t.line,
            borderRadius: 10,
            alignItems: "center",
            justifyContent: "center",
            gap: 3,
          }}
        >
          <Text style={{ fontSize: 11, color: t.muted }}>Total, min</Text>
          <Text style={{ fontSize: 19, color: t.ink, fontFamily: "Manrope" }}>
            {Math.round((totalSeconds(config.agenda) / 60) * 100) / 100}
          </Text>
        </Pressable>
      </View>
      <Text style={{ color: t.muted, fontSize: 12, lineHeight: 18 }}>
        Drag a handle to reorder. Tap a time to edit it.
      </Text>
      <View
        style={{
          flexDirection: "row",
          paddingLeft: 44,
          paddingRight: 44,
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        <Text style={{ color: t.muted, fontSize: 11 }}>Speaker / topic</Text>
        <Text style={{ color: t.muted, fontSize: 11 }}>Plan / available</Text>
      </View>
      <View>
        {view.rows.map((a, i) => (
          <AgendaRow
            key={a.id}
            item={a}
            index={i}
            count={config.agenda.length}
            state={a.state}
            available={a.available}
            drag={drag}
            onMove={onMove}
            onRename={(id, name) =>
              change({
                ...config,
                agenda: config.agenda.map((a) =>
                  a.id === id ? { ...a, name } : a,
                ),
              })
            }
            onDuration={(id) =>
              router.push({ pathname: "/meeting-slot", params: { id } })
            }
            onMenu={menu}
            onDrag={setDragging}
          />
        ))}
      </View>
      <Row>
        <Action label="Add speaker" onPress={() => add("person")} />
        <Action label="Add topic" onPress={() => add("topic")} />
        <Action
          label="Save a copy"
          onPress={() => router.push("/save-meeting")}
        />
      </Row>
      {totalSeconds(config.agenda) > config.total && config.autoSplit && (
        <Body style={{ color: t.dangerText }}>
          Topics and fixed slots exceed your meeting total. Increase the total
          or unpin a duration.
        </Body>
      )}
    </View>
  );
  return (
    <Animated.ScrollView
      ref={scrollRef}
      onScroll={scrollHandler}
      scrollEventThrottle={16}
      scrollEnabled={!dragging}
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      style={{ flex: 1, backgroundColor: t.bg }}
      onContentSizeChange={(_, h) => {
        maxScroll.set(Math.max(0, h - (height - 170)));
      }}
      contentContainerStyle={{
        padding: metrics.page,
        paddingBottom: 42,
        gap: 24,
        maxWidth: 1200,
        width: "100%",
        alignSelf: "center",
      }}
    >
      <Notice />
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 10,
        }}
      >
        <TextInput
          accessibilityLabel="Meeting name"
          key={config.title}
          defaultValue={config.title}
          onEndEditing={(e) =>
            change({
              ...config,
              title: e.nativeEvent.text.trim() || config.title,
            })
          }
          maxLength={120}
          style={{
            flex: 1,
            minWidth: 0,
            fontFamily: "Cantata",
            color: t.ink,
            fontSize: 28,
            minHeight: 48,
            paddingVertical: 4,
          }}
        />
        <IconAction
          icon="share-outline"
          label="Share live meeting"
          onPress={() => router.push("/meeting-share")}
        />
      </View>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 10,
          marginTop: -12,
        }}
      >
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push("/meeting-templates")}
          style={{
            minHeight: 48,
            paddingHorizontal: 14,
            borderWidth: 1,
            borderColor: t.line,
            borderRadius: 10,
            justifyContent: "center",
          }}
        >
          <Text style={{ fontFamily: "Manrope", fontSize: 13, color: t.teal }}>
            Templates
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() =>
            void (async () => {
              if (
                run &&
                run.status !== "done" &&
                !(await confirm(
                  "Create a new meeting?",
                  "The current session will be saved in History.",
                ))
              )
                return;
              if (live.host) {
                try {
                  await live.stop();
                } catch (e) {
                  notify(
                    e instanceof Error ? e.message : "Stop live sharing first.",
                  );
                  return;
                }
              }
              if (run) act("reset");
              editMeeting(defaultConfig("meeting"));
            })()
          }
          style={{
            minHeight: 48,
            justifyContent: "center",
            paddingHorizontal: 8,
          }}
        >
          <Text style={{ fontSize: 13, color: t.muted }}>New meeting</Text>
        </Pressable>
      </View>
      {wide ? (
        <View
          style={{ flexDirection: "row", alignItems: "flex-start", gap: 26 }}
        >
          <View style={{ flex: 1 }}>{clock}</View>
          <View style={{ flex: 1 }}>{agenda}</View>
        </View>
      ) : (
        <>
          {clock}
          <Rule />
          {agenda}
        </>
      )}
      <Rule />
      <View style={{ gap: 12 }}>
        <Heading>For later</Heading>
        <Body muted>Park the tangent. Keep the conversation moving.</Body>
        <Field
          label="Topic or action item"
          value={topic}
          onChangeText={setTopic}
          maxLength={500}
          placeholder="Something to come back to…"
        />
        <Field label="Owner (optional)" value={owner} onChangeText={setOwner} />
        <Action
          label={editingItem ? "Save item" : "Add item"}
          disabled={!topic.trim()}
          onPress={() => {
            const item = {
              id: Crypto.randomUUID(),
              text: topic.trim(),
              owner: owner.trim(),
              done: false,
            };
            parking(
              editingItem
                ? items.map((a) =>
                    a.id === editingItem
                      ? { ...a, text: item.text, owner: item.owner }
                      : a,
                  )
                : [...items, item],
            );
            setEditingItem(null);
            setTopic("");
            setOwner("");
          }}
        />
        {editingItem && (
          <Action
            label="Cancel edit"
            onPress={() => {
              setEditingItem(null);
              setTopic("");
              setOwner("");
            }}
          />
        )}
        {!items.length && (
          <Body muted>
            Nothing parked yet. These notes stay off the live screen.
          </Body>
        )}
        {items.map((item) => (
          <View
            key={item.id}
            style={{
              gap: 6,
              paddingVertical: 8,
              borderBottomWidth: 1,
              borderColor: t.line,
            }}
          >
            <Toggle
              label={item.text + (item.owner ? ` · ${item.owner}` : "")}
              value={item.done}
              onChange={(done) =>
                parking(
                  items.map((a) => (a.id === item.id ? { ...a, done } : a)),
                )
              }
            />
            <Row>
              <Action
                label="Edit"
                onPress={() => {
                  setTopic(item.text);
                  setOwner(item.owner);
                  setEditingItem(item.id);
                }}
              />
              <Action
                label="Remove"
                onPress={() => parking(items.filter((a) => a.id !== item.id))}
              />
            </Row>
          </View>
        ))}
      </View>
      {run && (
        <View style={{ gap: 12 }}>
          <Heading>Private notes</Heading>
          <TextInput
            accessibilityLabel="Private meeting notes"
            multiline
            value={run.notes}
            onChangeText={notes}
            maxLength={10000}
            placeholder="Decisions and next steps…"
            placeholderTextColor={t.muted}
            style={{
              minHeight: 120,
              padding: 14,
              borderWidth: 1,
              borderColor: t.line,
              borderRadius: 12,
              color: t.ink,
              backgroundColor: t.field,
              textAlignVertical: "top",
              fontSize: 16,
            }}
          />
        </View>
      )}
      <Rule />
      <Body muted>
        Unused time passes to the next speaker. Finish early, and the next
        person gets more room. Overrun, and their available time adjusts.
      </Body>
      <Row>
        <Action
          label="Import / export"
          onPress={() => router.push("/(tabs)/programs")}
        />
        <Action
          label="Timing settings"
          onPress={() => router.push("/meeting-options")}
        />
      </Row>
    </Animated.ScrollView>
  );
}
