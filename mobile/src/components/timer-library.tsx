import { useTranslate } from "../state/language";
import { matchesTimerSearch } from "../core/language";
import React, { useCallback, useMemo, useState } from "react";
import { Text, View, Pressable } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { specialtyArt } from "../core/specialty-art";
import { userData } from "../services/user-data";
import { router, useFocusEffect } from "expo-router";
import profiles from "../core/specialty-catalog.json";
import { Action, Body, Field, Heading, Row } from "./ui";
import { useTheme } from "../theme";
import { catalog } from "../core/catalog";
import {
  readPreferences,
  customInstance,
  savedBoardSummary,
  type Preferences,
} from "../core/library";
import DeviceStorage from "@react-native-async-storage/async-storage";
export const favoritesKey = "corptimer.library.v1";
export type { Preferences } from "../core/library";
export function openTimer(id: string, replace = false) {
  const method = replace ? router.replace : router.push;
  const instance = customInstance(id);
  if (instance)
    method({
      pathname: "/specialty/[slug]",
      params: { slug: "custom-timer", instance },
    });
  else if (id === "custom-timer" || profiles.some((p) => p.slug === id))
    method({ pathname: "/specialty/[slug]", params: { slug: id } });
  else if (catalog.some((p) => p.kind === id))
    method({ pathname: "/timer/[kind]", params: { kind: id } });
}
export function TimerFavoriteControls({ id }: { id: string }) {
  const tr = useTranslate();
  const [AsyncStorage] = useState(() => userData.scope());
  const [prefs, setPrefs] = useState<Preferences>({
    favorites: [],
    home: null,
  });
  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem(favoritesKey)
        .then((s) => {
          setPrefs(readPreferences(s));
        })
        .catch(() => {});
    }, [AsyncStorage]),
  );
  function save(next: Preferences) {
    setPrefs(next);
    void AsyncStorage.setItem(favoritesKey, JSON.stringify(next)).catch(
      () => {},
    );
  }
  return (
    <Row>
      <Action
        label={
          prefs.favorites.includes(id)
            ? tr("Remove favorite")
            : tr("Add to favorites")
        }
        onPress={() =>
          save({
            ...prefs,
            favorites: prefs.favorites.includes(id)
              ? prefs.favorites.filter((x) => x !== id)
              : [...prefs.favorites, id],
          })
        }
      />
      <Action
        label={
          prefs.home === id ? tr("Clear start timer") : tr("Make start timer")
        }
        onPress={() => save({ ...prefs, home: prefs.home === id ? null : id })}
      />
      {prefs.favorites.includes(id) && prefs.favorites.length > 1
        ? [-1, 1].map((delta) => (
            <Action
              key={delta}
              label={delta < 0 ? tr("Previous favorite") : tr("Next favorite")}
              onPress={() =>
                openTimer(
                  prefs.favorites[
                    (prefs.favorites.indexOf(id) +
                      delta +
                      prefs.favorites.length) %
                      prefs.favorites.length
                  ],
                  true,
                )
              }
            />
          ))
        : null}
    </Row>
  );
}

const primaryArt = [
  require("../../assets/boxing.jpg"),
  require("../../assets/fitness.jpg"),
  require("../../assets/pomodoro.jpg"),
  require("../../assets/classroom.jpg"),
  require("../../assets/chess.jpg"),
  require("../../assets/stopwatch.jpg"),
  require("../../assets/simple.jpg"),
  require("../../assets/newyear.jpg"),
];
const entries = [
  ...catalog.map((p) => ({
    id: p.kind as string,
    title: p.title,
    description: p.description,
    category: "Popular timers",
    art:
      p.image === undefined
        ? require("../../assets/icon.png")
        : primaryArt[p.image],
  })),
  ...profiles.map((p) => ({
    id: p.slug,
    title: p.title,
    description: p.description,
    category: p.category,
    art: specialtyArt[p.slug],
  })),
  {
    id: "custom-timer",
    title: "Custom timer",
    description: "Build your own stages, sounds and colors.",
    category: "Your creations",
    art: require("../../assets/icon.png"),
  },
];

