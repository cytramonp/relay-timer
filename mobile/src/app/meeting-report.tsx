import { useTranslate } from "../state/language";
import React, { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import * as Clipboard from "expo-clipboard";
import * as Print from "expo-print";
import { Action, Body, Heading, Page, Row, Rule } from "../components/ui";
import {
  meetingCSV,
  meetingReport,
  reportHTML,
  reportText,
} from "../core/meeting-report";
import { formatTime } from "../core/clock";
import { useApp } from "../state/app-store";
import { useTheme } from "../theme";
import { exportFile } from "../services/files";
export default function ReportSheet() {
  const tr = useTranslate();
  const { reportId } = useLocalSearchParams<{ reportId?: string }>();
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const { store, notify } = useApp(),
    t = useTheme(),
    [selected, setSelected] = useState(reportId ?? "current");
  const current =
      store.run?.kind === "meeting" ? meetingReport(store.run, now) : null,
    saved = store.history.filter((r) => r.kind === "meeting"),
    report =
      selected === "current"
        ? (current ?? saved[0])
        : saved.find((r) => r.id === selected);
  async function perform(task: () => Promise<unknown>) {
    try {
      await task();
    } catch (e) {
      notify(
        e instanceof Error ? e.message : tr("Could not export this report."),
      );
    }
  }
  return (
    <Page>
      <Stack.Screen
        options={{ title: tr("Session report"), presentation: "formSheet" }}
      />
      <Heading>{tr("How the meeting went.")}</Heading>
      <Row>
        {current && (
          <Action
            label={tr("Current session")}
            tone={selected === "current" ? "primary" : "outline"}
            onPress={() => setSelected("current")}
          />
        )}
        {saved.slice(0, 10).map((r, i) => (
          <Action
            key={r.id}
            label={tr("Saved {0}", String(i + 1))}
            tone={selected === r.id ? "primary" : "outline"}
            onPress={() => setSelected(r.id)}
          />
        ))}
      </Row>
      {!report ? (
        <Body>
          {tr("Start a meeting to see its original plan and actual timing.")}
        </Body>
      ) : (
        <>
          <Body>{report.title}</Body>
          <View
            style={{
              padding: 16,
              gap: 5,
              borderRadius: 12,
              backgroundColor: t.soft,
            }}
          >
            <Body>
              {tr("Original plan ·")}{" "}
              {formatTime(report.entries.reduce((n, a) => n + a.planned, 0))}
            </Body>
            <Body>
              {tr("Actual · ")}
              {formatTime(report.elapsed)}
            </Body>
          </View>
          <Body muted>{tr("Slot · original plan / actual")}</Body>
          {report.entries.map((e, i) => (
            <View
              key={e.id ?? i}
              style={{
                gap: 7,
                paddingVertical: 12,
                borderBottomWidth: 1,
                borderColor: t.line,
              }}
            >
              <Text style={{ color: t.ink, fontSize: 16, fontWeight: "600" }}>
                {e.name}
              </Text>
              <Row style={{ justifyContent: "space-between" }}>
                <Body muted>
                  {formatTime(e.planned)} /{" "}
                  {e.state === "pending" ? tr("pending") : formatTime(e.actual)}
                </Body>
                <Text
                  style={{
                    color: e.actual > e.planned ? t.dangerText : t.success,
                    fontSize: 13,
                  }}
                >
                  {e.state === "pending"
                    ? tr("Not yet")
                    : `${e.actual > e.planned ? "+" : "−"}${formatTime(Math.abs(e.actual - e.planned))}`}
                </Text>
              </Row>
            </View>
          ))}
          <Heading>
            {tr("Plan changes · ")}
            {report.planChanges?.length ?? 0}
          </Heading>
          {(report.planChanges ?? []).map((c, i) => (
            <Body key={i} muted>
              {tr("At ")}
              {formatTime(c.at)} ·{" "}
              {c.agenda
                .map((a) => `${a.name} ${a.seconds / 60} min`)
                .join(" / ")}
            </Body>
          ))}
          <Heading>{tr("For later")}</Heading>
          {report.parking?.length ? (
            report.parking.map((p) => (
              <Body key={p.id}>
                {p.done ? tr("Done") : tr("Open")}: {p.text}
                {p.owner ? ` · ${p.owner}` : ""}
              </Body>
            ))
          ) : (
            <Body muted>{tr("No follow-ups parked.")}</Body>
          )}
          {report.notes && (
            <>
              <Heading>{tr("Private notes")}</Heading>
              <Body>{report.notes}</Body>
            </>
          )}
          <Rule />
          <Row>
            <Action
              label={tr("Export CSV")}
              tone="primary"
              onPress={() =>
                void perform(() =>
                  exportFile(
                    "corptimer-meeting.csv",
                    meetingCSV(report),
                    "text/csv",
                  ),
                )
              }
            />
            <Action
              label={tr("Copy report")}
              onPress={() =>
                void perform(async () => {
                  await Clipboard.setStringAsync(reportText(report));
                  notify(tr("Report copied."));
                })
              }
            />
            <Action
              label={tr("Print / PDF")}
              onPress={() =>
                void perform(() =>
                  Print.printAsync({ html: reportHTML(report) }),
                )
              }
            />
          </Row>
        </>
      )}
    </Page>
  );
}
