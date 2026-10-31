import React, { useCallback, useState } from "react";
import { Text, View, Pressable } from "react-native";
import { userData } from "../services/user-data";
import { router, useFocusEffect } from "expo-router";
import profiles from "../core/specialty-catalog.json";
import { Action, Body, Field, Heading, Row } from "./ui";
import { useTheme } from "../theme";
import { catalog } from "../core/catalog";
export const favoritesKey = "corptimer.library.v1";
export type Preferences = { favorites: string[]; home: string | null };
export function openTimer(id: string, replace = false) {
  const method = replace ? router.replace : router.push;
  if (id === "custom-timer" || profiles.some((p) => p.slug === id))
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
          if (s) {
            const p = JSON.parse(s);
            if (Array.isArray(p.favorites)) setPrefs(p);
          }
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
export function SpecialtyLibrary() {
  const [AsyncStorage] = useState(() => userData.scope());
  const t = useTheme(),
    [open, setOpen] = useState(""),
    [query, setQuery] = useState(""),
    [prefs, setPrefs] = useState<Preferences>({ favorites: [], home: null });
  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem(favoritesKey)
        .then((s) => {
          if (s) {
            const p = JSON.parse(s);
            if (Array.isArray(p.favorites)) setPrefs(p);
          }
        })
        .catch(() => {});
    }, [AsyncStorage]),
  );
  const link = (slug: string) =>
    router.push({ pathname: "/specialty/[slug]", params: { slug } });
  return (
    <View style={{ gap: 16 }}>
      <Heading>Timer library</Heading>
      <Field
        label="Find a specialty timer"
        value={query}
        onChangeText={setQuery}
        placeholder="Kitchen, breathing, speech…"
        containerStyle={{ flexGrow: 0, flexBasis: "auto" }}
      />
      <Action
        label="Create a custom timer"
        onPress={() => openTimer("custom-timer")}
      />
      {prefs.favorites.length > 0 ? (
        <>
          <Body>Favorites</Body>
          <Row>
            {prefs.favorites.map((slug) => {
              const p =
                profiles.find((x) => x.slug === slug) ||
                catalog.find((x) => x.kind === slug);
              return p ? (
                <Action
                  key={slug}
                  label={p.title}
                  onPress={() => openTimer(slug)}
                />
              ) : null;
            })}
          </Row>
        </>
      ) : null}
      {["Everyday", "Sports", "Learning & events", "Professional"].map(
        (category) => (
          <View key={category}>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ expanded: open === category }}
              onPress={() => setOpen(open === category ? "" : category)}
              style={{
                paddingVertical: 18,
                borderBottomWidth: 1,
                borderBottomColor: t.line,
              }}
            >
              <Text
                style={{ color: t.ink, fontSize: 22, fontFamily: "Cantata" }}
              >
                {category} {open === category ? "−" : "+"}
              </Text>
            </Pressable>
            {open === category || query.trim()
              ? profiles
                  .filter(
                    (p) =>
                      p.category === category &&
                      `${p.title} ${p.description}`
                        .toLowerCase()
                        .includes(query.toLowerCase().trim()),
                  )
                  .map((p) => (
                    <Pressable
                      key={p.slug}
                      accessibilityRole="button"
                      onPress={() => link(p.slug)}
                      style={{
                        paddingVertical: 16,
                        gap: 6,
                        borderBottomWidth: 1,
                        borderBottomColor: t.line,
                      }}
                    >
                      <Text style={{ color: t.ink, fontSize: 18 }}>
                        {p.title}
                      </Text>
                      <Body muted>{p.description}</Body>
                    </Pressable>
                  ))
              : null}
          </View>
        ),
      )}
    </View>
  );
}
