import { useTranslate } from "../state/language";
import React, { useState } from "react";
import { router } from "expo-router";
import { Text, View } from "react-native";
import * as Crypto from "expo-crypto";
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
import { SavedBoards } from "../components/saved-boards";
import { HistoryScreen } from "./history";
import { catalog } from "../core/catalog";
import { readBackup, writeBackup } from "../core/backup";
import { useApp } from "../state/app-store";
import { importFile, exportFile } from "../services/files";
import { useTheme } from "../theme";

export function ProgramsScreen() {
  const tr = useTranslate();
  const confirm = useConfirm();
  const {
      store,
      updateDraft,
      deleteProgram,
      duplicateProgram,
      importPrograms,
      notify,
      act,
    } = useApp(),
    t = useTheme(),
    [query, setQuery] = useState(""),
    [busy, setBusy] = useState(false),
    [section, setSection] = useState<"saved" | "history">("saved");
  const programs = store.programs.filter((p) =>
    `${p.name} ${p.kind}`.toLowerCase().includes(query.toLowerCase()),
  );
  async function load() {
    setBusy(true);
    try {
      const json = await importFile();
      if (json !== null) importPrograms(readBackup(json, Crypto.randomUUID));
    } catch (e) {
      notify(
        e instanceof Error ? e.message : tr("Could not import this file."),
      );
    } finally {
      setBusy(false);
    }
  }
  async function backup() {
    setBusy(true);
    try {
      await exportFile("corptimer-programs.json", writeBackup(store.programs));
    } catch (e) {
      notify(e instanceof Error ? e.message : tr("Could not export programs."));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Page>
      <Row>
        <Action
          label={tr("Saved programs")}
          tone={section === "saved" ? "primary" : "outline"}
          onPress={() => setSection("saved")}
        />
        <Action
          label={tr("History")}
          tone={section === "history" ? "primary" : "outline"}
          onPress={() => setSection("history")}
        />
      </Row>
      {section === "history" ? (
        <HistoryScreen embedded />
      ) : (
        <>
          <Body muted>
            {tr("Set it up once. Make it yours. Saved on this device.")}
          </Body>
          <Row>
            <Action
              label={busy ? tr("Working…") : tr("Import")}
              disabled={busy}
              onPress={() => void load()}
            />
            <Action
              label={tr("Export programs")}
              disabled={busy || !store.programs.length}
              onPress={() => void backup()}
            />
          </Row>
          <Field
            label={tr("Find a program")}
            value={query}
            onChangeText={setQuery}
            placeholder={tr("Search by name or timer")}
          />
          <SavedBoards query={query} />
          <Heading>{tr("Saved programs")}</Heading>
          {!programs.length && (
            <>
              <Heading>
                {store.programs.length
                  ? tr("No matching programs")
                  : tr("Your next routine starts here.")}
              </Heading>
              <Body>
                {store.programs.length
                  ? tr("Try another name or clear the search.")
                  : tr(
                      "Open a timer, edit its setup and choose Save program. You can also import a setup or meeting backup from corptimer.com.",
                    )}
              </Body>
              <Action
                label={tr("Browse timers")}
                onPress={() => router.navigate("/(tabs)/timers")}
              />
            </>
          )}
          {programs.map((p) => (
            <View key={p.id} style={{ gap: 12, paddingVertical: 12 }}>
              <Text
                style={{ fontFamily: "Cantata", fontSize: 23, color: t.ink }}
              >
                {p.name}
              </Text>
              <Body muted>
                {catalog.find((c) => c.kind === p.kind)?.title} ·{" "}
                {new Date(p.updatedAt).toLocaleDateString()}
              </Body>
              <Row>
                <Action
                  label={tr("Open")}
                  tone="primary"
                  onPress={() =>
                    void (async () => {
                      if (store.run?.kind === p.kind) {
                        if (
                          store.run.status !== "done" &&
                          !(await confirm(
                            tr("Load this program?"),
                            tr(
                              "The active run will finish and move to History.",
                            ),
                          ))
                        )
                          return;
                        act("reset");
                      }
                      updateDraft(p.kind, p.config, true);
                      router.push(`/timer/${p.kind}`);
                    })()
                  }
                />
                <Action
                  label={tr("Export")}
                  onPress={() =>
                    void exportFile(
                      "corptimer-program.json",
                      writeBackup([p]),
                    ).catch((e) => notify(e.message))
                  }
                />
                <Action
                  label={tr("Delete")}
                  onPress={() =>
                    void confirm(
                      tr("Delete saved program?"),
                      tr("Remove “{0}” from this device?", String(p.name)),
                    ).then((ok) => {
                      if (ok) deleteProgram(p.id);
                    })
                  }
                />
              </Row>
              <Row>
                <Action
                  label={tr("Edit")}
                  onPress={() =>
                    p.kind === "meeting"
                      ? router.push({
                          pathname: "/save-meeting",
                          params: { id: p.id },
                        })
                      : router.push({
                          pathname: "/edit/[kind]",
                          params: { kind: p.kind, programId: p.id },
                        })
                  }
                />
                <Action
                  label={tr("Duplicate")}
                  onPress={() => duplicateProgram(p.id)}
                />
              </Row>
              <Rule />
            </View>
          ))}
        </>
      )}
    </Page>
  );
}
