import { Image } from "expo-image";
import { specialtyArt } from "../../core/specialty-art";
import React, { useEffect, useState } from "react";
import { Text, TextInput, View, StyleSheet, AppState } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useLocalSearchParams } from "expo-router";
import profiles from "../../core/specialty-catalog.json";
import {
  createBoard,
  act,
  settle,
  display,
  elapsed,
  type Card,
} from "../../core/board-engine";
import { Action, Body, Heading, Page, Row } from "../../components/ui";
import {
  favoritesKey,
  openTimer,
  type Preferences,
} from "../../components/timer-library";
import { useTheme } from "../../theme";
export default function SpecialtyTimer() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const p = profiles.find((x) => x.slug === slug);
  if (!p)
    return (
      <Page>
        <Heading>Timer not found</Heading>
        <Action
          label="Timer library"
          onPress={() => router.push("/(tabs)/timers")}
        />
      </Page>
    );
  return <Board key={p.slug} profile={p} />;
}
function Board({ profile: p }: { profile: (typeof profiles)[number] }) {
  const t = useTheme(),
    [board, setBoard] = useState<Card[]>(() => createBoard(p)),
    [ready, setReady] = useState(false),
    [now, setNow] = useState(() => Date.now()),
    [guide, setGuide] = useState(false),
    [prefs, setPrefs] = useState<Preferences>({ favorites: [], home: null }),
    [note, setNote] = useState("");
  const key = `corptimer.board.${p.slug}`;
  useEffect(() => {
    let live = true;
    AsyncStorage.getItem(key)
      .then((s) => {
        if (live && s) {
          const value = JSON.parse(s);
          if (
            Array.isArray(value) &&
            value.length > 0 &&
            value.length <= 12 &&
            value.every(
              (c) =>
                typeof c.name === "string" &&
                Array.isArray(c.stages) &&
                c.stages.length &&
                c.stages.every(
                  (stage: { name: string; seconds: number }) =>
                    typeof stage.name === "string" &&
                    Number.isFinite(stage.seconds) &&
                    stage.seconds >= 0,
                ) &&
                Number.isInteger(c.index) &&
                c.index >= 0 &&
                c.index < c.stages.length &&
                Number.isFinite(c.elapsed) &&
                Array.isArray(c.laps),
            )
          )
            setBoard(value.map((c) => ({ ...c, anchor: null })));
        }
      })
      .catch(() => setNote("Could not restore this board."))
      .finally(() => {
        if (live) setReady(true);
      });
    AsyncStorage.getItem(favoritesKey)
      .then((s) => {
        if (live && s) {
          const value = JSON.parse(s);
          if (Array.isArray(value.favorites)) setPrefs(value);
        }
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [key]);
  useEffect(() => {
    const id = setInterval(() => {
      const time = Date.now();
      setNow(time);
      setBoard((b) => {
        const next = b.map((c) => settle(c, p.mode, time));
        return next.some(
          (c, i) => c.index !== b[i].index || c.done !== b[i].done,
        )
          ? next
          : b;
      });
    }, 200);
    return () => clearInterval(id);
  }, [p.mode]);
  useEffect(() => {
    if (!ready) return;
    const save = () =>
      AsyncStorage.setItem(
        key,
        JSON.stringify(
          board.map((c) => ({
            ...c,
            elapsed: elapsed(c, Date.now()),
            anchor: null,
          })),
        ),
      ).catch(() => setNote("Could not save this board."));
    void save();
    const id = setInterval(save, 2000);
    const sub = AppState.addEventListener("change", (state) => {
      if (state !== "active") void save();
    });
    return () => {
      clearInterval(id);
      sub.remove();
    };
  }, [board, key, ready]);
  function action(i: number, a: string) {
    setBoard((b) => act(b, i, a, p.mode, Date.now()));
  }
  function preferences(next: Preferences) {
    setPrefs(next);
    void AsyncStorage.setItem(favoritesKey, JSON.stringify(next)).catch(() =>
      setNote("Could not save favorites."),
    );
  }
  function edit(
    i: number,
    j: number,
    field: "name" | "seconds",
    value: string,
  ) {
    setBoard((b) =>
      b.map((c, n) =>
        n !== i || c.anchor !== null || c.done
          ? c
          : {
              ...c,
              stages: c.stages.map((s, k) =>
                j !== k
                  ? s
                  : {
                      ...s,
                      [field]:
                        field === "seconds"
                          ? Math.max(1, Math.min(86400, Number(value) || 1))
                          : value,
                    },
              ),
            },
      ),
    );
  }
  const favorite = prefs.favorites.includes(p.slug);
  return (
    <Page>
      <Heading>{p.title}</Heading>
      <Body>{p.description}</Body>
      <Row>
        <Action
          label={favorite ? "Remove favorite" : "Add to favorites"}
          onPress={() =>
            preferences({
              ...prefs,
              favorites: favorite
                ? prefs.favorites.filter((s) => s !== p.slug)
                : [...prefs.favorites, p.slug],
            })
          }
        />
        <Action
          label={
            prefs.home === p.slug ? "Clear start timer" : "Make start timer"
          }
          onPress={() =>
            preferences({
              ...prefs,
              home: prefs.home === p.slug ? null : p.slug,
            })
          }
        />
        <Action
          label="All timers"
          onPress={() => router.push("/(tabs)/timers")}
        />
      </Row>
      {favorite && prefs.favorites.length > 1 ? (
        <Row>
          {[-1, 1].map((delta) => (
            <Action
              key={delta}
              label={delta < 0 ? "Previous favorite" : "Next favorite"}
              onPress={() => {
                const index = prefs.favorites.indexOf(p.slug);
                openTimer(
                  prefs.favorites[
                    (index + delta + prefs.favorites.length) %
                      prefs.favorites.length
                  ],
                  true,
                );
              }}
            />
          ))}
        </Row>
      ) : null}
      <Body muted>
        Keep this screen open. This board has visual stage changes; it does not
        schedule background alarms. Restored clocks are paused.
      </Body>
      {note ? <Body>{note}</Body> : null}
      <Row>
        <Action
          label={p.mode === "turn" ? "Start first player" : "Start all"}
          disabled={!ready}
          onPress={() => {
            const time = Date.now();
            setBoard((b) =>
              b.map((c, i) => {
                const n = settle(c, p.mode, time);
                return {
                  ...n,
                  elapsed: elapsed(n, time),
                  anchor:
                    !n.done && (p.mode !== "turn" || i === 0) ? time : null,
                };
              }),
            );
          }}
        />
        <Action
          label="Pause all"
          disabled={!ready}
          onPress={() => {
            const time = Date.now();
            setBoard((b) =>
              b.map((_, i) => act(b, i, "pause", p.mode, time)[i]),
            );
          }}
        />
        <Action
          label="Add clock"
          disabled={!ready || board.length >= 12}
          onPress={() =>
            setBoard((b) => [
              ...b,
              {
                ...createBoard({ ...p, count: 1 })[0],
                name: `Timer ${b.length + 1}`,
              },
            ])
          }
        />
      </Row>
      {ready ? (
        board.map((c, i) => (
          <View key={i} style={[styles.card, { borderColor: t.line }]}>
            <TextInput
              accessibilityLabel={`Clock ${i + 1} name`}
              value={c.name}
              maxLength={80}
              style={[styles.input, { color: t.ink, borderColor: t.line }]}
              onChangeText={(value) =>
                setBoard((b) =>
                  b.map((x, n) => (n === i ? { ...x, name: value } : x)),
                )
              }
            />
            <Body>
              {c.stages[c.index].name} ·{" "}
              {c.done
                ? "Finished"
                : c.anchor === null
                  ? "Paused / ready"
                  : "Running"}
            </Body>
            <Text style={[styles.clock, { color: t.teal }]}>
              {display(c, p.mode, now)}
            </Text>
            <Row>
              <Action
                label={c.anchor === null ? "Start" : "Pause"}
                onPress={() => action(i, "toggle")}
                disabled={c.done}
              />
              <Action
                label={
                  p.mode === "up"
                    ? "Lap"
                    : p.mode === "turn"
                      ? "Next player"
                      : "Next stage"
                }
                onPress={() => action(i, p.mode === "up" ? "lap" : "next")}
              />
              <Action label="Reset" onPress={() => action(i, "reset")} />
            </Row>
            {p.mode !== "up" ? (
              <Row>
                <Action label="+1 minute" onPress={() => action(i, "add")} />
                <Action
                  label="−1 minute"
                  onPress={() => action(i, "subtract")}
                />
              </Row>
            ) : null}
            {c.anchor === null && !c.done
              ? c.stages.map((s, j) => (
                  <View key={j} style={{ gap: 6 }}>
                    <TextInput
                      accessibilityLabel={`Clock ${i + 1} stage ${j + 1} name`}
                      value={s.name}
                      onChangeText={(v) => edit(i, j, "name", v)}
                      style={[
                        styles.input,
                        { color: t.ink, borderColor: t.line },
                      ]}
                    />
                    {p.mode !== "up" ? (
                      <TextInput
                        accessibilityLabel={`Clock ${i + 1} stage ${j + 1} seconds`}
                        keyboardType="number-pad"
                        value={String(s.seconds)}
                        onChangeText={(v) => edit(i, j, "seconds", v)}
                        style={[
                          styles.input,
                          { color: t.ink, borderColor: t.line },
                        ]}
                      />
                    ) : null}
                  </View>
                ))
              : null}
            {c.laps.map((v, j) => (
              <Body key={j}>
                Lap {j + 1}: {(v / 1000).toFixed(2)} s total ·{" "}
                {((v - (c.laps[j - 1] || 0)) / 1000).toFixed(2)} s split
              </Body>
            ))}
          </View>
        ))
      ) : (
        <Body>Loading saved board…</Body>
      )}
      <Action
        label={guide ? "Hide instructions" : "How to use & advice"}
        onPress={() => setGuide(!guide)}
      />
      {guide ? (
        <View style={{ gap: 14 }}>
          <Image
            source={specialtyArt[p.slug]}
            contentFit="contain"
            style={{ width: "100%", aspectRatio: 1200 / 630 }}
            accessibilityLabel={`${p.title} stage diagram`}
          />
          <Heading>How to use</Heading>
          <Body>{p.use}</Body>
          <Body>
            Pause a clock to edit its stages. Times are in seconds. Next stage
            advances early; Reset clears that clock and its laps.
          </Body>
          <Heading>Advice</Heading>
          <Body>{p.tip}</Body>
        </View>
      ) : null}
    </Page>
  );
}
const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 12, padding: 16, gap: 12 },
  input: { borderBottomWidth: 1, padding: 10, minHeight: 44, fontSize: 17 },
  clock: { fontSize: 52, fontVariant: ["tabular-nums"] },
});