export const SpecialtyLibrary = React.memo(function SpecialtyLibrary({
  favoritesOnly = false,
}: {
  favoritesOnly?: boolean;
}) {
  const [storage] = useState(() => userData.scope());
  const t = useTheme();
  const tr = useTranslate();
  const [customEntries, setCustomEntries] = useState<typeof entries>([]);
  const [grouped, setGrouped] = useState(false);
  const [collapsed, setCollapsed] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [prefs, setPrefs] = useState<Preferences>({
    favorites: [],
    home: null,
  });
  useFocusEffect(
    useCallback(() => {
      let active = true;
      void storage
        .getItem(favoritesKey)
        .then((raw) => {
          if (active) setPrefs(readPreferences(raw));
        })
        .catch(() => {});
      void (async () => {
        await userData.flush();
        const keys = (await DeviceStorage.getAllKeys()).filter(
          (key) =>
            key.startsWith("corptimer.board.custom-timer-") &&
            key.endsWith(".setup"),
        );
        const values = await DeviceStorage.multiGet(keys);
        const saved = values
          .map(([key, raw]) => savedBoardSummary(key, raw, []))
          .filter((item) => item !== null);
        if (active)
          setCustomEntries(
            saved.map((item) => ({
              id: item.slug,
              title: item.title,
              description: "Your saved custom timer",
              category: "Your creations",
              art: require("../../assets/icon.png"),
            })),
          );
      })().catch(() => {});
      return () => {
        active = false;
      };
    }, [storage]),
  );
  const localized = useMemo(
    () => [
      ...entries.map((p) => ({
        ...p,
        title: tr(p.title),
        description: tr(p.description),
        source: [p.title, p.description, p.category],
      })),
      ...customEntries.map((p) => ({
        ...p,
        description: tr(p.description),
        source: [p.title, p.description, p.category],
      })),
    ],
    [tr, customEntries],
  );
  const filtered = localized.filter(
    (p) =>
      (!favoritesOnly || prefs.favorites.includes(p.id)) &&
      matchesTimerSearch(
        query,
        p.title,
        p.description,
        tr(p.category),
        ...p.source,
      ),
  );
  const showGroups = grouped && !query.trim();
  const groups = showGroups
    ? [...new Set(filtered.map((p) => p.category))]
    : ["All timers"];
  function toggleFavorite(id: string) {
    const next = {
      ...prefs,
      favorites: prefs.favorites.includes(id)
        ? prefs.favorites.filter((x) => x !== id)
        : [...prefs.favorites, id],
    };
    setPrefs(next);
    void storage.setItem(favoritesKey, JSON.stringify(next)).catch(() => {});
  }
  return (
    <View style={{ gap: 16 }}>
      {!favoritesOnly ? (
        <Action
          label={tr("Create your timer")}
          tone="primary"
          onPress={() => openTimer("custom-timer")}
        />
      ) : null}
      <Row>
        <Action
          label={tr("Show all")}
          tone={!grouped ? "primary" : "outline"}
          onPress={() => setGrouped(false)}
        />
        <Action
          label={tr("Group timers")}
          tone={grouped ? "primary" : "outline"}
          onPress={() => setGrouped(true)}
        />
      </Row>
      <Field
        label={favoritesOnly ? tr("Find a favorite") : tr("Find a timer")}
        value={query}
        onChangeText={setQuery}
        placeholder={tr("Search by name or activity")}
        autoCorrect={false}
        testID="timer-library-search"
        containerStyle={{ flexGrow: 0, flexBasis: "auto" }}
      />
      {query ? (
        <Action
          label={tr("Clear search")}
          testID="clear-timer-search"
          onPress={() => setQuery("")}
        />
      ) : null}
      <Body muted>
        {tr(favoritesOnly ? "{0} favorites" : "{0} timers", filtered.length)}
        {" · "}
        {tr("Tap a star to save or remove a favorite")}
      </Body>
      {!filtered.length ? (
        <>
          <Heading>
            {query
              ? tr("No matching timers")
              : tr("Keep your favorites close.")}
          </Heading>
          <Body>
            {query
              ? tr("Try another name or clear your search.")
              : tr(
                  "Star any timer in Timers. It will appear here, ready for your next session.",
                )}
          </Body>
          {favoritesOnly ? (
            <Action
              label={tr("Browse timers")}
              onPress={() => router.navigate("/(tabs)/timers")}
            />
          ) : null}
        </>
      ) : null}
      {groups.map((category) => {
        const items = showGroups
          ? filtered.filter((p) => p.category === category)
          : filtered;
        const closed = showGroups && collapsed.includes(category);
        return (
          <View key={category} style={{ gap: 10 }}>
            {showGroups ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={tr(
                  "{0}, {1} timers",
                  tr(category),
                  items.length,
                )}
                accessibilityState={{ expanded: !closed }}
                onPress={() =>
                  setCollapsed((current) =>
                    current.includes(category)
                      ? current.filter((x) => x !== category)
                      : [...current, category],
                  )
                }
                style={{
                  minHeight: 48,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <Text
                  style={{
                    flex: 1,
                    color: t.ink,
                    fontFamily: "Cantata",
                    fontSize: 22,
                  }}
                >
                  {tr(category)} - {items.length}
                </Text>
                <Ionicons
                  name={closed ? "chevron-down" : "chevron-up"}
                  size={20}
                  color={t.teal}
                />
              </Pressable>
            ) : null}
            {!closed
              ? items.map((p) => (
                  <View
                    key={p.id}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      borderWidth: 1,
                      borderColor: t.line,
                      borderRadius: 16,
                      backgroundColor: t.field,
                      overflow: "hidden",
                    }}
                  >
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={tr("Open {0} timer", p.title)}
                      onPress={() => openTimer(p.id)}
                      style={({ pressed }) => ({
                        flex: 1,
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 12,
                        padding: 12,
                        minHeight: 104,
                        opacity: pressed ? 0.65 : 1,
                      })}
                    >
                      <Image
                        source={p.art}
                        contentFit="contain"
                        style={{ width: 64, height: 64, borderRadius: 10 }}
                      />
                      <View style={{ flex: 1, gap: 5 }}>
                        <Text
                          style={{
                            fontFamily: "Cantata",
                            fontSize: 20,
                            color: t.ink,
                          }}
                        >
                          {p.title}
                        </Text>
                        <Body muted style={{ fontSize: 14, lineHeight: 20 }}>
                          {p.description}
                        </Body>
                      </View>
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={tr(
                        prefs.favorites.includes(p.id)
                          ? "Remove {0} from favorites"
                          : "Add {0} to favorites",
                        p.title,
                      )}
                      accessibilityState={{
                        selected: prefs.favorites.includes(p.id),
                      }}
                      onPress={() => toggleFavorite(p.id)}
                      style={{
                        minWidth: 48,
                        minHeight: 64,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Ionicons
                        name={
                          prefs.favorites.includes(p.id)
                            ? "star"
                            : "star-outline"
                        }
                        size={23}
                        color={prefs.favorites.includes(p.id) ? t.red : t.teal}
                      />
                    </Pressable>
                  </View>
                ))
              : null}
          </View>
        );
      })}
    </View>
  );
});
