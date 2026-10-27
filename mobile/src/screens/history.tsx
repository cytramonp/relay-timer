import React, { useState } from "react";
import { View } from "react-native";
import {
  Action,
  Body,
  confirm,
  Heading,
  Page,
  Row,
  Rule,
} from "../components/ui";
import { formatTime } from "../core/clock";
import { csv } from "../core/backup";
import { useApp } from "../state/app-store";
import { exportFile } from "../services/files";
import type { Report } from "../core/types";

export function HistoryScreen() {
  const { store } = useApp();
  return (
    <Page>
      <Body muted>
        Your last 100 finished sessions. Private and saved on this device.
      </Body>
      {!store.history.length ? (
        <>
          <Heading>A little time well spent.</Heading>
          <Body>
            Finish a timer to see its results here. Resetting an active timer
            also saves the run.
          </Body>
        </>
      ) : (
        store.history.map((r) => <ReportRow key={r.id} report={r} />)
      )}
    </Page>
  );
}
function ReportRow({ report: r }: { report: Report }) {
  const { removeReport, notify } = useApp(),
    [open, setOpen] = useState(false);
  async function download() {
    const rows: (string | number)[][] = [
      ["CorpTimer", r.title],
      ["Finished", new Date(r.finishedAt).toISOString()],
      ["Elapsed seconds", r.elapsed / 1000],
      [],
      ["Stage", "Planned seconds", "Actual seconds"],
      ...r.entries.map((e) => [e.name, e.planned / 1000, e.actual / 1000]),
      [],
      ["Lap", "Split seconds", "Total seconds"],
      ...r.laps.map((lap, i) => [
        i + 1,
        (lap - (r.laps[i - 1] ?? 0)) / 1000,
        lap / 1000,
      ]),
      [],
      ["Private notes", r.notes],
    ];
    try {
      await exportFile("corptimer-results.csv", csv(rows), "text/csv");
    } catch (e) {
      notify(e instanceof Error ? e.message : "Could not export results.");
    }
  }
  return (
    <View style={{ gap: 12, paddingBottom: 10 }}>
      <Heading>{r.title}</Heading>
      <Body muted>
        {new Date(r.finishedAt).toLocaleString()} · {formatTime(r.elapsed)}
      </Body>
      <Row>
        <Action
          label={open ? "Hide results" : "View results"}
          onPress={() => setOpen(!open)}
        />
        <Action label="Export CSV" onPress={() => void download()} />
        <Action
          label="Delete"
          onPress={() =>
            void confirm(
              "Delete this result?",
              `Remove “${r.title}” from History?`,
            ).then((ok) => {
              if (ok) removeReport(r.id);
            })
          }
        />
      </Row>
      {open && (
        <View style={{ gap: 12 }}>
          {r.entries.length > 0 && <Body muted>Stage · planned / actual</Body>}
          {r.entries.map((e, i) => (
            <Row key={i} style={{ justifyContent: "space-between" }}>
              <Body style={{ flex: 1 }}>{e.name}</Body>
              <Body>
                {formatTime(e.planned)} / {formatTime(e.actual)}
              </Body>
            </Row>
          ))}
          {r.laps.map((lap, i) => (
            <Body key={i}>
              Lap {i + 1}: {formatTime(lap - (r.laps[i - 1] ?? 0), true)} ·
              total {formatTime(lap, true)}
            </Body>
          ))}
          {r.notes && (
            <>
              <Heading>Private notes</Heading>
              <Body>{r.notes}</Body>
            </>
          )}
        </View>
      )}
      <Rule />
    </View>
  );
}
