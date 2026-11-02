import React, { useCallback, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useFocusEffect } from "expo-router";
import { View } from "react-native";
import profiles from "../core/specialty-catalog.json";
import { savedBoardSummary, type SavedBoardSummary } from "../core/library";
import { userData } from "../services/user-data";
import { Action, Body, Heading, Row, confirm } from "./ui";
export function SavedBoards({ query }: { query: string }) {
  const [storage] = useState(() => userData.scope());
  const [items, setItems] = useState<SavedBoardSummary[]>([]);
  const [note, setNote] = useState("");
  useFocusEffect(
    useCallback(() => {
      let active = true;
      void (async () => {
        await userData.flush();
        const keys = (await AsyncStorage.getAllKeys()).filter((k) =>
          /^corptimer\.board\.[a-z0-9-]+\.setup$/.test(k),
        );
        const rows = await AsyncStorage.multiGet(keys);
        const summaries = rows.map(([key, value]) =>
          savedBoardSummary(
            key,
            value,
            profiles.map((p) => p.slug),
          ),
        );
        if (active) {
          setItems(summaries.filter((x): x is SavedBoardSummary => x !== null));
          setNote(
            summaries.some((x) => x === null)
              ? "Some saved setups could not be read. Their original data has been kept."
              : "",
          );
        }
      })().catch(() => {
        if (active)
          setNote("Saved setups could not be read. Try reopening Library.");
      });
      return () => {
        active = false;
      };
    }, []),
  );
  const filtered = items.filter((p) =>
    (p.title + " " + p.slug).toLowerCase().includes(query.trim().toLowerCase()),
  );
  return (
    <View style={{ gap: 12 }}>
      <Heading>Your custom & specialty setups</Heading>
      <Body muted>
        Open a timer to continue its current state. Load setup inside the timer
        restores its saved starting plan.
      </Body>
      {note ? <Body>{note}</Body> : null}
      {!filtered.length ? (
        <Body muted>
          {query
            ? "No matching saved setups."
            : "Choose Save setup or Save as new timer in a custom or specialty timer to keep it here."}
        </Body>
      ) : null}
      {filtered.map((item) => (
        <View key={item.key} style={{ gap: 10, paddingVertical: 10 }}>
          <Heading>{item.title}</Heading>
          <Body muted>
            {item.count} {item.count === 1 ? "clock" : "clocks"} - saved on this
            device
          </Body>
          <Row>
            <Action
              label="Open timer"
              tone="primary"
              onPress={() =>
                router.push({
                  pathname: "/specialty/[slug]",
                  params: {
                    slug: item.instance ? "custom-timer" : item.slug,
                    ...(item.instance ? { instance: item.instance } : {}),
                  },
                })
              }
            />
            <Action
              label="Delete saved setup"
              onPress={() =>
                void (async () => {
                  if (
                    !(await confirm(
                      "Delete saved setup?",
                      "This removes the saved starting plan. The current timer state stays on this device.",
                    ))
                  )
                    return;
                  try {
                    await storage.removeItem(item.key);
                    setItems((current) =>
                      current.filter((p) => p.key !== item.key),
                    );
                  } catch {
                    setNote("Could not delete this setup. Try again.");
                  }
                })()
              }
            />
          </Row>
        </View>
      ))}
    </View>
  );
}
