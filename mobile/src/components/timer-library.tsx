import React, { useCallback, useState } from "react";
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
          prefs.favorites.includes(id) ? "Remove favorite" : "Add to favorites"
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
        label={prefs.home === id ? "Clear start timer" : "Make start timer"}
        onPress={() => save({ ...prefs, home: prefs.home === id ? null : id })}
      />
      {prefs.favorites.includes(id) && prefs.favorites.length > 1
        ? [-1, 1].map((delta) => (
            <Action
              key={delta}
              label={delta < 0 ? "Previous favorite" : "Next favorite"}
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
  const filtered = [...entries, ...customEntries].filter(
    (p) =>
      (!favoritesOnly || prefs.favorites.includes(p.id)) &&
      (p.title + " " + p.description + " " + p.category)
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
  );
  const groups = grouped
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
          label="Create your timer"
          tone="primary"
          onPress={() => openTimer("custom-timer")}
        />
      ) : null}
      <Row>
        <Action
          label="Show all"
          tone={!grouped ? "primary" : "outline"}
          onPress={() => setGrouped(false)}
        />
        <Action
          label="Group timers"
          tone={grouped ? "primary" : "outline"}
          onPress={() => setGrouped(true)}
        />
      </Row>
      <Field
        label={favoritesOnly ? "Find a favorite" : "Find a timer"}
        value={query}
        onChangeText={setQuery}
        placeholder="Meeting, boxing, kitchen, breathing..."
        containerStyle={{ flexGrow: 0, flexBasis: "auto" }}
      />
      <Body muted>
        {filtered.length} {favoritesOnly ? "favorites" : "timers"} - tap a star
        to save or remove a favorite
      </Body>
      {!filtered.length ? (
        <>
          <Heading>
            {query ? "No matching timers" : "Keep your favorites close."}
          </Heading>
          <Body>
            {query
              ? "Try another name or clear your search."
              : "Star any timer in Timers. It will appear here, ready for your next session."}
          </Body>
          {favoritesOnly ? (
            <Action
              label="Browse timers"
              onPress={() => router.navigate("/(tabs)/timers")}
            />
          ) : null}
        </>
      ) : null}
      {groups.map((category) => {
        const items = grouped
          ? filtered.filter((p) => p.category === category)
          : filtered;
        const closed = grouped && collapsed.includes(category) && !query.trim();
        return (
          <View key={category} style={{ gap: 10 }}>
            {grouped ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={category + ", " + items.length + " timers"}
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
                  {category} - {items.length}
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
                      accessibilityLabel={"Open " + p.title + " timer"}
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
                      accessibilityLabel={
                        (prefs.favorites.includes(p.id) ? "Remove " : "Add ") +
                        p.title +
                        (prefs.favorites.includes(p.id)
                          ? " from favorites"
                          : " to favorites")
                      }
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
